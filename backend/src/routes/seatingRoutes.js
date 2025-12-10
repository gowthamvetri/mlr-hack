const express = require('express');
const router = express.Router();
const { allocateSeating, getMySeat } = require('../controllers/seatingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/allocate', protect, allocateSeating); // Should be SeatingManager only
router.get('/my-seat', protect, getMySeat);

module.exports = router;
