const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    uploadResults,
    getAdminResults,
    getBatchDetails,
    togglePublishBatch,
    deleteBatch,
    getMyResults
} = require('../controllers/resultController');

// Student routes
router.get('/my-results', protect, analyzeUserRole, getMyResults);

// Admin routes
router.post('/upload', protect, authorize('Admin', 'Coordinator'), uploadResults);
router.get('/admin', protect, authorize('Admin', 'Coordinator'), getAdminResults);
router.get('/admin/batch/:batchId', protect, authorize('Admin', 'Coordinator'), getBatchDetails);
router.put('/publish/:batchId', protect, authorize('Admin', 'Coordinator'), togglePublishBatch);
router.delete('/batch/:batchId', protect, authorize('Admin', 'Coordinator'), deleteBatch);

// Helper middleware to allow student access if role logic is complex or strict
function analyzeUserRole(req, res, next) {
    if (req.user && (req.user.role === 'Student' || req.user.role === 'Admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized' });
    }
}

module.exports = router;
