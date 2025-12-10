const mongoose = require('mongoose');

const studentStreakSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  totalActiveDays: { type: Number, default: 0 },
  streakHistory: [{
    date: { type: Date },
    activities: { type: Number, default: 0 }
  }],
}, {
  timestamps: true,
});

const StudentStreak = mongoose.model('StudentStreak', studentStreakSchema);

module.exports = StudentStreak;
