const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  // If user is null, it's a broadcast to a role
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  recipientRole: { type: String, enum: ['Student', 'Admin', 'SeatingManager', 'ClubCoordinator'] },
  title: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['Exam', 'HallTicket', 'Seating', 'Event', 'General', 'Academic'], default: 'General' },
  read: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
