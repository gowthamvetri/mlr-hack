const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  examType: { type: String, required: true }, // Midterm, Final, Lab
  department: { type: String, required: true },
  semester: { type: String, required: true }, // e.g., "Fall 2024", "Spring 2025"
  batches: [{ type: String }], // Allowed batches
  hallTicketsGenerated: { type: Boolean, default: false },
  seatingPublished: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
