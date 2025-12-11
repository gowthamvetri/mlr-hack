const express = require('express');
const router = express.Router();
const {
  getPlacementSlides,
  getAllPlacementSlides,
  createPlacementSlide,
  updatePlacementSlide,
  deletePlacementSlide,
  getRecruiters,
  getAllRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getTrainingContent,
  getAllTrainingContent,
  createTrainingContent,
  updateTrainingContent,
  deleteTrainingContent,
} = require('../controllers/placementPageController');
const { protect, admin } = require('../middleware/authMiddleware');

// ============= PUBLIC ROUTES =============
router.get('/slides', getPlacementSlides);
router.get('/recruiters', getRecruiters);
router.get('/training', getTrainingContent);

// ============= ADMIN ROUTES =============
// Slides
router.get('/admin/slides', protect, admin, getAllPlacementSlides);
router.post('/admin/slides', protect, admin, createPlacementSlide);
router.put('/admin/slides/:id', protect, admin, updatePlacementSlide);
router.delete('/admin/slides/:id', protect, admin, deletePlacementSlide);

// Recruiters
router.get('/admin/recruiters', protect, admin, getAllRecruiters);
router.post('/admin/recruiters', protect, admin, createRecruiter);
router.put('/admin/recruiters/:id', protect, admin, updateRecruiter);
router.delete('/admin/recruiters/:id', protect, admin, deleteRecruiter);

// Training Content
router.get('/admin/training', protect, admin, getAllTrainingContent);
router.post('/admin/training', protect, admin, createTrainingContent);
router.put('/admin/training/:id', protect, admin, updateTrainingContent);
router.delete('/admin/training/:id', protect, admin, deleteTrainingContent);

module.exports = router;
