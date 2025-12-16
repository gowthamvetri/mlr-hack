/**
 * Hall Ticket Controller
 * Handles hall ticket generation, authorization, and download
 * Role-based access: Admin can generate/authorize, Students can download
 */

const HallTicket = require('../models/HallTicket');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Seating = require('../models/Seating');
const { generateHallTicketPDF, generateBulkHallTickets, generateQRCode } = require('../services/hallTicketService');
const path = require('path');
const fs = require('fs');

// @desc    Generate hall ticket for a single student
// @route   POST /api/hall-tickets/generate
// @access  Private/Admin
const generateSingleHallTicket = async (req, res) => {
    try {
        const { studentId, examId } = req.body;

        // Fetch student and exam
        const student = await User.findById(studentId);
        const exam = await Exam.findById(examId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if hall ticket already exists
        let hallTicket = await HallTicket.findOne({ student: studentId, exam: examId });

        // Get subjects from exam timetable or use exam itself
        const subjects = exam.timetable && exam.timetable.length > 0
            ? exam.timetable.filter(t => t.department === student.department)
            : [{
                code: exam.courseCode,
                name: exam.courseName,
                date: exam.date,
                session: exam.session || 'FN'
            }];

        // Get seating allocation if available
        const seating = await Seating.findOne({ exam: examId, student: studentId });

        // Generate PDF
        const pdfResult = await generateHallTicketPDF({
            student,
            exam,
            subjects,
            seating
        });

        // Create or update hall ticket record
        if (!hallTicket) {
            hallTicket = new HallTicket({
                student: student._id,
                exam: exam._id,
                rollNumber: student.rollNumber,
                studentName: student.name,
                department: student.department,
                year: student.year,
                semester: exam.semester,
                examType: exam.examType,
                subjects: subjects,
                qrCode: pdfResult.qrCode,
                qrData: pdfResult.qrData,
                pdfPath: pdfResult.filePath,
                pdfGeneratedAt: new Date(),
                roomNumber: seating?.roomNumber,
                seatNumber: seating?.seatNumber
            });
        } else {
            hallTicket.qrCode = pdfResult.qrCode;
            hallTicket.qrData = pdfResult.qrData;
            hallTicket.pdfPath = pdfResult.filePath;
            hallTicket.pdfGeneratedAt = new Date();
            hallTicket.subjects = subjects;
        }

        await hallTicket.save();

        res.status(201).json({
            message: 'Hall ticket generated successfully',
            hallTicket: {
                _id: hallTicket._id,
                studentName: hallTicket.studentName,
                rollNumber: hallTicket.rollNumber,
                pdfPath: pdfResult.filename,
                authorized: hallTicket.authorized
            }
        });
    } catch (error) {
        console.error('Generate hall ticket error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate hall tickets for all students in an exam
// @route   POST /api/hall-tickets/generate-bulk
// @access  Private/Admin
const generateBulkHallTicketsController = async (req, res) => {
    try {
        const { examId, department, year } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Build student query
        const studentQuery = { role: 'Student' };
        if (department) studentQuery.department = department;
        if (year) studentQuery.year = parseInt(year);

        const students = await User.find(studentQuery);

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found matching criteria' });
        }

        // Get subjects from exam timetable
        const subjects = exam.timetable && exam.timetable.length > 0
            ? exam.timetable
            : [{
                code: exam.courseCode,
                name: exam.courseName,
                date: exam.date,
                session: exam.session || 'FN'
            }];

        // Generate hall tickets
        const results = await generateBulkHallTickets(students, exam, subjects);

        // Save hall ticket records
        for (const ticket of results.tickets) {
            await HallTicket.findOneAndUpdate(
                { student: ticket.studentId, exam: examId },
                {
                    student: ticket.studentId,
                    exam: examId,
                    rollNumber: ticket.rollNumber,
                    studentName: students.find(s => s._id.toString() === ticket.studentId.toString())?.name,
                    department: students.find(s => s._id.toString() === ticket.studentId.toString())?.department,
                    examType: exam.examType,
                    semester: exam.semester,
                    qrCode: ticket.qrCode,
                    qrData: ticket.qrData,
                    pdfPath: ticket.filePath,
                    pdfGeneratedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // Update exam status
        exam.hallTicketsGenerated = true;
        await exam.save();

        // Send notification
        if (req.io) {
            req.io.to('role:Student').emit('notification', {
                title: 'Hall Tickets Generated',
                message: `Hall tickets for ${exam.examType} exams are now available.`,
                type: 'info'
            });
        }

        res.json({
            message: 'Bulk hall ticket generation completed',
            total: students.length,
            generated: results.generated,
            failed: results.failed,
            errors: results.errors
        });
    } catch (error) {
        console.error('Bulk generate error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authorize hall tickets for an exam (SEM exams require this)
// @route   PUT /api/hall-tickets/authorize/:examId
// @access  Private/Admin
const authorizeHallTickets = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Authorize all hall tickets for this exam
        const result = await HallTicket.updateMany(
            { exam: examId },
            {
                authorized: true,
                authorizedBy: req.user._id,
                authorizedAt: new Date()
            }
        );

        // Update exam status
        exam.hallTicketsAuthorized = true;
        await exam.save();

        // Send notification
        if (req.io) {
            req.io.to('role:Student').emit('notification', {
                title: 'Hall Tickets Authorized',
                message: `Hall tickets for ${exam.examType} exams have been authorized for download.`,
                type: 'success'
            });
        }

        res.json({
            message: 'Hall tickets authorized successfully',
            authorized: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get hall ticket for logged-in student
// @route   GET /api/hall-tickets/my-ticket/:examId
// @access  Private/Student
const getMyHallTicket = async (req, res) => {
    try {
        const { examId } = req.params;

        const hallTicket = await HallTicket.findOne({
            student: req.user._id,
            exam: examId
        }).populate('exam', 'courseName courseCode examType date startTime endTime');

        if (!hallTicket) {
            return res.status(404).json({ message: 'Hall ticket not found' });
        }

        if (!hallTicket.authorized && hallTicket.exam.examType === 'Semester') {
            return res.status(403).json({
                message: 'Hall ticket not yet authorized. Please wait for authorization.'
            });
        }

        res.json(hallTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download hall ticket PDF
// @route   GET /api/hall-tickets/download/:ticketId
// @access  Private/Student (own ticket) or Admin
const downloadHallTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const hallTicket = await HallTicket.findById(ticketId);

        if (!hallTicket) {
            return res.status(404).json({ message: 'Hall ticket not found' });
        }

        // Check authorization: Student can only download their own ticket
        if (req.user.role === 'Student' &&
            hallTicket.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if authorized for semester exams
        if (!hallTicket.authorized && req.user.role === 'Student') {
            return res.status(403).json({
                message: 'Hall ticket not yet authorized for download'
            });
        }

        // Check if PDF exists
        if (!hallTicket.pdfPath || !fs.existsSync(hallTicket.pdfPath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        // Update download count
        hallTicket.downloadCount = (hallTicket.downloadCount || 0) + 1;
        hallTicket.lastDownloadedAt = new Date();
        await hallTicket.save();

        // Send file
        res.download(hallTicket.pdfPath, `HallTicket_${hallTicket.rollNumber}.pdf`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all hall tickets for an exam (Admin view)
// @route   GET /api/hall-tickets/exam/:examId
// @access  Private/Admin
const getExamHallTickets = async (req, res) => {
    try {
        const { examId } = req.params;

        const hallTickets = await HallTicket.find({ exam: examId })
            .populate('student', 'name rollNumber department year')
            .sort({ rollNumber: 1 });

        res.json(hallTickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all hall tickets for logged-in student
// @route   GET /api/hall-tickets/my-tickets
// @access  Private/Student
const getMyHallTickets = async (req, res) => {
    try {
        const hallTickets = await HallTicket.find({ student: req.user._id })
            .populate('exam', 'courseName courseCode examType date semester')
            .sort({ 'exam.date': -1 });

        res.json(hallTickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate CONSOLIDATED hall tickets for all students in a year/department
// @route   POST /api/hall-tickets/generate-consolidated
// @access  Private/Admin
const generateConsolidatedHallTickets = async (req, res) => {
    try {
        const { year, department, examType = 'Semester' } = req.body;

        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }

        // Find all exams for this year/department (exclude parent schedule records)
        const examQuery = {
            year: parseInt(year),
            examType,
            $or: [
                { timetable: { $exists: false } },
                { timetable: { $size: 0 } }
            ]
        };
        if (department) {
            examQuery.department = department;
        }

        const exams = await Exam.find(examQuery).sort({ date: 1 });

        if (exams.length === 0) {
            return res.status(404).json({ message: 'No exams found for the given criteria' });
        }

        // Find all students for this year/department
        const studentQuery = { role: 'Student', year: parseInt(year) };
        if (department) {
            studentQuery.department = department;
        }

        const students = await User.find(studentQuery);

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found for the given criteria' });
        }

        // Convert exams to subjects format for hall ticket
        const subjects = exams.map(exam => ({
            code: exam.courseCode,
            name: exam.courseName,
            date: exam.date,
            session: exam.session || 'FN',
            examId: exam._id
        }));

        // Generate consolidated hall ticket for each student
        const results = {
            generated: 0,
            failed: 0,
            errors: []
        };

        for (const student of students) {
            try {
                // Filter subjects by student's department
                const studentSubjects = department
                    ? subjects
                    : subjects.filter(s => exams.find(e => e._id.toString() === s.examId?.toString())?.department === student.department);

                if (studentSubjects.length === 0) continue;

                // Get seating info if available (from first exam)
                const seating = await Seating.findOne({
                    student: student._id,
                    exam: { $in: exams.map(e => e._id) }
                });

                // Generate the consolidated PDF
                const pdfResult = await generateHallTicketPDF({
                    student,
                    exam: {
                        _id: `consolidated-${year}-${Date.now()}`,
                        examType,
                        semester: `Year ${year} - ${examType} Exams`,
                        courseName: 'Consolidated Hall Ticket'
                    },
                    subjects: studentSubjects,
                    seating
                });

                // Create or update hall ticket record (consolidated type)
                await HallTicket.findOneAndUpdate(
                    {
                        student: student._id,
                        year: parseInt(year),
                        examType,
                        // Use first exam as reference for consolidation
                        exam: exams[0]._id
                    },
                    {
                        student: student._id,
                        exam: exams[0]._id,
                        rollNumber: student.rollNumber,
                        studentName: student.name,
                        department: student.department,
                        year: parseInt(year),
                        examType,
                        semester: `Year ${year}`,
                        subjects: studentSubjects,
                        qrCode: pdfResult.qrCode,
                        qrData: pdfResult.qrData,
                        pdfPath: pdfResult.filePath,
                        pdfGeneratedAt: new Date(),
                        roomNumber: seating?.roomNumber,
                        seatNumber: seating?.seatNumber,
                        authorized: false
                    },
                    { upsert: true, new: true }
                );

                results.generated++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    studentId: student._id,
                    rollNumber: student.rollNumber,
                    error: error.message
                });
            }
        }

        // Update all exams to mark hall tickets generated
        await Exam.updateMany(
            { _id: { $in: exams.map(e => e._id) } },
            { hallTicketsGenerated: true }
        );

        // Send notification
        if (req.io) {
            req.io.to('role:Student').emit('notification', {
                title: 'Hall Tickets Generated',
                message: `Consolidated hall tickets for Year ${year} ${examType} exams are now available.`,
                type: 'info'
            });
        }

        res.json({
            message: 'Consolidated hall tickets generated successfully',
            year,
            department: department || 'All',
            examType,
            totalStudents: students.length,
            totalExams: exams.length,
            generated: results.generated,
            failed: results.failed,
            errors: results.errors.slice(0, 10) // Limit errors in response
        });
    } catch (error) {
        console.error('Generate consolidated hall tickets error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authorize all hall tickets for a year/department
// @route   PUT /api/hall-tickets/authorize-consolidated
// @access  Private/Admin
const authorizeConsolidatedHallTickets = async (req, res) => {
    try {
        const { year, department, examType = 'Semester' } = req.body;

        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }

        const query = { year: parseInt(year), examType };
        if (department) {
            query.department = department;
        }

        const result = await HallTicket.updateMany(
            query,
            {
                authorized: true,
                authorizedBy: req.user._id,
                authorizedAt: new Date()
            }
        );

        // Also update exam records
        const examQuery = { year: parseInt(year), examType };
        if (department) examQuery.department = department;

        await Exam.updateMany(examQuery, { hallTicketsAuthorized: true });

        // Send notification
        if (req.io) {
            req.io.to('role:Student').emit('notification', {
                title: 'Hall Tickets Authorized',
                message: `Hall tickets for Year ${year} ${examType} exams have been authorized for download.`,
                type: 'success'
            });
        }

        res.json({
            message: 'Hall tickets authorized successfully',
            authorized: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateSingleHallTicket,
    generateBulkHallTicketsController,
    authorizeHallTickets,
    getMyHallTicket,
    downloadHallTicket,
    getExamHallTickets,
    getMyHallTickets,
    generateConsolidatedHallTickets,
    authorizeConsolidatedHallTickets
};
