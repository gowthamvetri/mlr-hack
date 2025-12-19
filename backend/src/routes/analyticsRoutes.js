const express = require('express');
const router = express.Router();
const {
    getAdminStats,
    getPerformanceMetrics,
    getDepartmentDistribution,
    getCourseAnalytics,
    getPlacementAnalytics,
    getStudentEngagementStats,
    getMonthlyTrends,
    getExamAnalytics,
    getQuickInsights
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin stats
router.route('/admin').get(protect, admin, getAdminStats);
router.route('/performance-metrics').get(protect, admin, getPerformanceMetrics);
router.route('/department-distribution').get(protect, admin, getDepartmentDistribution);

// Course analytics
router.route('/courses').get(protect, admin, getCourseAnalytics);

// Placement analytics
router.route('/placements').get(protect, admin, getPlacementAnalytics);

// Student engagement
router.route('/engagement').get(protect, admin, getStudentEngagementStats);

// Monthly trends
router.route('/monthly-trends').get(protect, admin, getMonthlyTrends);

// Exam analytics
router.route('/exams').get(protect, admin, getExamAnalytics);

// Quick insights
router.route('/insights').get(protect, admin, getQuickInsights);

module.exports = router;