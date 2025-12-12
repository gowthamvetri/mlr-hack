const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrationRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['SeatingManager', 'ClubCoordinator', 'Staff']
  },
  clubName: {
    type: String
  },
  staffDepartment: {
    type: String
  },
  staffDesignation: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminComment: {
    type: String
  }
}, {
  timestamps: true
});

// Note: Password is NOT hashed here, will be hashed when User is created upon approval

const RegistrationRequest = mongoose.model('RegistrationRequest', registrationRequestSchema);

module.exports = RegistrationRequest;
