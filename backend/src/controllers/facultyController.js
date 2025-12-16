const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Course = require('../models/Course');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// Get all faculty
const getFaculty = async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};

    if (department) {
      // Try to match by department code
      const dept = await Department.findOne({ code: department });
      if (dept) {
        filter.department = dept._id;
      } else {
        filter.departmentName = department;
      }
    }
    if (status) filter.status = status;

    const faculty = await Faculty.find(filter)
      .populate('user', 'name email')
      .populate('department', 'name code')
      .populate('courses', 'name code');

    // Transform to include display-friendly fields
    const transformedFaculty = faculty.map(f => ({
      _id: f._id,
      name: f.name || f.user?.name || 'N/A',
      email: f.email || f.user?.email || 'N/A',
      department: f.departmentName || f.department?.code || 'N/A',
      designation: f.designation || 'Assistant Professor',
      specialization: f.specialization || '',
      experience: f.experience ? `${f.experience} years` : 'N/A',
      courses: f.totalCourses || f.courses?.length || 0,
      rating: f.rating || 0,
      status: f.status || 'Active',
    }));

    res.json(transformedFaculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get faculty by ID
const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email')
      .populate('department', 'name code')
      .populate('courses', 'name code');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create faculty profile
const createFaculty = async (req, res) => {
  try {
    const { userId, name, email, department, departmentName, designation, specialization, experience, phone } = req.body;

    // Handle existing faculty check
    if (userId) {
      const existingFaculty = await Faculty.findOne({ user: userId });
      if (existingFaculty) {
        return res.status(400).json({ message: 'Faculty profile already exists for this user' });
      }
    }

    // Handle department - can be code or ID
    const mongoose = require('mongoose');
    let departmentId = null;
    let finalDepartmentName = departmentName;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentId = department;
        const dept = await Department.findById(department);
        if (dept) finalDepartmentName = dept.name;
      } else {
        const dept = await Department.findOne({ code: department });
        if (dept) {
          departmentId = dept._id;
          finalDepartmentName = dept.name;
        }
      }
    }

    const faculty = await Faculty.create({
      user: userId || null,
      name,
      email,
      department: departmentId,
      departmentName: finalDepartmentName || department,
      designation,
      specialization,
      experience,
      phone,
    });

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('department', 'name code');

    if (req.io) {
      req.io.to('role:Admin').emit('faculty_created', populatedFaculty);
    }

    res.status(201).json(populatedFaculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update faculty
const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const { department, departmentName, ...otherFields } = req.body;
    const mongoose = require('mongoose');

    // Handle department update
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        faculty.department = department;
        const dept = await Department.findById(department);
        if (dept) faculty.departmentName = dept.name;
      } else {
        const dept = await Department.findOne({ code: department });
        if (dept) {
          faculty.department = dept._id;
          faculty.departmentName = dept.name;
        } else {
          faculty.departmentName = department;
        }
      }
    }

    if (departmentName) {
      faculty.departmentName = departmentName;
    }

    Object.assign(faculty, otherFields);
    const updatedFaculty = await faculty.save();
    res.json(updatedFaculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete faculty
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    await faculty.deleteOne();
    if (req.io) {
      req.io.to('role:Admin').emit('faculty_deleted', req.params.id);
    }
    res.json({ message: 'Faculty deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get faculty stats
const getFacultyStats = async (req, res) => {
  try {
    // Count from Faculty model
    let totalFaculty = await Faculty.countDocuments({});
    let activeFaculty = await Faculty.countDocuments({ status: 'Active' });

    // If Faculty model is empty, count Staff users from User model
    if (totalFaculty === 0) {
      totalFaculty = await User.countDocuments({ role: 'Staff' });
      activeFaculty = totalFaculty; // All staff users are considered active
    }

    // Count professors
    const professors = await Faculty.countDocuments({
      designation: { $regex: /professor/i }
    });

    // Calculate avg experience
    const allFaculty = await Faculty.find({});
    const totalExperience = allFaculty.reduce((acc, f) => acc + (f.experience || 0), 0);
    const avgExperience = totalFaculty > 0 ? (totalExperience / totalFaculty).toFixed(1) : 0;

    // Calculate avg rating
    const totalRating = allFaculty.reduce((acc, f) => acc + (f.rating || 0), 0);
    const avgRating = totalFaculty > 0 ? (totalRating / totalFaculty).toFixed(1) : 0;

    // Total courses taught
    const totalCourses = allFaculty.reduce((acc, f) => acc + (f.totalCourses || f.courses?.length || 0), 0);

    // Faculty by department
    const byDepartment = await Faculty.aggregate([
      { $group: { _id: '$departmentName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalFaculty,
      activeFaculty,
      professors,
      avgExperience,
      avgRating,
      totalCourses,
      byDepartment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyStats
};
