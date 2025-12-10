const express = require('express');
const router = express.Router();
const { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  enrollStudent,
  getCourseStats,
  uploadMaterial,
  deleteMaterial,
  getCourseMaterials
} = require('../controllers/courseController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadCourseMaterial } = require('../config/upload');

router.route('/')
  .get(protect, getCourses)
  .post(protect, admin, createCourse);

router.route('/stats').get(protect, admin, getCourseStats);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, admin, updateCourse)
  .delete(protect, admin, deleteCourse);

router.route('/:id/enroll').post(protect, enrollStudent);

// Material upload routes
router.route('/:id/materials')
  .get(protect, getCourseMaterials)
  .post(protect, admin, uploadCourseMaterial.single('file'), uploadMaterial);

router.route('/:id/materials/:materialId')
  .delete(protect, admin, deleteMaterial);

module.exports = router;
