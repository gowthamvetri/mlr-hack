const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkImportSubjects,
  getSubjectsForExam,
  getDepartments,
  getMySubjects,
  addMaterial,
  uploadMaterial,
  deleteMaterial,
  getStaffList,
  generateMaterialMindMap,
  saveMaterialMindMap,
  getSubjectsForStudent,
  getSubjectMaterials
} = require('../controllers/subjectController');
const { protect, admin, adminOrStaff } = require('../middleware/authMiddleware');
const { uploadSubjectMaterial } = require('../middleware/uploadMiddleware');

// Public routes (protected by auth)
router.route('/')
  .get(protect, getSubjects)
  .post(protect, admin, createSubject);

// Get departments list
router.get('/departments', protect, getDepartments);

// Get staff list for assignment
router.get('/staff-list', protect, admin, getStaffList);

// Get subjects assigned to current staff
router.get('/my-subjects', protect, getMySubjects);

// Get subjects for student (department-based with approved materials only)
router.get('/student-subjects', protect, getSubjectsForStudent);

// Get subjects for exam scheduling
router.get('/for-exam', protect, admin, getSubjectsForExam);

// Bulk import subjects
router.post('/bulk-import', protect, admin, bulkImportSubjects);

// Individual subject operations
router.route('/:id')
  .get(protect, getSubjectById)
  .put(protect, admin, updateSubject)
  .delete(protect, admin, deleteSubject);

// Get materials for a specific subject (approved only for students)
router.get('/:id/materials', protect, getSubjectMaterials);

// Material operations (staff can add/delete if assigned)
router.post('/:id/materials', protect, addMaterial);
router.post('/:id/materials/upload', protect, uploadSubjectMaterial.single('file'), uploadMaterial);
router.delete('/:id/materials/:materialId', protect, deleteMaterial);

// Mind map operations
router.post('/:id/materials/:materialId/generate-mindmap', protect, generateMaterialMindMap);
router.put('/:id/materials/:materialId/save-mindmap', protect, saveMaterialMindMap);

module.exports = router;
