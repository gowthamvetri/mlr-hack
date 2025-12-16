const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/seatingController');
const { protect, admin, adminOrStaff, authorize } = require('../middleware/authMiddleware');

// Room management (SeatingManager or Admin)
router.get('/rooms', protect, getAllRooms);
router.post('/rooms', protect, createRoom);
router.put('/rooms/:id', protect, updateRoom);
router.delete('/rooms/:id', protect, deleteRoom);
router.get('/available-rooms', protect, getAvailableRooms);

// Seating allocation (Seating Manager or Admin)
router.post('/allocate', protect, allocateSeating);

// Invigilator management (Seating Manager or Admin)
router.get('/invigilators', protect, getAvailableInvigilators);
router.post('/assign-invigilators', protect, assignInvigilators);

// View schedule (Admin, Staff, Faculty)
router.get('/schedule/:examId', protect, adminOrStaff, getSeatingSchedule);

// Faculty routes
router.get('/my-invigilation', protect, getMyInvigilation);

// Student routes
router.get('/my-seat', protect, getMySeat);

module.exports = router;
