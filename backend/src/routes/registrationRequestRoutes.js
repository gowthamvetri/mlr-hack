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
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', submitRegistrationRequest);
router.get('/check/:email', checkRequestStatus);

// Admin routes
router.get('/', protect, admin, getAllRegistrationRequests);
router.get('/stats', protect, admin, getRegistrationStats);
router.put('/:id/approve', protect, admin, approveRegistrationRequest);
router.put('/:id/reject', protect, admin, rejectRegistrationRequest);

module.exports = router;
