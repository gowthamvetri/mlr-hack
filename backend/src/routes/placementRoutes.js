const express = require('express');
const router = express.Router();
const { 
  getPlacements, 
  getPlacementById, 
  createPlacement, 
  updatePlacement, 
  deletePlacement,
  applyForPlacement,
  getPlacementStats,
  addSelectedStudents,
  getEligibleStudents
} = require('../controllers/placementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPlacements)
  .post(protect, admin, createPlacement);

router.route('/stats').get(protect, admin, getPlacementStats);

// Get eligible students for selection (for future student selection feature)
router.route('/eligible-students').get(protect, admin, getEligibleStudents);

router.route('/:id')
  .get(protect, getPlacementById)
  .put(protect, admin, updatePlacement)
  .delete(protect, admin, deletePlacement);

router.route('/:id/apply').post(protect, applyForPlacement);

// Add selected students to a placement drive (for future feature)
router.route('/:id/select-students').post(protect, admin, addSelectedStudents);

module.exports = router;
