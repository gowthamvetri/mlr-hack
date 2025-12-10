const mongoose = require('mongoose');

const clubProfileSchema = mongoose.Schema({
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubName: { type: String, required: true, unique: true },
  category: { type: String, enum: ['Technical', 'Cultural', 'Sports', 'Other'], default: 'Technical' },
  tagline: { type: String },
  description: { type: String },
  objectives: { type: String },
  facultyInCharge: { type: String },
  contactEmail: { type: String },
  logoUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ClubProfile', clubProfileSchema);