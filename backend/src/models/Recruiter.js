const mongoose = require('mongoose');

const recruiterSchema = mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, required: true },
  website: { type: String },
  category: { type: String, enum: ['Top', 'Regular', 'Partner'], default: 'Regular' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const Recruiter = mongoose.model('Recruiter', recruiterSchema);

module.exports = Recruiter;
