const express = require('express');
const router = express.Router();
const { 
  getStreak,
  updateStreak,
  getSkills,
  updateSkill,
  getCareerProgress,
  updateCareerProgress,
  getAllStreaks
} = require('../controllers/studentProgressController');
const { protect, admin } = require('../middleware/authMiddleware');

// Student routes
router.route('/streak')
  .get(protect, getStreak)
  .post(protect, updateStreak);

router.route('/skills')
  .get(protect, getSkills)
  .put(protect, updateSkill);

router.route('/career')
  .get(protect, getCareerProgress)
  .put(protect, updateCareerProgress);

// Admin routes
router.route('/streaks/all').get(protect, admin, getAllStreaks);

module.exports = router;
