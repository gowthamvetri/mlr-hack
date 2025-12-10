const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  // If user is null, it's a broadcast to a role
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  recipientRole: { type: String, enum: ['Student', 'Admin', 'SeatingManager', 'ClubCoordinator'] },
  title: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['Exam', 'HallTicket', 'Seating', 'Event', 'General', 'Academic'], default: 'General' },
  read: { type: Boolean, default: false }, // Legacy field - for user-specific notifications
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track which users have read this (for role-based)
  expiresAt: { type: Date }, // Optional expiry date for auto-cleanup
}, {
  timestamps: true,
});

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
