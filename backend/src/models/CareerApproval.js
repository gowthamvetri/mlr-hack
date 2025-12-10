const mongoose = require('mongoose');

const careerApprovalSchema = mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  step: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  stepTitle: {
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    default: ''
  },
  proofUrl: {
    type: String,
    default: ''
  },
  proofFileName: {
    type: String,
    default: ''
  },
  adminComment: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
careerApprovalSchema.index({ student: 1, step: 1 });
careerApprovalSchema.index({ status: 1 });

const CareerApproval = mongoose.model('CareerApproval', careerApprovalSchema);

module.exports = CareerApproval;
