const express = require('express');
const router = express.Router();
const { getSubjects, createSubject } = require('../controllers/subjectController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSubjects)
  .post(protect, admin, createSubject);

module.exports = router;
