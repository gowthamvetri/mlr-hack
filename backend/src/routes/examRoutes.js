const express = require('express');
const router = express.Router();
const {
  autoScheduleExam,
  createExam,
  createExamSchedule,
  getExams,
  getStudentExams,
  generateHallTickets,
  generateBatchHallTickets,
  getHallTicket,
  getSemesterHallTicket,
  checkStudentEligibility
} = require('../controllers/examController');
const { protect, admin, adminOrStaff } = require('../middleware/authMiddleware');

// Auto-schedule exam endpoint (Admin only)
router.post('/auto-schedule', protect, admin, autoScheduleExam);

router.route('/').post(protect, admin, createExam).get(protect, getExams);
router.post('/schedule', protect, admin, createExamSchedule);
router.put('/generate-hall-tickets-batch', protect, admin, generateBatchHallTickets);
router.get('/student', protect, getStudentExams);
router.get('/semester-hall-ticket', protect, getSemesterHallTicket);
router.get('/check-eligibility/:studentId', protect, adminOrStaff, checkStudentEligibility);
router.get('/:id/hall-ticket', protect, getHallTicket);
router.put('/:id/generate-hall-ticket', protect, admin, generateHallTickets);

module.exports = router;
