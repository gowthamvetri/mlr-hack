const User = require('../models/User');
const Course = require('../models/Course');
const StaffRating = require('../models/StaffRating');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      clubName: user.clubName,
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
  const { name, email, password, role, department, year, rollNumber, clubName, office } = req.body;

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

  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    year,
    rollNumber,
    clubName,
    office
  });

  if (user) {
    if (req.io) {
      req.io.to('role:Admin').emit('user_created', user);
    }
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
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
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.department !== undefined) user.department = req.body.department;
    if (req.body.year !== undefined) user.year = req.body.year;
    if (req.body.rollNumber !== undefined) user.rollNumber = req.body.rollNumber;
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

module.exports = { authUser, registerUser, getUsers, getUserById, deleteUser, getProfile, updateProfile };
