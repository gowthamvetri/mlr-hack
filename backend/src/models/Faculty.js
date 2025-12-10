const mongoose = require('mongoose');

const facultySchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  designation: { type: String, default: 'Assistant Professor' },
  specialization: { type: String },
  experience: { type: Number, default: 0 }, // in years
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  totalCourses: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  phone: { type: String },
  officeHours: { type: String },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
}, {
  timestamps: true,
});

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;
