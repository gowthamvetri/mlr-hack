const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Admin', 'SeatingManager', 'ClubCoordinator'],
    required: true,
  },
  // Student specific fields
  department: { type: String },
  year: { type: String },
  rollNumber: { type: String },
  
  // Placement tracking fields (for students)
  isPlaced: { type: Boolean, default: false },
  placementCompany: { type: String },
  placementPackage: { type: Number },
  placementPosition: { type: String },
  placedAt: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement' },
  placementDate: { type: Date },
  
  // Club Coordinator specific fields
  clubName: { type: String },
  
  // Admin specific fields
  office: { type: String },
  
  // Common profile fields
  phone: { type: String },
  bio: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', '', null] },
}, {
  timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password - using async without next() parameter
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
