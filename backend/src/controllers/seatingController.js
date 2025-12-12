const Seating = require('../models/Seating');
const Exam = require('../models/Exam');
const User = require('../models/User');

// @desc    Allocate Seating (Simple Random Algorithm)
// @route   POST /api/seating/allocate
// @access  Private/SeatingManager
const allocateSeating = async (req, res) => {
  try {
    const { examId, rooms } = req.body; // rooms is array of { roomNumber, capacity }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Find students eligible for this exam (by department)
    const students = await User.find({ role: 'Student', department: exam.department });

    if (students.length === 0) {
      return res.status(400).json({ message: 'No students found for this exam' });
    }

    // Randomize students to avoid friends sitting together
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }

    // Clear existing seating for this exam
    await Seating.deleteMany({ exam: examId });

    let studentIndex = 0;
    const seatingArr = [];

    // Simple allocation logic
    for (const room of rooms) {
      for (let i = 0; i < room.capacity; i++) {
        if (studentIndex >= students.length) break;

        seatingArr.push({
          exam: examId,
          student: students[studentIndex]._id,
          roomNumber: room.roomNumber,
          seatNumber: `S-${i + 1}`,
          floor: room.floor || '1',
          building: room.building || 'Main Block'
        });

        studentIndex++;
      }
    }

    await Seating.insertMany(seatingArr);

    exam.seatingPublished = true;
    await exam.save();

    // Create notification for students
    const Notification = require('../models/Notification');
    await Notification.create({
      recipientRole: 'Student',
      title: 'Seating Allocation Published',
      message: `Seating for ${exam.courseName} has been allocated. Check your dashboard.`,
      type: 'Seating'
    });

    if (req.io) {
      req.io.to('role:Student').emit('seating_allocated', { examId: exam._id });
      req.io.to('role:Student').emit('notification', {
        title: 'Seating Allocated',
        message: `Seating for ${exam.courseName} is out now.`,
        type: 'info'
      });
      req.io.to('role:Seating Manager').emit('seating_allocated', { examId: exam._id });
    }

    res.json({ message: `Seating allocated for ${seatingArr.length} students` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seating for a student
// @route   GET /api/seating/my-seat
// @access  Private/Student
const getMySeat = async (req, res) => {
  try {
    const seats = await Seating.find({ student: req.user._id }).populate('exam', 'courseName date startTime');
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { allocateSeating, getMySeat };
