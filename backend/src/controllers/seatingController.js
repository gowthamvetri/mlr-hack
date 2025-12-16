/**
 * Seating Controller
 * Enhanced with MLR-Hackathon algorithm and room validation
 */

const Seating = require('../models/Seating');
const Room = require('../models/Room');
const Exam = require('../models/Exam');
const User = require('../models/User');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const {
  allocateSeating: allocateSeatingService,
  getAvailableRooms: getAvailableRoomsService
} = require('../services/seatingAllocator');

// @desc    Get available rooms for an exam (checking time conflicts)
// @route   GET /api/seating/available-rooms
// @access  Private/SeatingManager/Admin
const getAvailableRooms = async (req, res) => {
  try {
    const { date, session, examId } = req.query;

    if (!date || !session) {
      return res.status(400).json({
        message: 'Date and session are required'
      });
    }

    const rooms = await getAvailableRoomsService(date, session, examId);

    res.json({
      total: rooms.length,
      rooms: rooms.map(room => ({
        _id: room._id,
        roomNumber: room.roomNumber,
        hallNo: room.hallNo || room.roomNumber,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        columns: room.columns
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Allocate Seating using MLR-Hackathon algorithm
// @route   POST /api/seating/allocate
// @access  Private/SeatingManager/Admin
const allocateSeating = async (req, res) => {
  try {
    const {
      examId,
      roomIds = [], // Specific rooms (optional)
      department,
      year,
      examType // 'Internal' or 'Semester'
    } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Use MLR-Hackathon allocation service
    const result = await allocateSeatingService({
      examId,
      examType: examType || exam.examType,
      date: exam.date,
      session: exam.session || 'FN',
      department: department || exam.department,
      year: year || exam.year,
      roomIds
    });

    // Send notification
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
    }

    res.json(result);
  } catch (error) {
    console.error('Seating allocation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Assign invigilators to rooms
// @route   POST /api/seating/assign-invigilators
// @access  Private/Admin
const assignInvigilators = async (req, res) => {
  try {
    const { examId, assignments } = req.body;
    // assignments: [{ roomNumber, invigilatorId }]

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const createdAssignments = [];

    for (const assignment of assignments) {
      // Find room
      const room = await Room.findOne({ roomNumber: assignment.roomNumber });
      if (!room) {
        continue; // Skip invalid rooms
      }

      // Check if invigilator is already assigned elsewhere for same date/session
      const existingAssignment = await InvigilatorAssignment.findOne({
        invigilator: assignment.invigilatorId,
        date: exam.date,
        session: exam.session || 'FN',
        exam: { $ne: examId }
      });

      if (existingAssignment) {
        continue; // Skip if already assigned
      }

      // Create or update assignment
      const invigilatorAssignment = await InvigilatorAssignment.findOneAndUpdate(
        { exam: examId, room: room._id, date: exam.date, session: exam.session || 'FN' },
        {
          exam: examId,
          room: room._id,
          invigilator: assignment.invigilatorId,
          date: exam.date,
          session: exam.session || 'FN',
          assignedBy: req.user._id,
          status: 'Assigned'
        },
        { upsert: true, new: true }
      );

      createdAssignments.push(invigilatorAssignment);
    }

    // Notify faculty
    if (req.io) {
      req.io.to('role:Faculty').emit('notification', {
        title: 'Invigilator Duty Assigned',
        message: `You have been assigned invigilation duty for ${exam.courseName}.`,
        type: 'info'
      });
    }

    res.json({
      message: `Assigned ${createdAssignments.length} invigilators`,
      assignments: createdAssignments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seating schedule for an exam (view allotted schedule)
// @route   GET /api/seating/schedule/:examId
// @access  Private/Admin/SeatingManager/Faculty
const getSeatingSchedule = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get all seating for this exam grouped by room
    const seating = await Seating.find({ exam: examId })
      .populate('student', 'name rollNumber department year')
      .sort({ roomNumber: 1, seatNumber: 1 });

    // Get invigilator assignments
    const invigilators = await InvigilatorAssignment.find({ exam: examId })
      .populate('room', 'roomNumber hallNo')
      .populate('invigilator', 'name email');

    // Group by room
    const roomWiseSeating = {};
    seating.forEach(seat => {
      if (!roomWiseSeating[seat.roomNumber]) {
        roomWiseSeating[seat.roomNumber] = {
          roomNumber: seat.roomNumber,
          building: seat.building,
          floor: seat.floor,
          students: [],
          departments: new Set(),
          invigilator: null
        };
      }
      roomWiseSeating[seat.roomNumber].students.push(seat);
      roomWiseSeating[seat.roomNumber].departments.add(seat.student?.department);
    });

    // Add invigilator info
    invigilators.forEach(inv => {
      const roomNum = inv.room?.roomNumber;
      if (roomNum && roomWiseSeating[roomNum]) {
        roomWiseSeating[roomNum].invigilator = {
          name: inv.invigilator?.name,
          email: inv.invigilator?.email,
          status: inv.status
        };
      }
    });

    // Convert departments Set to array
    const schedule = Object.values(roomWiseSeating).map(room => ({
      ...room,
      departments: Array.from(room.departments),
      studentCount: room.students.length
    }));

    res.json({
      exam: {
        _id: exam._id,
        courseName: exam.courseName,
        courseCode: exam.courseCode,
        date: exam.date,
        session: exam.session,
        examType: exam.examType
      },
      totalStudents: seating.length,
      roomsUsed: schedule.length,
      schedule
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seating for a student
// @route   GET /api/seating/my-seat
// @access  Private/Student
const getMySeat = async (req, res) => {
  try {
    const seats = await Seating.find({ student: req.user._id })
      .populate('exam', 'courseName courseCode date startTime endTime session examType');
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get invigilator assignments for logged-in faculty
// @route   GET /api/seating/my-invigilation
// @access  Private/Faculty/Staff
const getMyInvigilation = async (req, res) => {
  try {
    const assignments = await InvigilatorAssignment.find({ invigilator: req.user._id })
      .populate('exam', 'courseName courseCode date startTime endTime session')
      .populate('room', 'roomNumber hallNo building floor')
      .sort({ date: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all rooms
// @route   GET /api/seating/rooms
// @access  Private/Admin/SeatingManager
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new room
// @route   POST /api/seating/rooms
// @access  Private/Admin/SeatingManager
const createRoom = async (req, res) => {
  try {
    const { roomNumber, hallNo, building, floor, capacity, columns, layoutPattern } = req.body;

    if (!roomNumber || !capacity) {
      return res.status(400).json({ message: 'Room number and capacity are required' });
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room with this number already exists' });
    }

    const room = await Room.create({
      roomNumber,
      hallNo: hallNo || `Room ${roomNumber}`,
      building: building || 'Main Block',
      floor: floor || '1',
      capacity: parseInt(capacity),
      columns: columns || 5,
      layoutPattern: layoutPattern || 'Rows',
      isAvailable: true
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/seating/rooms/:id
// @access  Private/Admin/SeatingManager
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, hallNo, building, floor, capacity, columns, layoutPattern, isAvailable } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new roomNumber conflicts with existing room
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room with this number already exists' });
      }
    }

    room.roomNumber = roomNumber || room.roomNumber;
    room.hallNo = hallNo || room.hallNo;
    room.building = building || room.building;
    room.floor = floor || room.floor;
    room.capacity = capacity ? parseInt(capacity) : room.capacity;
    room.columns = columns || room.columns;
    room.layoutPattern = layoutPattern || room.layoutPattern;
    if (typeof isAvailable === 'boolean') {
      room.isAvailable = isAvailable;
    }

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/seating/rooms/:id
// @access  Private/Admin/SeatingManager
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available invigilators (Faculty/Staff)
// @route   GET /api/seating/invigilators
// @access  Private/SeatingManager/Admin
const getAvailableInvigilators = async (req, res) => {
  try {
    // Get all faculty and staff members
    const invigilators = await User.find({
      role: { $in: ['Faculty', 'Staff', 'Admin'] },
      status: { $ne: 'inactive' }
    }).select('name email department role').sort('name');

    res.json(invigilators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  allocateSeating,
  getMySeat,
  getAvailableRooms,
  assignInvigilators,
  getSeatingSchedule,
  getMyInvigilation,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableInvigilators
};
