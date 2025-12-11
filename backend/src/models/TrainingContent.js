const mongoose = require('mongoose');

const trainingContentSchema = mongoose.Schema({
  type: { type: String, enum: ['Industry Ready', 'Domain'], required: true },
  title: { type: String, required: true },
  points: [{ type: String }],
  department: { type: String }, // For domain-specific training
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const TrainingContent = mongoose.model('TrainingContent', trainingContentSchema);

module.exports = TrainingContent;
