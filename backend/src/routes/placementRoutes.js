const express = require('express');
const router = express.Router();
const { 
  getPlacements, 
  getPlacementById, 
  createPlacement, 
  updatePlacement, 
  deletePlacement,
  applyForPlacement,
  getPlacementStats
} = require('../controllers/placementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPlacements)
  .post(protect, admin, createPlacement);

router.route('/stats').get(protect, admin, getPlacementStats);

router.route('/:id')
  .get(protect, getPlacementById)
  .put(protect, admin, updatePlacement)
  .delete(protect, admin, deletePlacement);

router.route('/:id/apply').post(protect, applyForPlacement);

module.exports = router;
