const mongoose = require('mongoose');

const placementSchema = mongoose.Schema({
  company: { type: String, required: true },
  logo: { type: String },
  position: { type: String, required: true },
  package: { type: Number }, // in LPA
  packageRange: { type: String }, // e.g., "8-12 LPA"
  location: { type: String },
  type: { type: String, enum: ['Full-time', 'Internship', 'Contract'], default: 'Full-time' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  selectedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalSelected: { type: Number, default: 0 },
  driveDate: { type: Date },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
  description: { type: String },
  eligibility: { type: String },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalApplicants: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const Placement = mongoose.model('Placement', placementSchema);

module.exports = Placement;
