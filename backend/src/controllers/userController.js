const User = require('../models/User');
const Course = require('../models/Course');
const StaffRating = require('../models/StaffRating');
const generateToken = require('../utils/generateToken');

// Helper function to generate roll number in format: xxMLRIDyyzz
// xx = last 2 digits of joining year, yy = department code, zz = sequential number
const generateRollNumber = async (department, joiningYear) => {
  // Get the year code (last 2 digits of joining year, or current year if not provided)
  const year = joiningYear || new Date().getFullYear();
  const yearCode = year.toString().slice(-2);

  // Get department code (uppercase, max 3 chars)
  const deptCode = (department || 'CSE').toUpperCase().slice(0, 3);

  // Count existing students with same year and department to get next sequence
  const existingCount = await User.countDocuments({
    role: 'Student',
    rollNumber: { $regex: `^${yearCode}MLRID${deptCode}` }
  });

  // Generate sequential number (3 digits, zero-padded)
  const sequenceNumber = (existingCount + 1).toString().padStart(3, '0');

  // Format: xxMLRIDyyzz (e.g., 24MLRIDCSE001)
  const rollNumber = `${yearCode}MLRID${deptCode}${sequenceNumber}`;

  // Verify uniqueness (edge case handling)
  const exists = await User.findOne({ rollNumber });
  if (exists) {
    // If somehow exists, add a random suffix
    return `${rollNumber}${Math.random().toString(36).slice(-2).toUpperCase()}`;
  }

  return rollNumber;
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Check if student needs approval
    if (user.role === 'Student' && !user.isApproved) {
      return res.status(403).json({
        message: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
        pendingApproval: true
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      clubName: user.clubName,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new user (Only for Student role - others require approval)
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, department, year, clubName, office } = req.body;

  // Only allow direct registration for Students
  if (role !== 'Student') {
    return res.status(400).json({
      message: 'Direct registration is only available for Students. SeatingManager and ClubCoordinator require admin approval.',
      requiresApproval: true
    });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  // Auto-generate roll number in format: xxMLRIDyyzz
  // xx = year of joining (2 digits), yy = department code, zz = sequential number
  const joiningYear = new Date().getFullYear(); // Use current year as joining year
  const autoRollNumber = await generateRollNumber(department, joiningYear);

  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    year,
    rollNumber: autoRollNumber,
    joiningYear, // Store joining year for reference
    clubName,
    office,
    isApproved: false // Students need approval
  });

  if (user) {
    if (req.io) {
      req.io.to('role:Admin').emit('user_created', user);
      req.io.to('role:Staff').emit('pending_student', user);
    }
    // Don't return token - student needs approval first
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      pendingApproval: true,
      message: 'Registration successful! Your account is pending approval. You will be able to login once an administrator approves your registration.'
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Create any user (Admin only - for Staff, SeatingManager, ClubCoordinator, etc.)
// @route   POST /api/users/admin/create
// @access  Private/Admin
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role, department, year, clubName, office, designation, experience, phone, subjects } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Prepare user data based on role
    const userData = {
      name,
      email,
      password,
      role: role || 'Staff',
      department: department || 'CSE',
      isApproved: true // Admin-created users are pre-approved
    };

    // Add role-specific fields
    if (role === 'Staff') {
      userData.designation = designation || 'Assistant Professor';
      userData.experience = experience;
      userData.phone = phone;
      userData.subjects = subjects || [];
    } else if (role === 'Student') {
      userData.year = year || '1';
      const joiningYear = new Date().getFullYear();
      userData.rollNumber = await generateRollNumber(department, joiningYear);
      userData.joiningYear = joiningYear;
    } else if (role === 'ClubCoordinator') {
      userData.clubName = clubName;
    } else if (role === 'SeatingManager') {
      userData.office = office;
    }

    const user = await User.create(userData);

    if (req.io) {
      req.io.to('role:Admin').emit('user_created', user);
    }

    res.status(201).json({
      message: `${role || 'Staff'} member created successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, department, search } = req.query;

    let query = {};

    // Filter by role if provided
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by department if provided
    if (department && department !== 'all') {
      query.department = department;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');

    // If fetching Staff users, enrich with course count and average rating
    if (role === 'Staff' && users.length > 0) {
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const userObj = user.toObject();

        // Get course count where this user is instructor
        const courseCount = await Course.countDocuments({ instructor: user._id });

        // Get average rating
        const ratingResult = await StaffRating.aggregate([
          { $match: { staff: user._id } },
          { $group: { _id: '$staff', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        userObj.courses = courseCount;
        userObj.rating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : null;
        userObj.ratingCount = ratingResult.length > 0 ? ratingResult[0].count : 0;

        return userObj;
      }));

      return res.json(enrichedUsers);
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: req.params.id });
      if (req.io) {
        req.io.to('role:Admin').emit('user_deleted', req.params.id);
      }
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields - use !== undefined to allow empty strings
    // NOTE: year and department are LOCKED after registration for students
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    // Only allow department/year updates for non-students
    if (user.role !== 'Student') {
      if (req.body.department !== undefined) user.department = req.body.department;
      if (req.body.year !== undefined) user.year = req.body.year;
    }
    if (req.body.rollNumber !== undefined && user.role !== 'Student') user.rollNumber = req.body.rollNumber;
    if (req.body.clubName !== undefined) user.clubName = req.body.clubName;
    if (req.body.office !== undefined) user.office = req.body.office;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.dateOfBirth !== undefined) user.dateOfBirth = req.body.dateOfBirth;
    if (req.body.gender !== undefined) user.gender = req.body.gender;

    // Only update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      year: updatedUser.year,
      rollNumber: updatedUser.rollNumber,
      clubName: updatedUser.clubName,
      office: updatedUser.office,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      address: updatedUser.address,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};

// @desc    Get pending approval students
// @route   GET /api/users/pending
// @access  Private/Admin or Staff
const getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await User.find({
      role: 'Student',
      isApproved: false
    }).select('-password').sort({ createdAt: -1 });
    res.json(pendingStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a student
// @route   PUT /api/users/:id/approve
// @access  Private/Admin or Staff
const approveStudent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'Student') {
      return res.status(400).json({ message: 'Only students can be approved through this endpoint' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'Student is already approved' });
    }

    user.isApproved = true;
    await user.save();

    if (req.io) {
      req.io.to(`user:${user._id}`).emit('account_approved', { message: 'Your account has been approved!' });
    }

    res.json({
      message: 'Student approved successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        rollNumber: user.rollNumber,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject/Delete a pending student
// @route   DELETE /api/users/:id/reject
// @access  Private/Admin or Staff  
const rejectStudent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'Student') {
      return res.status(400).json({ message: 'Only students can be rejected through this endpoint' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'Cannot reject an already approved student. Use delete instead.' });
    }

    await User.deleteOne({ _id: req.params.id });

    res.json({ message: 'Student registration rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import students
// @route   POST /api/users/bulk-import
// @access  Private/Admin
const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of students' });
    }

    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    for (const studentData of students) {
      try {
        const { name, department, year, rollNumber } = studentData;
        let { email } = studentData;

        // Validate required fields - only name is required, email can be auto-generated
        if (!name) {
          results.failed.push({ data: studentData, error: 'Name is required' });
          continue;
        }

        const deptCode = (department || 'CSE').toUpperCase();

        // Auto-generate email if not provided: firstname.lastname.department@mlrit.ac.in
        if (!email) {
          const nameParts = name.toLowerCase().trim().split(/\s+/);
          const firstName = nameParts[0].replace(/[^a-z]/g, '');
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/[^a-z]/g, '') : '';
          const baseEmail = lastName
            ? `${firstName}.${lastName}.${deptCode.toLowerCase()}@mlrit.ac.in`
            : `${firstName}.${deptCode.toLowerCase()}@mlrit.ac.in`;

          // Check if this generated email exists, if so add a number suffix
          let generatedEmail = baseEmail;
          let emailSuffix = 1;
          while (await User.findOne({ email: generatedEmail })) {
            const emailBase = baseEmail.split('@')[0];
            generatedEmail = `${emailBase}${emailSuffix}@mlrit.ac.in`;
            emailSuffix++;
          }
          email = generatedEmail;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.duplicates.push({ email, name });
          continue;
        }

        // Get joining year from data or use current year
        const joiningYear = studentData.joiningYear || new Date().getFullYear();

        // Auto-generate roll number if not provided using new format: xxMLRIDyyzz
        let finalRollNumber = rollNumber;
        if (!finalRollNumber) {
          finalRollNumber = await generateRollNumber(department || 'CSE', joiningYear);
        } else {
          // If roll number provided, verify uniqueness
          const existingRollNumber = await User.findOne({ rollNumber: finalRollNumber });
          if (existingRollNumber) {
            finalRollNumber = await generateRollNumber(department || 'CSE', joiningYear);
          }
        }

        // Create student with custom password or default (email prefix or 'password123')
        const studentPassword = studentData.password || email.split('@')[0].replace(/\./g, '') || 'password123';

        const user = await User.create({
          name,
          email,
          password: studentPassword,
          role: 'Student',
          department: department || 'CSE',
          year: year || '1',
          rollNumber: finalRollNumber,
          joiningYear,
          isApproved: true // Bulk imported students are pre-approved
        });

        results.success.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          rollNumber: user.rollNumber,
          department: user.department,
          year: user.year
        });

      } catch (error) {
        results.failed.push({ data: studentData, error: error.message });
      }
    }

    // Emit socket event for new students
    if (req.io && results.success.length > 0) {
      req.io.to('role:Admin').emit('students_bulk_imported', results.success);
    }

    res.status(201).json({
      message: `Imported ${results.success.length} students successfully`,
      totalProcessed: students.length,
      successful: results.success.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length,
      results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { authUser, registerUser, createUserByAdmin, getUsers, getUserById, deleteUser, getProfile, updateProfile, getPendingStudents, approveStudent, rejectStudent, bulkImportStudents };
