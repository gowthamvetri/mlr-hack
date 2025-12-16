/**
 * Attendance Controller
 * Handles QR-based and manual attendance for exams
 * Role-based access: Faculty/Staff can mark, Admin can view reports
 */

const Attendance = require('../models/Attendance');
const HallTicket = require('../models/HallTicket');
const Exam = require('../models/Exam');
const User = require('../models/User');

// Attendance window in minutes (30 min from exam start)
const ATTENDANCE_WINDOW_MINUTES = 30;

/**
 * Verify if attendance can be marked (within time window)
 */
const isWithinAttendanceWindow = (examDate, examStartTime) => {
    const now = new Date();
    const examStart = new Date(examDate);

    // Parse start time (e.g., "09:00")
    if (examStartTime) {
        const [hours, minutes] = examStartTime.split(':');
        examStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    // Calculate window end
    const windowEnd = new Date(examStart);
    windowEnd.setMinutes(windowEnd.getMinutes() + ATTENDANCE_WINDOW_MINUTES);

    // Check if current time is within window
    return now >= examStart && now <= windowEnd;
};

// @desc    Scan QR code and mark attendance
// @route   POST /api/attendance/scan-qr
// @access  Private/Faculty/Staff
const scanQRCode = async (req, res) => {
    try {
        const { qrData, examId, subjectCode } = req.body;

        let parsedQR;
        try {
            parsedQR = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid QR code data' });
        }

        const { studentId, rollNumber, examId: qrExamId } = parsedQR;

        // Verify exam matches if provided
        if (examId && qrExamId !== examId) {
            return res.status(400).json({
                message: 'QR code does not match the selected exam'
            });
        }

        // Fetch exam
        const exam = await Exam.findById(qrExamId || examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check attendance window
        if (!isWithinAttendanceWindow(exam.date, exam.startTime)) {
            return res.status(400).json({
                message: 'Attendance window has closed. Contact administrator for manual entry.',
                windowMinutes: ATTENDANCE_WINDOW_MINUTES
            });
        }

        // Fetch student
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Verify hall ticket exists and is authorized
        const hallTicket = await HallTicket.findOne({
            student: studentId,
            exam: exam._id,
            authorized: true
        });

        if (!hallTicket && exam.examType === 'Semester') {
            return res.status(403).json({
                message: 'Hall ticket not authorized for this student'
            });
        }

        // Check for duplicate attendance
        const existingAttendance = await Attendance.findOne({
            student: studentId,
            exam: exam._id,
            examDate: exam.date,
            subjectCode: subjectCode || exam.courseCode
        });

        if (existingAttendance) {
            return res.status(400).json({
                message: 'Attendance already marked for this student',
                existingAttendance: {
                    markedAt: existingAttendance.markedAt,
                    status: existingAttendance.status
                }
            });
        }

        // Create attendance record
        const attendance = new Attendance({
            student: studentId,
            exam: exam._id,
            hallTicket: hallTicket?._id,
            markedBy: req.user._id,
            method: 'QR',
            examDate: exam.date,
            examSession: exam.session,
            subjectCode: subjectCode || exam.courseCode,
            status: 'PRESENT',
            roomNumber: hallTicket?.roomNumber,
            seatNumber: hallTicket?.seatNumber
        });

        await attendance.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance: {
                studentName: student.name,
                rollNumber: student.rollNumber,
                status: 'PRESENT',
                markedAt: attendance.markedAt,
                markedBy: req.user.name
            }
        });
    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark attendance manually
// @route   POST /api/attendance/manual
// @access  Private/Faculty/Staff/Admin
const markManualAttendance = async (req, res) => {
    try {
        const { studentId, examId, subjectCode, status = 'PRESENT', remarks } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check for duplicate
        const existingAttendance = await Attendance.findOne({
            student: studentId,
            exam: examId,
            examDate: exam.date,
            subjectCode: subjectCode || exam.courseCode
        });

        if (existingAttendance) {
            // Update existing
            existingAttendance.status = status;
            existingAttendance.remarks = remarks;
            existingAttendance.markedBy = req.user._id;
            existingAttendance.method = 'MANUAL';
            await existingAttendance.save();

            return res.json({
                message: 'Attendance updated',
                attendance: existingAttendance
            });
        }

        // Get hall ticket info
        const hallTicket = await HallTicket.findOne({
            student: studentId,
            exam: examId
        });

        // Create new attendance
        const attendance = new Attendance({
            student: studentId,
            exam: examId,
            hallTicket: hallTicket?._id,
            markedBy: req.user._id,
            method: 'MANUAL',
            examDate: exam.date,
            examSession: exam.session,
            subjectCode: subjectCode || exam.courseCode,
            status,
            remarks,
            roomNumber: hallTicket?.roomNumber,
            seatNumber: hallTicket?.seatNumber
        });

        await attendance.save();

        res.status(201).json({
            message: 'Attendance marked manually',
            attendance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance report for an exam
// @route   GET /api/attendance/exam/:examId
// @access  Private/Admin/Faculty
const getExamAttendance = async (req, res) => {
    try {
        const { examId } = req.params;
        const { subjectCode } = req.query;

        const query = { exam: examId };
        if (subjectCode) query.subjectCode = subjectCode;

        const attendance = await Attendance.find(query)
            .populate('student', 'name rollNumber department year')
            .populate('markedBy', 'name')
            .sort({ 'student.rollNumber': 1 });

        const exam = await Exam.findById(examId);

        // Calculate stats
        const present = attendance.filter(a => a.status === 'PRESENT').length;
        const absent = attendance.filter(a => a.status === 'ABSENT').length;
        const late = attendance.filter(a => a.status === 'LATE').length;

        res.json({
            exam: {
                _id: exam._id,
                courseName: exam.courseName,
                courseCode: exam.courseCode,
                date: exam.date,
                session: exam.session
            },
            stats: {
                total: attendance.length,
                present,
                absent,
                late,
                attendancePercentage: attendance.length > 0
                    ? Math.round((present / attendance.length) * 100)
                    : 0
            },
            attendance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's attendance for logged-in student
// @route   GET /api/attendance/my-attendance
// @access  Private/Student
const getMyAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find({ student: req.user._id })
            .populate('exam', 'courseName courseCode examType date semester')
            .sort({ examDate: -1 });

        // Calculate overall stats
        const present = attendance.filter(a => a.status === 'PRESENT').length;
        const total = attendance.length;

        res.json({
            stats: {
                total,
                present,
                absent: total - present,
                percentage: total > 0 ? Math.round((present / total) * 100) : 0
            },
            attendance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all students awaiting attendance for an exam
// @route   GET /api/attendance/pending/:examId
// @access  Private/Faculty
const getPendingAttendance = async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Get all hall tickets for this exam
        const hallTickets = await HallTicket.find({
            exam: examId,
            authorized: true
        }).populate('student', 'name rollNumber department');

        // Get already marked attendance
        const markedAttendance = await Attendance.find({ exam: examId });
        const markedStudentIds = markedAttendance.map(a => a.student.toString());

        // Filter pending
        const pending = hallTickets.filter(ht =>
            !markedStudentIds.includes(ht.student._id.toString())
        );

        res.json({
            total: hallTickets.length,
            marked: markedAttendance.length,
            pending: pending.length,
            students: pending.map(ht => ({
                studentId: ht.student._id,
                name: ht.student.name,
                rollNumber: ht.student.rollNumber,
                department: ht.student.department,
                roomNumber: ht.roomNumber,
                seatNumber: ht.seatNumber
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    scanQRCode,
    markManualAttendance,
    getExamAttendance,
    getMyAttendance,
    getPendingAttendance
};
