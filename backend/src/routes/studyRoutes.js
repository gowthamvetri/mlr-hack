const express = require('express');
const router = express.Router();
const { getProgress, toggleTopic } = require('../controllers/studyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:subjectId', protect, getProgress);
router.post('/toggle', protect, toggleTopic);

module.exports = router;
