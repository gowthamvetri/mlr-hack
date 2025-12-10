const express = require('express');
const router = express.Router();
const { getClubProfile, updateClubProfile, getClubStats } = require('../controllers/clubController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getClubProfile).post(protect, updateClubProfile);
router.route('/stats').get(protect, getClubStats);

module.exports = router;