const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
  courseName: { type: String, required: true },
  courseCode: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  examType: {
    type: String,
    required: true,
    enum: ['Internal', 'Semester', 'Midterm', 'Final', 'Lab']
  },
  session: {
    type: String,
    enum: ['FN', 'AN'], // Forenoon (9AM-12PM) or Afternoon (2PM-5PM)
    default: 'FN'
  },
  department: { type: String, required: true },
  semester: { type: String, required: true }, // e.g., "Fall 2024"
  year: { type: Number, min: 1, max: 4 }, // Student year (1-4)
  batches: [{ type: String }], // Allowed batches

  // Scheduling fields
  subjectType: {
    type: String,
    enum: ['HEAVY', 'NONMAJOR'],
    default: 'HEAVY'
  },

  // Timetable entries for scheduled exams
  timetable: [{
    date: { type: Date },
    session: { type: String, enum: ['FN', 'AN'] },
    subjectCode: { type: String },
    subjectName: { type: String },
    department: { type: String }
  }],

  // Hall ticket and seating status
  hallTicketsGenerated: { type: Boolean, default: false },
  hallTicketsAuthorized: { type: Boolean, default: false },
  seatingPublished: { type: Boolean, default: false },
  seatingPdfPath: { type: String },

  // Scheduling metadata
  scheduleViolations: [{
    message: { type: String },
    severity: { type: String, enum: ['WARNING', 'ERROR'] }
  }],

  // Created by (Admin who scheduled)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
});

// Index for efficient queries
examSchema.index({ department: 1, date: 1 });
examSchema.index({ year: 1, examType: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
