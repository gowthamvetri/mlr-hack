const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const roadmapStepSchema = mongoose.Schema({
  stepId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  tasks: [taskSchema]
});

const skillSchema = mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Soft Skills', 'Tools', 'Other'], default: 'Technical' },
  level: { type: Number, default: 0, min: 0, max: 100 },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  endorsements: { type: Number, default: 0 }
});

const goalSchema = mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Soft Skills', 'Projects', 'Certifications', 'Other'], default: 'Technical' },
  description: { type: String },
  deadline: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed', 'Cancelled'], default: 'Not Started' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const profileDataSchema = mongoose.Schema({
  bio: { type: String },
  phone: { type: String },
  address: { type: String },
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String },
  photo: { type: String },
  resume: { type: String },
  education: [{
    institution: String,
    degree: String,
    field: String,
    startYear: Number,
    endYear: Number,
    grade: String
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  projects: [{
    title: String,
    description: String,
    technologies: [String],
    link: String,
    github: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }]
});

const studentProgressSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Profile completion tracking
  profileScore: { type: Number, default: 0, min: 0, max: 100 },
  profileData: profileDataSchema,
  
  // Career readiness
  careerReadiness: { type: Number, default: 0, min: 0, max: 100 },
  
  // Roadmap progress
  roadmap: [roadmapStepSchema],
  currentStep: { type: Number, default: 1 },
  
  // Skills tracking
  skills: [skillSchema],
  
  // Goals
  goals: [goalSchema],
  
  // Streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActive: { type: Date },
  
  // Assessments completed
  assessmentsCompleted: [{
    type: { type: String, enum: ['Technical', 'Aptitude', 'Communication', 'Personality'] },
    score: Number,
    completedAt: Date
  }],
  
  // Interview prep progress
  mockInterviewsCompleted: { type: Number, default: 0 },
  interviewScore: { type: Number, default: 0 },
  
  // Job applications tracking
  applicationsSubmitted: { type: Number, default: 0 },
  interviewsScheduled: { type: Number, default: 0 },
  offersReceived: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Initialize default roadmap steps for new users
studentProgressSchema.pre('save', function(next) {
  if (this.isNew && (!this.roadmap || this.roadmap.length === 0)) {
    this.roadmap = [
      {
        stepId: 1,
        title: 'Complete Your Profile',
        description: 'Add your education, skills, and experience to create a professional profile',
        progress: 0,
        completed: false,
        tasks: [
          { id: '1-1', title: 'Add profile photo', completed: false },
          { id: '1-2', title: 'Complete education details', completed: false },
          { id: '1-3', title: 'Add your skills', completed: false },
          { id: '1-4', title: 'Write a professional bio', completed: false }
        ]
      },
      {
        stepId: 2,
        title: 'Skill Assessment',
        description: 'Take assessments to validate and showcase your technical and soft skills',
        progress: 0,
        completed: false,
        tasks: [
          { id: '2-1', title: 'Complete technical assessment', completed: false },
          { id: '2-2', title: 'Complete aptitude test', completed: false },
          { id: '2-3', title: 'Complete communication skills test', completed: false }
        ]
      },
      {
        stepId: 3,
        title: 'Build Your Resume',
        description: 'Create an ATS-friendly resume that highlights your strengths',
        progress: 0,
        completed: false,
        tasks: [
          { id: '3-1', title: 'Choose a resume template', completed: false },
          { id: '3-2', title: 'Add work experience', completed: false },
          { id: '3-3', title: 'Add projects', completed: false },
          { id: '3-4', title: 'Get resume feedback', completed: false }
        ]
      },
      {
        stepId: 4,
        title: 'Interview Preparation',
        description: 'Practice for technical and HR interviews to boost your confidence',
        progress: 0,
        completed: false,
        tasks: [
          { id: '4-1', title: 'Complete 3 mock interviews', completed: false },
          { id: '4-2', title: 'Practice technical questions', completed: false },
          { id: '4-3', title: 'Practice HR questions', completed: false },
          { id: '4-4', title: 'Participate in group discussions', completed: false }
        ]
      },
      {
        stepId: 5,
        title: 'Apply for Jobs',
        description: 'Start applying to companies and track your applications',
        progress: 0,
        completed: false,
        tasks: [
          { id: '5-1', title: 'Shortlist target companies', completed: false },
          { id: '5-2', title: 'Tailor resume for each application', completed: false },
          { id: '5-3', title: 'Apply to at least 10 companies', completed: false },
          { id: '5-4', title: 'Follow up on applications', completed: false }
        ]
      }
    ];
  }
  next();
});

// Calculate profile score
studentProgressSchema.methods.calculateProfileScore = function() {
  let score = 0;
  const profile = this.profileData || {};
  
  if (profile.photo) score += 15;
  if (profile.bio && profile.bio.length > 50) score += 10;
  if (profile.phone) score += 5;
  if (profile.linkedin) score += 10;
  if (profile.github) score += 10;
  if (profile.education && profile.education.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 15;
  if (profile.projects && profile.projects.length > 0) score += 10;
  if (this.skills && this.skills.length >= 5) score += 10;
  
  this.profileScore = Math.min(score, 100);
  return this.profileScore;
};

// Calculate career readiness
studentProgressSchema.methods.calculateCareerReadiness = function() {
  let score = 0;
  
  // Profile completion (30%)
  score += (this.profileScore / 100) * 30;
  
  // Roadmap progress (40%)
  const roadmapProgress = this.roadmap.reduce((acc, step) => acc + step.progress, 0) / (this.roadmap.length * 100);
  score += roadmapProgress * 40;
  
  // Skills (20%)
  const avgSkillLevel = this.skills.length > 0 
    ? this.skills.reduce((acc, skill) => acc + skill.level, 0) / this.skills.length 
    : 0;
  score += (avgSkillLevel / 100) * 20;
  
  // Goals completion (10%)
  const completedGoals = this.goals.filter(g => g.status === 'Completed').length;
  const totalGoals = this.goals.length || 1;
  score += (completedGoals / totalGoals) * 10;
  
  this.careerReadiness = Math.round(score);
  return this.careerReadiness;
};

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;
