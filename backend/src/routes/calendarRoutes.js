const express = require('express');
const router = express.Router();
const { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } = require('../controllers/calendarController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCalendarEvents)
  .post(protect, admin, createCalendarEvent);

router.delete('/:id', protect, admin, deleteCalendarEvent);

module.exports = router;
