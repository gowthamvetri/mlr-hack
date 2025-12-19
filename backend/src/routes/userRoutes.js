const express = require('express');
const router = express.Router();
const { authUser, registerUser, createUserByAdmin, getUsers, getUserById, deleteUser, getProfile, updateProfile, getPendingStudents, approveStudent, rejectStudent, bulkImportStudents } = require('../controllers/userController');
const { protect, admin, adminOrStaff } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/admin/create', protect, admin, createUserByAdmin);
router.post('/bulk-import', protect, admin, bulkImportStudents);
router.post('/login', authUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

// Student approval routes (Admin only - staff cannot approve/reject students)
router.get('/pending', protect, admin, getPendingStudents);
router.put('/:id/approve', protect, admin, approveStudent);
router.delete('/:id/reject', protect, admin, rejectStudent);

router.route('/:id').get(protect, admin, getUserById).delete(protect, admin, deleteUser);

module.exports = router;

