const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getSubjectAttendance,
    getMySubjectAttendance,
    getMySubjectHistory,
    getSubjectStudents,
    getStaffAttendanceSummary
} = require('../controllers/subjectAttendanceController');
const { protect, adminOrStaff } = require('../middleware/authMiddleware');

// Staff routes - Mark and view attendance
router.post('/mark', protect, adminOrStaff, markAttendance);
router.get('/subject/:subjectId', protect, adminOrStaff, getSubjectAttendance);
router.get('/subject/:subjectId/students', protect, adminOrStaff, getSubjectStudents);
router.get('/staff-summary', protect, adminOrStaff, getStaffAttendanceSummary);

// Student routes - View own attendance
router.get('/my-attendance', protect, getMySubjectAttendance);
router.get('/my-attendance/:subjectId', protect, getMySubjectHistory);

module.exports = router;
