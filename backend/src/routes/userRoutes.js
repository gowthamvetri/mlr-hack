const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, getUserById, deleteUser, getProfile, updateProfile } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/:id').get(protect, admin, getUserById).delete(protect, admin, deleteUser);

module.exports = router;
