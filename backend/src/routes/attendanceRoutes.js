const express = require('express');
const router = express.Router();
const {
    scanQRCode,
    markManualAttendance,
    getExamAttendance,
    getMyAttendance,
    getPendingAttendance
} = require('../controllers/attendanceController');
const { protect, admin, adminOrStaff, authorize } = require('../middleware/authMiddleware');

// Faculty/Staff routes - Mark attendance
router.post('/scan-qr', protect, adminOrStaff, scanQRCode);
router.post('/manual', protect, adminOrStaff, markManualAttendance);
router.get('/pending/:examId', protect, adminOrStaff, getPendingAttendance);

// Admin/Faculty routes - View reports
router.get('/exam/:examId', protect, adminOrStaff, getExamAttendance);

// Student routes - View own attendance
router.get('/my-attendance', protect, getMyAttendance);

module.exports = router;
