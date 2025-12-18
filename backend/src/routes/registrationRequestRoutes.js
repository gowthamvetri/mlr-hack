const express = require('express');
const router = express.Router();
const {
  submitRegistrationRequest,
  getAllRegistrationRequests,
  getRegistrationStats,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  checkRequestStatus
} = require('../controllers/registrationRequestController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/', submitRegistrationRequest);
router.get('/check/:email', checkRequestStatus);

// Admin & Staff routes (Staff can now approve students)
router.get('/', protect, authorize('Admin', 'Staff'), getAllRegistrationRequests);
router.get('/stats', protect, authorize('Admin', 'Staff'), getRegistrationStats);
router.put('/:id/approve', protect, authorize('Admin', 'Staff'), approveRegistrationRequest);
router.put('/:id/reject', protect, authorize('Admin', 'Staff'), rejectRegistrationRequest);

module.exports = router;
