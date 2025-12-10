const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  id: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const goalSchema = mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Technical' },
  deadline: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, default: 'In Progress' }
}, { _id: false });

const careerProgressSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileScore: { type: Number, default: 0, min: 0, max: 100 },
  careerReadiness: { type: Number, default: 0, min: 0, max: 100 },
  roadmap: [{
    step: { type: Number, required: true },
    title: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    tasks: [taskSchema]
  }],
  goals: [goalSchema],
  activeGoals: { type: Number, default: 0 },
  exploredCareers: { 
    current: { type: Number, default: 0 },
    total: { type: Number, default: 6 }
  },
  resumeScore: { type: Number, default: 0 },
  interviewReadiness: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const CareerProgress = mongoose.model('CareerProgress', careerProgressSchema);

module.exports = CareerProgress;
