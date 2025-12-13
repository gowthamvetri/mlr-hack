const mongoose = require('mongoose');

const materialSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'doc', 'video', 'link', 'other'], default: 'pdf' },
  url: { type: String, required: true },
  size: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  mindMap: { type: String } // Markdown content for mind map
});

const courseSchema = mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  credits: { type: Number, default: 3 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instructorName: { type: String },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalEnrolled: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  status: { type: String, enum: ['Active', 'Inactive', 'Completed', 'Upcoming'], default: 'Active' },
  semester: { type: String },
  year: { type: String },
  materials: [materialSchema],
}, {
  timestamps: true,
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
