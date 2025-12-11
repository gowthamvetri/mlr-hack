const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Admin', 'SeatingManager', 'ClubCoordinator', 'Staff'],
    required: true,
  },
  // Student specific fields
  department: { type: String },
  year: { type: String },
  rollNumber: { type: String },
  semester: { type: String },
  batch: { type: String },
  
  // Student attendance and fee fields (for hall ticket eligibility)
  attendance: { type: Number, default: 0, min: 0, max: 100 }, // percentage
  feesPaid: { type: Boolean, default: false },
  feeDetails: {
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    remarks: { type: String }
  },
  
  // Placement tracking fields (for students)
  isPlaced: { type: Boolean, default: false },
  placementCompany: { type: String },
  placementPackage: { type: Number },
  placementPosition: { type: String },
  placedAt: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement' },
  placementDate: { type: Date },
  
  // Club Coordinator specific fields
  clubName: { type: String },
  
  // Staff specific fields
  staffDepartment: { type: String },
  staffDesignation: { type: String },
  
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
