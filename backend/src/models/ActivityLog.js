const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema({
  type: { 
    type: String, 
    enum: ['enrollment', 'course', 'system', 'faculty', 'event', 'exam', 'placement'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedEntity: { type: mongoose.Schema.Types.ObjectId }, // Can reference any model
  entityType: { type: String }, // 'User', 'Course', 'Event', etc.
  color: { type: String, default: 'blue' },
}, {
  timestamps: true,
});

// Auto-delete old activities after 30 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
