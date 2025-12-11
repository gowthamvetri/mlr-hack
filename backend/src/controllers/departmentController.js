const Department = require('../models/Department');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

// Get all departments (public)
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).populate('headOfDepartment', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all departments for public page (minimal data)
const getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .select('name code slug image description totalStudents totalFaculty')
      .sort('name');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department by slug (public)
const getDepartmentBySlug = async (req, res) => {
  try {
    const department = await Department.findOne({ slug: req.params.slug })
      .populate('headOfDepartment', 'name email profileImage');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Get faculty for this department
    const faculty = await Faculty.find({ department: department._id })
      .select('name designation email phone profileImage specialization');
    
    res.json({ ...department.toObject(), faculty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('headOfDepartment', 'name email');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, headOfDepartment } = req.body;
    
    const existingDept = await Department.findOne({ $or: [{ name }, { code }] });
    if (existingDept) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    // Count students and faculty for this department
    const totalStudents = await User.countDocuments({ role: 'Student', department: name });

    const department = await Department.create({
      name,
      code,
      description,
      headOfDepartment,
      totalStudents,
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    Object.assign(department, req.body);
    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    await department.deleteOne();
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department stats for admin dashboard
const getDepartmentStats = async (req, res) => {
  try {
    const departments = await Department.find({});
    
    // Get student count per department
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await User.countDocuments({ role: 'Student', department: dept.name });
        return {
          name: dept.name,
          code: dept.code,
          count: studentCount,
        };
      })
    );

    // Calculate total and percentages
    const totalStudents = deptStats.reduce((sum, d) => sum + d.count, 0);
    const statsWithPercentage = deptStats.map(d => ({
      ...d,
      percentage: totalStudents > 0 ? Math.round((d.count / totalStudents) * 100) : 0
    }));

    // Sort by count descending
    statsWithPercentage.sort((a, b) => b.count - a.count);

    res.json(statsWithPercentage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getDepartments, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentStats,
  getPublicDepartments,
  getDepartmentBySlug
};
