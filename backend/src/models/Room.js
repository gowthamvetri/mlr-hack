const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  hallNo: { type: String }, // Display name like "Hall A", "Room 101"
  building: { type: String, default: 'Main Block' },
  floor: { type: String, default: '1' },
  capacity: { type: Number, required: true },
  columns: { type: Number, default: 5 }, // Number of columns for grid layout
  layoutPattern: { type: String, default: 'Rows', enum: ['Rows', 'Grid', 'Columns'] },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);