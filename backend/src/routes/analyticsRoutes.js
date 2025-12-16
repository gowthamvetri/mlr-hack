const express = require('express');
const router = express.Router();
const { getAdminStats, getPerformanceMetrics, getDepartmentDistribution } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/admin').get(protect, admin, getAdminStats);
router.route('/performance-metrics').get(protect, admin, getPerformanceMetrics);
router.route('/department-distribution').get(protect, admin, getDepartmentDistribution);

module.exports = router;