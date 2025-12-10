const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  building: { type: String },
  floor: { type: String },
  capacity: { type: Number, required: true },
  layoutPattern: { type: String, default: 'Rows' },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);