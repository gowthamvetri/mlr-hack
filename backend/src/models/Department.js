const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
