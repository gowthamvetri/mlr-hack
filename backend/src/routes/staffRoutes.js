const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  updateAttendance,
  bulkUpdateAttendance,
  updateFeeStatus,
  getAttendanceSummary,
  getFeeSummary,
  getIneligibleStudents
} = require('../controllers/staffController');
const { protect, staff, adminOrStaff } = require('../middleware/authMiddleware');

// All routes require staff or admin access
router.get('/students', protect, adminOrStaff, getStudents);
router.get('/students/:id', protect, adminOrStaff, getStudentById);
router.put('/students/:id/attendance', protect, adminOrStaff, updateAttendance);
router.put('/students/bulk-attendance', protect, adminOrStaff, bulkUpdateAttendance);
router.put('/students/:id/fees', protect, adminOrStaff, updateFeeStatus);
router.get('/attendance-summary', protect, adminOrStaff, getAttendanceSummary);
router.get('/fee-summary', protect, adminOrStaff, getFeeSummary);
router.get('/ineligible-students', protect, adminOrStaff, getIneligibleStudents);

module.exports = router;
