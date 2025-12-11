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
const { protect, admin, adminOrStaff } = require('../middleware/authMiddleware');

// Student routes
router.post('/submit', protect, submitApprovalRequest);
router.get('/my-requests', protect, getMyApprovalRequests);
router.get('/my-status', protect, getMyApprovalStatus);

// Admin and Staff routes (Staff can now manage career approvals)
router.get('/pending', protect, adminOrStaff, getPendingApprovals);
router.get('/all', protect, adminOrStaff, getAllApprovals);
router.get('/stats', protect, adminOrStaff, getApprovalStats);
router.put('/approve/:id', protect, adminOrStaff, approveRequest);
router.put('/reject/:id', protect, adminOrStaff, rejectRequest);

module.exports = router;
