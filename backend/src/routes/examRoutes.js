const express = require('express');
const router = express.Router();
const { createExam, createExamSchedule, getExams, getStudentExams, generateHallTickets, generateBatchHallTickets, getHallTicket } = require('../controllers/examController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, admin, createExam).get(protect, getExams);
router.post('/schedule', protect, admin, createExamSchedule);
router.put('/generate-hall-tickets-batch', protect, admin, generateBatchHallTickets);
router.get('/student', protect, getStudentExams);
router.get('/:id/hall-ticket', protect, getHallTicket);
router.put('/:id/generate-hall-ticket', protect, admin, generateHallTickets);

module.exports = router;
