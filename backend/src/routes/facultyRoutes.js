const express = require('express');
const router = express.Router();
const { 
  getFaculty, 
  getFacultyById, 
  createFaculty, 
  updateFaculty, 
  deleteFaculty,
  getFacultyStats
} = require('../controllers/facultyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getFaculty)
  .post(protect, admin, createFaculty);

router.route('/stats').get(protect, admin, getFacultyStats);

router.route('/:id')
  .get(protect, getFacultyById)
  .put(protect, admin, updateFaculty)
  .delete(protect, admin, deleteFaculty);

module.exports = router;
