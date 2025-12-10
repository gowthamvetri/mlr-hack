const Exam = require('../models/Exam');
const User = require('../models/User');

// @desc    Create a new exam schedule (multiple exams)
// @route   POST /api/exams/schedule
// @access  Private/Admin
const createExamSchedule = async (req, res) => {
  try {
    const { department, year, examType, exams } = req.body;
    
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
        batches: [year] // Assuming year is passed as batch identifier
      });
      return await exam.save();
    }));

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
    const { department, year, examType } = req.body;
    
    // Find all exams for this dept/year/type
    const exams = await Exam.find({ 
      department, 
      batches: { $in: [year] },
      examType
    });

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
      message: `Hall tickets for ${department} Year ${year} ${examType} exams are now available.`,
      type: 'Exam'
    });

    res.json({ message: `Hall tickets generated for ${exams.length} exams.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    const { courseName, courseCode, date, startTime, endTime, duration, examType, department, batches } = req.body;
    
    const exam = new Exam({
      courseName,
      courseCode,
      date,
      startTime,
      endTime,
      duration,
      examType,
      department,
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
      student: {
        name: req.user.name,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
        year: req.user.year
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

module.exports = { createExam, createExamSchedule, getExams, getStudentExams, generateHallTickets, generateBatchHallTickets, getHallTicket };
