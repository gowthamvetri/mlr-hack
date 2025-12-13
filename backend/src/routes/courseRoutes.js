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
  getCourseMaterials,
  getMyEnrolledCourses,
  getMyTaughtCourses,
  uploadMaterialAsTeacher
} = require('../controllers/courseController');
const { generateMindMap, saveMindMap } = require('../controllers/mindMapController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');
const { uploadCourseMaterial } = require('../middleware/uploadMiddleware'); // Import from new middleware location

router.route('/')
  .get(getCourses) // Changed from protect, getCourses
  .post(protect, authorize('Admin', 'Faculty'), createCourse); // Changed from admin to authorize

router.route('/stats').get(protect, authorize('Admin', 'Faculty'), getCourseStats); // Changed from admin to authorize

// Student routes
router.route('/my-enrolled').get(protect, getMyEnrolledCourses);

// Teacher routes
router.route('/my-taught').get(protect, authorize('Faculty', 'Staff'), getMyTaughtCourses); // Changed to authorize

// Mind Map Routes
router.route('/mindmap/generate').post(protect, authorize('Admin', 'Staff', 'Faculty'), generateMindMap);
router.route('/mindmap/save').post(protect, authorize('Admin', 'Staff', 'Faculty'), saveMindMap);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, admin, updateCourse)
  .delete(protect, admin, deleteCourse);

router.route('/:id/enroll').post(protect, enrollStudent);

// Material upload routes
router.route('/:id/materials')
  .get(protect, getCourseMaterials)
  .post(protect, admin, uploadCourseMaterial.single('file'), uploadMaterial);

// Teacher can also upload materials to their assigned courses
router.route('/:id/materials/teacher')
  .post(protect, uploadCourseMaterial.single('file'), uploadMaterialAsTeacher);

router.route('/:id/materials/:materialId')
  .delete(protect, admin, deleteMaterial);

module.exports = router;
