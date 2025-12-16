const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, getUserById, deleteUser, getProfile, updateProfile, getPendingStudents, approveStudent, rejectStudent } = require('../controllers/userController');
const { protect, admin, adminOrStaff } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);

// Student approval routes (Admin or Staff can access)
router.get('/pending', protect, adminOrStaff, getPendingStudents);
router.put('/:id/approve', protect, adminOrStaff, approveStudent);
router.delete('/:id/reject', protect, adminOrStaff, rejectStudent);

router.route('/:id').get(protect, admin, getUserById).delete(protect, admin, deleteUser);

module.exports = router;

