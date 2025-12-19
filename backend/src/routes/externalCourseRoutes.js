const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getExternalCourses,
    createExternalCourse,
    updateExternalCourse,
    deleteExternalCourse,
    markAsCompleted,
    getMyCompletedCourses
} = require('../controllers/externalCourseController');

// All routes require authentication
router.use(protect);

// Get all external courses (accessible by all authenticated users)
router.get('/', getExternalCourses);

// Get my completed courses (for students)
router.get('/my-completed', getMyCompletedCourses);

// Create external course (Admin and Staff only)
router.post('/', authorize('Admin', 'Staff'), createExternalCourse);

// Update external course (Admin or Staff who created)
router.put('/:id', authorize('Admin', 'Staff'), updateExternalCourse);

// Delete external course (Admin or Staff who created)
router.delete('/:id', authorize('Admin', 'Staff'), deleteExternalCourse);

// Mark course as completed (Student only)
router.post('/:id/complete', authorize('Student'), markAsCompleted);

module.exports = router;
