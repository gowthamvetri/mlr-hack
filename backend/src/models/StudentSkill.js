const mongoose = require('mongoose');

const studentSkillSchema = mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skills: [{
    name: { type: String, required: true },
    level: { type: Number, default: 0, min: 0, max: 100 },
    trend: { type: String, default: '+0%' },
    lastUpdated: { type: Date, default: Date.now },
    category: { type: String }, // 'Technical', 'Soft Skills', etc.
  }],
  totalSkills: { type: Number, default: 0 },
  skillsGainedThisMonth: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const StudentSkill = mongoose.model('StudentSkill', studentSkillSchema);

module.exports = StudentSkill;
