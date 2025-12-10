const mongoose = require('mongoose');

const calendarEventSchema = mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date },
  type: { type: String, enum: ['Holiday', 'Exam', 'Class', 'Deadline', 'Event'], required: true },
  scope: { type: String, enum: ['Institute', 'Department', 'Batch'], default: 'Institute' },
  department: { type: String }, // If scope is Department
  batch: { type: String }, // If scope is Batch
  description: { type: String },
}, {
  timestamps: true,
});

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

module.exports = CalendarEvent;
