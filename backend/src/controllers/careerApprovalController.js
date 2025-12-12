const CareerApproval = require('../models/CareerApproval');
const CareerProgress = require('../models/CareerProgress');
const mongoose = require('mongoose');

// Student: Submit approval request for a step
const submitApprovalRequest = async (req, res) => {
  try {
    const { step, stepTitle, requestMessage } = req.body;

    // Check if there's already a pending request for this step
    const existingRequest = await CareerApproval.findOne({
      student: req.user._id,
      step,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this step' });
    }

    // Check if step is already approved
    const approvedRequest = await CareerApproval.findOne({
      student: req.user._id,
      step,
      status: 'approved'
    });

    if (approvedRequest) {
      return res.status(400).json({ message: 'This step is already approved' });
    }

    const approval = await CareerApproval.create({
      student: req.user._id,
      step,
      stepTitle,
      requestMessage,
      status: 'pending'
    });

    res.status(201).json(approval);

    if (req.io) {
      req.io.to('role:Admin').to('role:Staff').emit('career_request_created', approval);
      req.io.to('role:Admin').to('role:Staff').emit('notification', {
        title: 'New Career Approval Request',
        message: `A new approval request from has been submitted for ${stepTitle}`,
        type: 'info'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: Get their approval requests
const getMyApprovalRequests = async (req, res) => {
  try {
    const requests = await CareerApproval.find({ student: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: Get approval status for all steps
const getMyApprovalStatus = async (req, res) => {
  try {
    const approvals = await CareerApproval.find({ student: req.user._id });

    // Create a map of step -> status
    const statusMap = {};
    approvals.forEach(approval => {
      // If there's an approved status, prioritize it
      if (!statusMap[approval.step] || approval.status === 'approved') {
        statusMap[approval.step] = {
          status: approval.status,
          requestId: approval._id,
          adminComment: approval.adminComment,
          reviewedAt: approval.reviewedAt
        };
      }
    });

    res.json(statusMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all pending approval requests
const getPendingApprovals = async (req, res) => {
  try {
    const requests = await CareerApproval.find({ status: 'pending' })
      .populate('student', 'name email department rollNumber')
      .sort({ createdAt: 1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all approval requests with filters
const getAllApprovals = async (req, res) => {
  try {
    const { status, step } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (step && step !== 'all') filter.step = parseInt(step);

    const requests = await CareerApproval.find(filter)
      .populate('student', 'name email department rollNumber')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Approve a request
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const approval = await CareerApproval.findById(id);
    if (!approval) {
      return res.status(404).json({ message: 'Request not found' });
    }

    approval.status = 'approved';
    approval.adminComment = adminComment || '';
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    await approval.save();

    // Update the student's career progress
    let progress = await CareerProgress.findOne({ student: approval.student });
    if (progress) {
      const roadmapStep = progress.roadmap.find(r => r.step === approval.step);
      if (roadmapStep) {
        roadmapStep.progress = 100;
        roadmapStep.completed = true;
        await progress.save();
      }
    }

    const populated = await CareerApproval.findById(id)
      .populate('student', 'name email department rollNumber')
      .populate('reviewedBy', 'name');

    res.json(populated);

    if (req.io) {
      req.io.to(`user:${approval.student._id}`).emit('career_approval_updated', populated);
      req.io.to(`user:${approval.student._id}`).emit('notification', {
        title: 'Career Request Approved',
        message: `Your request for ${approval.stepTitle} has been approved.`,
        type: 'success'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Reject a request
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const approval = await CareerApproval.findById(id);
    if (!approval) {
      return res.status(404).json({ message: 'Request not found' });
    }

    approval.status = 'rejected';
    approval.adminComment = adminComment || 'Request rejected';
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    await approval.save();

    const populated = await CareerApproval.findById(id)
      .populate('student', 'name email department rollNumber')
      .populate('reviewedBy', 'name');

    res.json(populated);

    if (req.io) {
      req.io.to(`user:${approval.student._id}`).emit('career_approval_updated', populated);
      req.io.to(`user:${approval.student._id}`).emit('notification', {
        title: 'Career Request Rejected',
        message: `Your request for ${approval.stepTitle} has been rejected. Check remarks.`,
        type: 'error'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get approval stats
const getApprovalStats = async (req, res) => {
  try {
    const stats = await CareerApproval.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stepStats = await CareerApproval.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$step',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      byStep: {}
    };

    stats.forEach(s => {
      result[s._id] = s.count;
    });

    stepStats.forEach(s => {
      result.byStep[s._id] = s.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitApprovalRequest,
  getMyApprovalRequests,
  getMyApprovalStatus,
  getPendingApprovals,
  getAllApprovals,
  approveRequest,
  rejectRequest,
  getApprovalStats
};
