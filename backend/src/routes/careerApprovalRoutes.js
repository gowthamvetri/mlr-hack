const express = require('express');
const router = express.Router();
const { 
  submitApprovalRequest,
  getMyApprovalRequests,
  getMyApprovalStatus,
  getPendingApprovals,
  getAllApprovals,
  approveRequest,
  rejectRequest,
  getApprovalStats
} = require('../controllers/careerApprovalController');
const { protect, admin } = require('../middleware/authMiddleware');

// Student routes
router.post('/submit', protect, submitApprovalRequest);
router.get('/my-requests', protect, getMyApprovalRequests);
router.get('/my-status', protect, getMyApprovalStatus);

// Admin routes
router.get('/pending', protect, admin, getPendingApprovals);
router.get('/all', protect, admin, getAllApprovals);
router.get('/stats', protect, admin, getApprovalStats);
router.put('/approve/:id', protect, admin, approveRequest);
router.put('/reject/:id', protect, admin, rejectRequest);

module.exports = router;
