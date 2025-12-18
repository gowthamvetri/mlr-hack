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
  getDepartments
} = require('../controllers/subjectController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes (protected by auth)
router.route('/')
  .get(protect, getSubjects)
  .post(protect, admin, createSubject);

// Get departments list
router.get('/departments', protect, getDepartments);

// Get subjects for exam scheduling
router.get('/for-exam', protect, admin, getSubjectsForExam);

// Bulk import subjects
router.post('/bulk-import', protect, admin, bulkImportSubjects);

// Individual subject operations
router.route('/:id')
  .get(protect, getSubjectById)
  .put(protect, admin, updateSubject)
  .delete(protect, admin, deleteSubject);

module.exports = router;
