const express = require('express');
const router = express.Router();
const { createEvent, getEvents, updateEventStatus } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createEvent) // Coordinator creates
  .get(protect, getEvents);   // Everyone reads (filtered)

router.put('/:id/status', protect, admin, updateEventStatus);

module.exports = router;
