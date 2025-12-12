const Event = require('../models/Event');

// @desc    Propose a new event
// @route   POST /api/events
// @access  Private/ClubCoordinator
const createEvent = async (req, res) => {
  try {
    const { title, description, category, date, startTime, endTime, venue, clubName } = req.body;

    const event = new Event({
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      clubName,
      coordinator: req.user._id
    });

    const createdEvent = await event.save();

    if (req.io) {
      req.io.to('role:Admin').emit('event_proposed', createdEvent);
      req.io.to('role:Admin').emit('notification', {
        title: 'New Event Proposal',
        message: `New event '${title}' proposed by ${clubName}`,
        type: 'info'
      });
    }

    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // If student, only show approved
    if (req.user.role === 'Student') {
      query.status = 'Approved';
    } else if (status) {
      query.status = status;
    }

    const events = await Event.find(query).populate('coordinator', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event status (Approve/Reject)
// @route   PUT /api/events/:id/status
// @access  Private/Admin
const updateEventStatus = async (req, res) => {
  try {
    const { status, adminComments } = req.body;
    const event = await Event.findById(req.params.id);

    if (event) {
      event.status = status;
      event.adminComments = adminComments;
      const updatedEvent = await event.save();

      // If approved, add to Calendar and Notify Students
      if (status === 'Approved') {
        const CalendarEvent = require('../models/CalendarEvent');
        const Notification = require('../models/Notification');

        // Add to Calendar
        await CalendarEvent.create({
          title: event.title,
          start: new Date(`${event.date.toISOString().split('T')[0]}T${event.startTime}`),
          end: new Date(`${event.date.toISOString().split('T')[0]}T${event.endTime}`),
          type: 'Club',
          description: event.description,
          createdBy: req.user._id
        });

        // Notify Students
        await Notification.create({
          recipientRole: 'Student',
          title: 'New Club Event',
          message: `New event '${event.title}' by ${event.clubName} has been approved. Check the calendar!`,
          type: 'Event'
        });
      }

      // Notify Coordinator about the decision
      const Notification = require('../models/Notification');
      await Notification.create({
        type: 'Event'
      });

      if (req.io) {
        // Notify Coordinator
        // Ideally we would emit to specific user, but we'll broadcast to coordinators or specific room if we had it
        // For now, we'll assume the client filters or we just emit to all coordinators to refresh list
        req.io.to('role:Club Coordinator').emit('event_status_updated', updatedEvent);

        if (status === 'Approved') {
          req.io.to('role:Student').emit('event_published', updatedEvent);
          req.io.to('role:Student').emit('notification', {
            title: 'New Club Event',
            message: `New event '${event.title}' approved!`,
            type: 'success'
          });
        }
      }

      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents, updateEventStatus };
