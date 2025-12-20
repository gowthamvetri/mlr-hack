const express = require('express');
const router = express.Router();
const { protect, staff, admin } = require('../middleware/authMiddleware');
const {
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getTimetables,
    getTimetableById,
    getMyTimetable,
    getSubjectsForTimetable
} = require('../controllers/timetableController');

// Student route - must be before :id route
router.get('/my-timetable', protect, getMyTimetable);

// Get subjects for dropdown
router.get('/subjects', protect, staff, getSubjectsForTimetable);

// Staff/Admin routes
router.route('/')
    .get(protect, getTimetables)
    .post(protect, staff, createTimetable);

router.route('/:id')
    .get(protect, getTimetableById)
    .put(protect, staff, updateTimetable)
    .delete(protect, staff, deleteTimetable);

module.exports = router;
