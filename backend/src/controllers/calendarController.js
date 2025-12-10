const CalendarEvent = require('../models/CalendarEvent');

// @desc    Get calendar events
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = async (req, res) => {
  try {
    let query = {};
    // If student, filter by scope
    if (req.user.role === 'Student') {
      query = {
        $or: [
          { scope: 'Institute' },
          { scope: 'Department', department: req.user.department },
          { scope: 'Batch', batch: req.user.year } // Assuming year maps to batch roughly
        ]
      };
    }
    const events = await CalendarEvent.find(query);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create calendar event
// @route   POST /api/calendar
// @access  Private/Admin
const createCalendarEvent = async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    const createdEvent = await event.save();

    // Notify students if it's an important academic event
    if (['Exam', 'Holiday', 'Academic'].includes(createdEvent.type)) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipientRole: 'Student',
        title: 'Academic Calendar Update',
        message: `New ${createdEvent.type}: ${createdEvent.title} on ${new Date(createdEvent.start).toLocaleDateString()}`,
        type: 'Academic'
      });
    }

    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/calendar/:id
// @access  Private/Admin
const deleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (event) {
      await event.deleteOne();
      res.json({ message: 'Event removed' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCalendarEvents, createCalendarEvent, deleteCalendarEvent };
