const mongoose = require('mongoose');

const placementSlideSchema = mongoose.Schema({
  title: { type: String, required: true },
  studentName: { type: String },
  rollNumber: { type: String },
  company: { type: String, required: true },
  package: { type: String }, // e.g., "₹25 LPA"
  image: { type: String, required: true },
  department: { type: String },
  batch: { type: String }, // e.g., "Batch 2025"
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const PlacementSlide = mongoose.model('PlacementSlide', placementSlideSchema);

module.exports = PlacementSlide;
