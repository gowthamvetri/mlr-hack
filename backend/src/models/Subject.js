const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: Number, min: 1, max: 4 }, // Student year (1-4)
  semester: { type: Number, min: 1, max: 8 }, // Semester number

  // For exam scheduling algorithm
  subjectType: {
    type: String,
    enum: ['HEAVY', 'NONMAJOR'],
    default: 'HEAVY'
  },
  credits: { type: Number, default: 3 },

  syllabus: [{
    unit: { type: String, required: true },
    topics: [{
      name: { type: String, required: true },
      subtopics: [{ type: String }],
      difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
      estimatedTime: { type: String }, // e.g., "2 hours"
      resources: [{
        title: { type: String },
        type: { type: String, enum: ['PDF', 'Video', 'Link'] },
        url: { type: String }
      }]
    }]
  }]
}, {
  timestamps: true,
});

// Index for efficient queries
subjectSchema.index({ department: 1, year: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
