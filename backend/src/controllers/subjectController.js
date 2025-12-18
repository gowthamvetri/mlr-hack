const Subject = require('../models/Subject');

// @desc    Get all subjects with filters
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const { department, year, semester, search } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter).sort({ year: 1, semester: 1, code: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  try {
    const { code, name, department, year, semester, credits, subjectType } = req.body;

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    const subject = new Subject({
      code,
      name,
      department,
      year,
      semester,
      credits: credits || 3,
      subjectType: subjectType || 'HEAVY'
    });

    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
  try {
    const { code, name, department, year, semester, credits, subjectType } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if new code conflicts with another subject
    if (code && code !== subject.code) {
      const existingSubject = await Subject.findOne({ code });
      if (existingSubject) {
        return res.status(400).json({ message: 'Subject code already exists' });
      }
    }

    // Update fields
    subject.code = code || subject.code;
    subject.name = name || subject.name;
    subject.department = department || subject.department;
    subject.year = year || subject.year;
    subject.semester = semester || subject.semester;
    subject.credits = credits !== undefined ? credits : subject.credits;
    subject.subjectType = subjectType || subject.subjectType;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import subjects
// @route   POST /api/subjects/bulk-import
// @access  Private/Admin
const bulkImportSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'No subjects provided for import' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const subjectData of subjects) {
      try {
        // Check if subject already exists
        const existing = await Subject.findOne({ code: subjectData.code });
        if (existing) {
          // Update existing subject
          existing.name = subjectData.name || existing.name;
          existing.department = subjectData.department || existing.department;
          existing.year = subjectData.year || existing.year;
          existing.semester = subjectData.semester || existing.semester;
          existing.credits = subjectData.credits || existing.credits;
          existing.subjectType = subjectData.subjectType || existing.subjectType;
          await existing.save();
          results.success.push({ code: subjectData.code, action: 'updated' });
        } else {
          // Create new subject
          const newSubject = new Subject({
            code: subjectData.code,
            name: subjectData.name,
            department: subjectData.department,
            year: subjectData.year,
            semester: subjectData.semester,
            credits: subjectData.credits || 3,
            subjectType: subjectData.subjectType || 'HEAVY'
          });
          await newSubject.save();
          results.success.push({ code: subjectData.code, action: 'created' });
        }
      } catch (err) {
        results.failed.push({ code: subjectData.code, error: err.message });
      }
    }

    res.json({
      message: `Imported ${results.success.length} subjects, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subjects for exam scheduling (by year/dept/semester)
// @route   GET /api/subjects/for-exam
// @access  Private/Admin
const getSubjectsForExam = async (req, res) => {
  try {
    const { department, year, semester } = req.query;

    if (!department || !year) {
      return res.status(400).json({ message: 'Department and year are required' });
    }

    const filter = {
      department,
      year: parseInt(year)
    };

    if (semester) {
      filter.semester = parseInt(semester);
    }

    const subjects = await Subject.find(filter)
      .select('code name credits subjectType semester')
      .sort({ semester: 1, code: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments (unique list from subjects)
// @route   GET /api/subjects/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Subject.distinct('department');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkImportSubjects,
  getSubjectsForExam,
  getDepartments
};
