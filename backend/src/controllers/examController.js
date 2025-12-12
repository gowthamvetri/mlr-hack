const Exam = require('../models/Exam');
const User = require('../models/User');

// @desc    Create a new exam schedule (multiple exams)
// @route   POST /api/exams/schedule
// @access  Private/Admin
const createExamSchedule = async (req, res) => {
  try {
    const { department, year, examType, semester, exams } = req.body;

    // exams is an array of { courseName, courseCode, date, startTime, endTime, duration }

    const createdExams = await Promise.all(exams.map(async (e) => {
      const exam = new Exam({
        courseName: e.courseName,
        courseCode: e.courseCode,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        duration: e.duration || 180,
        examType,
        department,
        semester: semester || e.semester,
        batches: [year] // Assuming year is passed as batch identifier
      });
      return await exam.save();
    }));

    if (req.io) {
      req.io.to('role:Student').emit('exam_schedule_released', {
        department,
        year,
        count: createdExams.length
      });
      req.io.to('role:Student').emit('notification', {
        title: 'New Exam Schedule',
        message: `Schedule released for ${department} - ${year} Year`,
        type: 'info'
      });
    }

    res.status(201).json(createdExams);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate Hall Tickets for a Batch/Semester
// @route   PUT /api/exams/generate-hall-tickets-batch
// @access  Private/Admin
const generateBatchHallTickets = async (req, res) => {
  try {
    const { department, year, examType, semester } = req.body;

    // Find all exams for this dept/year/type/semester
    const query = {
      department,
      batches: { $in: [year] },
      examType
    };

    if (semester) {
      query.semester = semester;
    }

    const exams = await Exam.find(query);

    if (exams.length === 0) {
      return res.status(404).json({ message: 'No exams found for this criteria' });
    }

    // Update all to have hallTicketsGenerated = true
    await Exam.updateMany(
      { _id: { $in: exams.map(e => e._id) } },
      { $set: { hallTicketsGenerated: true } }
    );

    // Create notification
    const Notification = require('../models/Notification');
    await Notification.create({
      recipientRole: 'Student',
      title: 'Semester Hall Tickets Released',
      message: `Hall tickets for ${department} Year ${year} ${semester || ''} ${examType} exams are now available.`,
      type: 'Exam'
    });

    if (req.io) {
      req.io.to('role:Student').emit('hall_tickets_generated', { department, year });
      req.io.to('role:Student').emit('notification', {
        title: 'Semester Hall Tickets Released',
        message: `Hall tickets for ${department} Year ${year} are now available.`,
        type: 'success'
      });
    }

    res.json({ message: `Hall tickets generated for ${exams.length} exams.`, exams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    const { courseName, courseCode, date, startTime, endTime, duration, examType, department, semester, batches } = req.body;

    const exam = new Exam({
      courseName,
      courseCode,
      date,
      startTime,
      endTime,
      duration,
      examType,
      department,
      semester,
      batches
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin/SeatingManager)
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({});
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exams for a student
// @route   GET /api/exams/student
// @access  Private/Student
const getStudentExams = async (req, res) => {
  try {
    // In a real app, we would filter by the student's registered courses or batch
    // For this demo, we'll return exams matching the student's department
    const exams = await Exam.find({ department: req.user.department });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate Hall Tickets (Mock)
// @route   PUT /api/exams/:id/generate-hall-ticket
// @access  Private/Admin
const generateHallTickets = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      exam.hallTicketsGenerated = true;
      await exam.save();

      // Create notification for students
      const Notification = require('../models/Notification');
      await Notification.create({
        recipientRole: 'Student',
        title: 'Hall Tickets Released',
        message: `Hall tickets for ${exam.courseName} are now available for download.`,
        type: 'Exam'
      });

      if (req.io) {
        req.io.to('role:Student').emit('hall_tickets_generated', { examId: exam._id });
      }

      res.json({ message: 'Hall tickets generated successfully' });
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Hall Ticket for a specific exam (Student)
// @route   GET /api/exams/:id/hall-ticket
// @access  Private/Student
const getHallTicket = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.hallTicketsGenerated) {
      return res.status(400).json({ message: 'Hall tickets not yet generated for this exam' });
    }

    // Check eligibility: attendance >= 75% and fees paid
    const student = await User.findById(req.user._id);

    const eligibilityIssues = [];

    if (student.attendance < 75) {
      eligibilityIssues.push(`Insufficient attendance: ${student.attendance}% (minimum 75% required)`);
    }

    if (!student.feesPaid) {
      eligibilityIssues.push('Fees not cleared. Please clear all pending fees.');
    }

    if (eligibilityIssues.length > 0) {
      return res.status(403).json({
        message: 'Not eligible for hall ticket',
        eligible: false,
        issues: eligibilityIssues,
        attendance: student.attendance,
        feesPaid: student.feesPaid
      });
    }

    // Return hall ticket data
    const hallTicket = {
      examId: exam._id,
      courseName: exam.courseName,
      courseCode: exam.courseCode,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      examType: exam.examType,
      semester: exam.semester,
      eligible: true,
      student: {
        name: req.user.name,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
        year: req.user.year,
        attendance: student.attendance,
        feesPaid: student.feesPaid
      },
      instructions: [
        'Report to the exam hall 30 minutes before the scheduled time.',
        'Carry a valid ID card along with this hall ticket.',
        'Electronic devices are strictly prohibited.',
        'Use only blue/black ball point pen.',
        'Write your roll number clearly on the answer sheet.'
      ]
    };

    res.json(hallTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Semester Hall Ticket (All exams for a semester)
// @route   GET /api/exams/semester-hall-ticket
// @access  Private/Student
const getSemesterHallTicket = async (req, res) => {
  try {
    const { semester, examType } = req.query;
    const student = await User.findById(req.user._id);

    // Build query for student's exams
    const query = {
      department: student.department,
      batches: { $in: [student.year, student.batch].filter(Boolean) },
      hallTicketsGenerated: true
    };

    if (semester) query.semester = semester;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query).sort({ date: 1 });

    if (exams.length === 0) {
      return res.status(404).json({ message: 'No exams found for this semester' });
    }

    // Check eligibility
    const eligibilityIssues = [];

    if (student.attendance < 75) {
      eligibilityIssues.push(`Insufficient attendance: ${student.attendance}% (minimum 75% required)`);
    }

    if (!student.feesPaid) {
      eligibilityIssues.push('Fees not cleared. Please clear all pending fees.');
    }

    const isEligible = eligibilityIssues.length === 0;

    // Return semester hall ticket
    const semesterHallTicket = {
      semester: semester || exams[0]?.semester,
      examType: examType || 'All',
      eligible: isEligible,
      eligibilityIssues,
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        email: student.email,
        attendance: student.attendance,
        feesPaid: student.feesPaid
      },
      exams: exams.map(exam => ({
        examId: exam._id,
        courseName: exam.courseName,
        courseCode: exam.courseCode,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        examType: exam.examType
      })),
      totalExams: exams.length,
      generatedAt: new Date(),
      instructions: [
        'Report to the exam hall 30 minutes before the scheduled time.',
        'Carry a valid ID card along with this hall ticket.',
        'Electronic devices are strictly prohibited.',
        'Use only blue/black ball point pen.',
        'Write your roll number clearly on the answer sheet.',
        'This hall ticket is valid for all exams listed above.'
      ]
    };

    res.json(semesterHallTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check student eligibility for hall ticket
// @route   GET /api/exams/check-eligibility/:studentId
// @access  Private/Admin/Staff
const checkStudentEligibility = async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);

    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const eligibilityIssues = [];

    if (student.attendance < 75) {
      eligibilityIssues.push(`Insufficient attendance: ${student.attendance}% (minimum 75% required)`);
    }

    if (!student.feesPaid) {
      eligibilityIssues.push('Fees not cleared');
    }

    res.json({
      studentId: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      attendance: student.attendance,
      feesPaid: student.feesPaid,
      feeDetails: student.feeDetails,
      eligible: eligibilityIssues.length === 0,
      issues: eligibilityIssues
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExam,
  createExamSchedule,
  getExams,
  getStudentExams,
  generateHallTickets,
  generateBatchHallTickets,
  getHallTicket,
  getSemesterHallTicket,
  checkStudentEligibility
};
