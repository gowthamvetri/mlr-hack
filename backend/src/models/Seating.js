const mongoose = require('mongoose');

const seatingSchema = mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomNumber: { type: String, required: true },
  seatNumber: { type: String, required: true },
  floor: { type: String },
  building: { type: String },
}, {
  timestamps: true,
});

const Seating = mongoose.model('Seating', seatingSchema);

module.exports = Seating;
