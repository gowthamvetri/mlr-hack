const Subject = require('../models/Subject');

// @desc    Get all subjects (syllabus)
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    // In real app, filter by student's department/semester
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject (Seed data helper)
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  try {
    const subject = new Subject(req.body);
    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getSubjects, createSubject };
