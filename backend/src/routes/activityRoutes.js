const express = require('express');
const router = express.Router();
const { 
  getRecentActivities,
  createActivity
} = require('../controllers/activityController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getRecentActivities)
  .post(protect, createActivity);

module.exports = router;
