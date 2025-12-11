const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
  type: { type: String, enum: ['Faculty', 'Student'], default: 'Student' },
});

const rankingSchema = mongoose.Schema({
  organization: { type: String, required: true },
  rank: { type: String },
  year: { type: String },
  logo: { type: String },
});

const departmentSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String },
  headOfDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
  
  // Static page content
  overview: { type: String },
  mission: { type: String },
  vision: { type: String },
  image: { type: String }, // Department banner/header image
  
  // Rankings
  rankings: [rankingSchema],
  
  // Activities
  activities: [activitySchema],
  
  // Accreditations
  accreditations: [{
    name: { type: String },
    logo: { type: String },
  }],
  
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Generate slug from name before saving
departmentSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
