const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
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

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
