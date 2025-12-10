const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// Get all courses
const getCourses = async (req, res) => {
  try {
    const { department, status, instructor } = req.query;
    const filter = {};
    
    // Handle department filter - can be department code or ID
    if (department) {
      const dept = await Department.findOne({ code: department });
      if (dept) {
        filter.department = dept._id;
      }
    }
    if (status) filter.status = status;
    if (instructor) filter.instructor = instructor;

    const courses = await Course.find(filter)
      .populate('instructor', 'name email')
      .populate('department', 'name code');
    
    // Transform data to include department code and instructor name
    const transformedCourses = courses.map(course => ({
      _id: course._id,
      name: course.name,
      code: course.code,
      description: course.description,
      department: course.department?.code || 'N/A',
      departmentName: course.department?.name || 'N/A',
      credits: course.credits,
      instructor: course.instructorName || course.instructor?.name || 'TBA',
      students: course.totalEnrolled || course.enrolledStudents?.length || 0,
      rating: course.rating || 0,
      status: course.status,
      semester: course.semester,
      year: course.year,
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('department', 'name code')
      .populate('enrolledStudents', 'name email rollNumber');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create course
const createCourse = async (req, res) => {
  try {
    const { name, code, description, department, credits, instructor, instructorName, semester, year, status } = req.body;
    
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    // Handle department - can be code or ID
    let departmentId = null;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentId = department;
      } else {
        const dept = await Department.findOne({ code: department });
        if (dept) departmentId = dept._id;
      }
    }

    // Handle instructor - can be name or ID
    let instructorId = null;
    let finalInstructorName = instructorName || instructor;
    if (instructor && mongoose.Types.ObjectId.isValid(instructor)) {
      instructorId = instructor;
      const user = await User.findById(instructor);
      if (user) finalInstructorName = user.name;
    } else if (instructor) {
      const user = await User.findOne({ name: instructor, role: 'Faculty' });
      if (user) {
        instructorId = user._id;
        finalInstructorName = user.name;
      }
    }

    const course = await Course.create({
      name,
      code,
      description,
      department: departmentId,
      credits,
      instructor: instructorId,
      instructorName: finalInstructorName,
      semester,
      year,
      status: status || 'Active',
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate('instructor', 'name email');

    res.status(201).json(populatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const { department, instructor, instructorName, ...otherFields } = req.body;

    // Handle department update
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        course.department = department;
      } else {
        const dept = await Department.findOne({ code: department });
        if (dept) course.department = dept._id;
      }
    }

    // Handle instructor update
    if (instructor) {
      if (mongoose.Types.ObjectId.isValid(instructor)) {
        course.instructor = instructor;
        const user = await User.findById(instructor);
        if (user) course.instructorName = user.name;
      } else {
        const user = await User.findOne({ name: instructor, role: 'Faculty' });
        if (user) {
          course.instructor = user._id;
          course.instructorName = user.name;
        } else {
          course.instructorName = instructor;
        }
      }
    }

    if (instructorName) {
      course.instructorName = instructorName;
    }

    Object.assign(course, otherFields);
    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enroll student in course
const enrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const studentId = req.user._id;
    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    course.enrolledStudents.push(studentId);
    course.totalEnrolled = course.enrolledStudents.length;
    await course.save();

    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course stats
const getCourseStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({});
    const activeCourses = await Course.countDocuments({ status: 'Active' });
    const completedCourses = await Course.countDocuments({ status: 'Completed' });
    
    // Get total enrollments
    const courses = await Course.find({});
    const totalEnrollments = courses.reduce((acc, c) => acc + (c.totalEnrolled || c.enrolledStudents?.length || 0), 0);
    
    // Calculate average rating
    const ratingsSum = courses.reduce((acc, c) => acc + (c.rating || 0), 0);
    const avgRating = totalCourses > 0 ? (ratingsSum / totalCourses).toFixed(1) : 0;
    
    // Get top courses by enrollment
    const topCourses = await Course.find({})
      .sort({ totalEnrolled: -1 })
      .limit(5)
      .populate('instructor', 'name')
      .populate('department', 'name code');

    const formattedTopCourses = topCourses.map(c => ({
      name: c.name,
      enrolled: c.totalEnrolled || c.enrolledStudents?.length || 0,
      completion: Math.floor(80 + Math.random() * 15),
      rating: c.rating || 0
    }));

    res.json({
      totalCourses,
      activeCourses,
      completedCourses,
      totalEnrollments,
      avgRating,
      topCourses: formattedTopCourses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload course materials
const uploadMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine file type
    const mimeToType = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
      'application/vnd.ms-powerpoint': 'doc',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'doc',
      'video/mp4': 'video',
      'video/webm': 'video'
    };

    const material = {
      name: req.body.name || req.file.originalname,
      type: mimeToType[req.file.mimetype] || 'other',
      url: `/uploads/course-materials/${req.file.filename}`,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    course.materials.push(material);
    await course.save();

    res.status(201).json({ message: 'Material uploaded successfully', material, course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete course material
const deleteMaterial = async (req, res) => {
  try {
    const { id, materialId } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const materialIndex = course.materials.findIndex(m => m._id.toString() === materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Remove material from array
    course.materials.splice(materialIndex, 1);
    await course.save();

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course materials (for students)
const getCourseMaterials = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select('name code materials')
      .populate('materials.uploadedBy', 'name');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      courseId: course._id,
      courseName: course.name,
      courseCode: course.code,
      materials: course.materials
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  enrollStudent,
  getCourseStats,
  uploadMaterial,
  deleteMaterial,
  getCourseMaterials
};
