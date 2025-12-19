const Subject = require('../models/Subject');
const User = require('../models/User');
const { extractText } = require('../services/textExtractionService');
const { generateMindMapFromText } = require('../services/mindMapService');
const path = require('path');

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

    const subjects = await Subject.find(filter)
      .populate('assignedStaff', 'name email department')
      .sort({ year: 1, semester: 1, code: 1 });
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
    const subject = await Subject.findById(req.params.id)
      .populate('assignedStaff', 'name email department')
      .populate('materials.uploadedBy', 'name');
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
    const { code, name, department, year, semester, credits, subjectType, assignedStaff } = req.body;

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
      subjectType: subjectType || 'HEAVY',
      assignedStaff: assignedStaff || []
    });

    const createdSubject = await subject.save();

    // Populate and return
    const populatedSubject = await Subject.findById(createdSubject._id)
      .populate('assignedStaff', 'name email department');

    res.status(201).json(populatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
  try {
    const { code, name, department, year, semester, credits, subjectType, assignedStaff } = req.body;

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

    // Update assigned staff (replace entire array)
    if (assignedStaff !== undefined) {
      subject.assignedStaff = assignedStaff;
    }

    await subject.save();

    // Populate and return
    const updatedSubject = await Subject.findById(subject._id)
      .populate('assignedStaff', 'name email department');

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

// @desc    Get subjects assigned to logged-in staff
// @route   GET /api/subjects/my-subjects
// @access  Private/Staff
const getMySubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ assignedStaff: req.user._id })
      .populate('assignedStaff', 'name email')
      .populate('materials.uploadedBy', 'name')
      .sort({ year: 1, semester: 1, code: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add material to a subject
// @route   POST /api/subjects/:id/materials
// @access  Private/Staff (must be assigned to subject)
const addMaterial = async (req, res) => {
  try {
    const { title, description, type, url } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is assigned to this subject (or is admin)
    const isAssigned = subject.assignedStaff.some(staffId =>
      staffId.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    // Add material
    subject.materials.push({
      title,
      description,
      type,
      url,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await subject.save();

    const updatedSubject = await Subject.findById(subject._id)
      .populate('materials.uploadedBy', 'name');

    res.status(201).json(updatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete material from a subject
// @route   DELETE /api/subjects/:id/materials/:materialId
// @access  Private/Staff (must be assigned)
const deleteMaterial = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is assigned or is admin
    const isAssigned = subject.assignedStaff.some(staffId =>
      staffId.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    // Remove material
    subject.materials = subject.materials.filter(
      m => m._id.toString() !== req.params.materialId
    );

    await subject.save();
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload material file to a subject
// @route   POST /api/subjects/:id/materials/upload
// @access  Private/Staff (must be assigned)
const uploadMaterial = async (req, res) => {
  try {
    const { title, description, type } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is assigned to this subject (or is admin)
    const isAssigned = subject.assignedStaff.some(staffId =>
      staffId.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    // Get file URL path
    const fileUrl = `/uploads/subject-materials/${req.file.filename}`;

    // Add material with file URL
    subject.materials.push({
      title: title || req.file.originalname,
      description: description || '',
      type: type || 'PDF',
      url: fileUrl,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    });

    await subject.save();

    const updatedSubject = await Subject.findById(subject._id)
      .populate('materials.uploadedBy', 'name');

    // Return the newly added material
    const newMaterial = updatedSubject.materials[updatedSubject.materials.length - 1];
    res.status(201).json({ material: newMaterial, subject: updatedSubject });
  } catch (error) {
    res.status(400).json({ message: error.message });
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

// @desc    Get staff list for assignment (Staff users)
// @route   GET /api/subjects/staff-list
// @access  Private/Admin
const getStaffList = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { role: 'Staff' };
    if (department) filter.department = department;

    const staff = await User.find(filter)
      .select('name email department')
      .sort({ name: 1 });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Map material type to mime type for text extraction
const getMimeType = (type) => {
  const map = {
    'PDF': 'application/pdf',
    'Document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[type] || 'application/pdf';
};

// @desc    Generate mind map from a subject material (PDF)
// @route   POST /api/subjects/:id/materials/:materialId/generate-mindmap
// @access  Private/Staff (must be assigned)
const generateMaterialMindMap = async (req, res) => {
  try {
    const { id, materialId } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is assigned
    const isAssigned = subject.assignedStaff.some(staffId =>
      staffId.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    const material = subject.materials.id(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (material.type !== 'PDF' && material.type !== 'Document') {
      return res.status(400).json({ message: 'Mind map can only be generated from PDF or Document files' });
    }

    // Construct file path from URL
    let filePath = material.url;
    if (filePath.startsWith('/')) filePath = filePath.substring(1);
    const absolutePath = path.join(__dirname, '../../', filePath);

    // Extract text from file
    const text = await extractText(absolutePath, getMimeType(material.type));

    // Generate mind map using AI
    const markdown = await generateMindMapFromText(text);

    res.json({ markdown, materialId: material._id });
  } catch (error) {
    console.error('Mind Map Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save mind map to a subject material
// @route   PUT /api/subjects/:id/materials/:materialId/save-mindmap
// @access  Private/Staff (must be assigned)
const saveMaterialMindMap = async (req, res) => {
  try {
    const { id, materialId } = req.params;
    const { markdown } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if user is assigned
    const isAssigned = subject.assignedStaff.some(staffId =>
      staffId.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    const material = subject.materials.id(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Save mind map and mark as approved
    material.mindMap = markdown;
    material.isApproved = true;
    await subject.save();

    res.json({ message: 'Mind map saved and approved', material });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subjects for student (based on department and year)
// @route   GET /api/subjects/student-subjects
// @access  Private/Student
const getSubjectsForStudent = async (req, res) => {
  try {
    // Get student's department and year
    const studentDepartment = req.user.department;
    const studentYear = req.user.year;

    const filter = { department: studentDepartment };
    if (studentYear) filter.year = studentYear;

    // Find subjects matching student's department and year with approved materials
    const subjects = await Subject.find(filter)
      .populate('assignedStaff', 'name email')
      .populate('materials.uploadedBy', 'name')
      .sort({ year: 1, semester: 1, code: 1 });

    // Filter to only include approved materials for students
    const subjectsWithApprovedMaterials = subjects.map(subject => {
      const subjectObj = subject.toObject();
      subjectObj.materials = subjectObj.materials.filter(m => m.isApproved === true);
      return subjectObj;
    });

    // Only return subjects that have at least one approved material
    const subjectsWithMaterials = subjectsWithApprovedMaterials.filter(s => s.materials.length > 0);

    res.json(subjectsWithMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get materials for a specific subject
// @route   GET /api/subjects/:id/materials
// @access  Private
const getSubjectMaterials = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('assignedStaff', 'name email')
      .populate('materials.uploadedBy', 'name');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const isStaffOrAdmin = ['Admin', 'Staff'].includes(req.user.role);
    const isAssignedStaff = subject.assignedStaff.some(s => s._id.toString() === req.user._id.toString());

    let materials = subject.materials;

    // For students, only return approved materials from their department
    if (!isStaffOrAdmin && !isAssignedStaff) {
      // Check if student belongs to the same department
      if (req.user.department !== subject.department) {
        return res.status(403).json({ message: 'You can only access subjects from your department' });
      }
      // Filter to only approved materials
      materials = subject.materials.filter(m => m.isApproved === true);
    }

    res.json({
      subjectId: subject._id,
      subjectName: subject.name,
      subjectCode: subject.code,
      department: subject.department,
      year: subject.year,
      semester: subject.semester,
      materials: materials
    });
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
  getDepartments,
  getMySubjects,
  addMaterial,
  uploadMaterial,
  deleteMaterial,
  getStaffList,
  generateMaterialMindMap,
  saveMaterialMindMap,
  getSubjectsForStudent,
  getSubjectMaterials
};
