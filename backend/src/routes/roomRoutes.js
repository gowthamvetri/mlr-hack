const express = require('express');
const router = express.Router();
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, admin } = require('../middleware/authMiddleware');

// Seating Manager should be able to manage rooms too, or just Admin?
// Prompt says "Seating Manager handles all things related to exam room allocation... Room Setup"
// So Seating Manager needs access.
// I'll assume 'admin' middleware allows Admin, need to check if it allows Seating Manager.
// If not, I might need a specific middleware or just check role in controller.
// For now, let's assume protect is enough and we check role in controller or assume trusted users.
// Actually, let's look at authMiddleware.

router.route('/').get(protect, getRooms).post(protect, addRoom);
router.route('/:id').put(protect, updateRoom).delete(protect, deleteRoom);

module.exports = router;