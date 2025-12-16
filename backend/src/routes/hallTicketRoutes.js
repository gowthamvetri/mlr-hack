const express = require('express');
const router = express.Router();
const {
    generateSingleHallTicket,
    generateBulkHallTicketsController,
    authorizeHallTickets,
    getMyHallTicket,
    downloadHallTicket,
    getExamHallTickets,
    getMyHallTickets,
    generateConsolidatedHallTickets,
    authorizeConsolidatedHallTickets
} = require('../controllers/hallTicketController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

// Admin routes - Generate and authorize
router.post('/generate', protect, admin, generateSingleHallTicket);
router.post('/generate-bulk', protect, admin, generateBulkHallTicketsController);
router.post('/generate-consolidated', protect, admin, generateConsolidatedHallTickets);
router.put('/authorize/:examId', protect, admin, authorizeHallTickets);
router.put('/authorize-consolidated', protect, admin, authorizeConsolidatedHallTickets);
router.get('/exam/:examId', protect, admin, getExamHallTickets);

// Student routes - View and download
router.get('/my-tickets', protect, getMyHallTickets);
router.get('/my-ticket/:examId', protect, getMyHallTicket);
router.get('/download/:ticketId', protect, downloadHallTicket);

module.exports = router;
