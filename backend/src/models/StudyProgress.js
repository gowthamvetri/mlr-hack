const mongoose = require('mongoose');

const studyProgressSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  completedTopics: [{ type: String }], // List of topic names or IDs
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
}, {
  timestamps: true,
});

const StudyProgress = mongoose.model('StudyProgress', studyProgressSchema);

module.exports = StudyProgress;
