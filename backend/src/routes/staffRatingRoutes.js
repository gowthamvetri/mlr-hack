const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    submitRating,
    getStaffRatings,
    canRateStaff,
    getStaffAverageRating
} = require('../controllers/staffRatingController');

// Submit a rating (Student only)
router.post('/', protect, submitRating);

// Get all ratings for a staff member
router.get('/staff/:staffId', protect, getStaffRatings);

// Check if student can rate staff for a course
router.get('/can-rate/:staffId/:courseId', protect, canRateStaff);

// Get average rating for a staff member
router.get('/average/:staffId', protect, getStaffAverageRating);

module.exports = router;
