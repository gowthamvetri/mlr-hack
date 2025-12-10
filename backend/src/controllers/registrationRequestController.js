const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Submit a registration request (for SeatingManager or ClubCoordinator)
// @route   POST /api/registration-requests
// @access  Public
const submitRegistrationRequest = async (req, res) => {
  try {
    const { name, email, password, role, clubName } = req.body;

    // Validate role
    if (!['SeatingManager', 'ClubCoordinator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only SeatingManager and ClubCoordinator require approval.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if request already exists
    const requestExists = await RegistrationRequest.findOne({ email });
    if (requestExists) {
      if (requestExists.status === 'pending') {
        return res.status(400).json({ message: 'Registration request already pending approval' });
      } else if (requestExists.status === 'rejected') {
        return res.status(400).json({ message: 'Previous registration request was rejected. Please contact admin.' });
      }
    }

    // Create registration request
    const registrationRequest = await RegistrationRequest.create({
      name,
      email,
      password,
      role,
      clubName: role === 'ClubCoordinator' ? clubName : undefined
    });

    res.status(201).json({
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      requestId: registrationRequest._id,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registration requests
// @route   GET /api/registration-requests
// @access  Private/Admin
const getAllRegistrationRequests = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await RegistrationRequest.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get registration request stats
// @route   GET /api/registration-requests/stats
// @access  Private/Admin
const getRegistrationStats = async (req, res) => {
  try {
    const pending = await RegistrationRequest.countDocuments({ status: 'pending' });
    const approved = await RegistrationRequest.countDocuments({ status: 'approved' });
    const rejected = await RegistrationRequest.countDocuments({ status: 'rejected' });
    
    res.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve registration request and create user
// @route   PUT /api/registration-requests/:id/approve
// @access  Private/Admin
const approveRegistrationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const request = await RegistrationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }
    
    // Check if user with this email was created in the meantime
    const userExists = await User.findOne({ email: request.email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create the user account (password will be hashed by User model)
    const user = await User.create({
      name: request.name,
      email: request.email,
      password: request.password,
      role: request.role,
      clubName: request.clubName
    });
    
    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComment = comment;
    await request.save();
    
    res.json({
      message: 'Registration request approved and user account created',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject registration request
// @route   PUT /api/registration-requests/:id/reject
// @access  Private/Admin
const rejectRegistrationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    
    const request = await RegistrationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }
    
    // Update request status
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComment = comment || 'Request rejected by admin';
    await request.save();
    
    res.json({
      message: 'Registration request rejected',
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check registration request status by email
// @route   GET /api/registration-requests/check/:email
// @access  Public
const checkRequestStatus = async (req, res) => {
  try {
    const { email } = req.params;
    
    const request = await RegistrationRequest.findOne({ email })
      .select('-password')
      .sort({ createdAt: -1 });
    
    if (!request) {
      return res.status(404).json({ message: 'No registration request found for this email' });
    }
    
    res.json({
      status: request.status,
      role: request.role,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      adminComment: request.adminComment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitRegistrationRequest,
  getAllRegistrationRequests,
  getRegistrationStats,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  checkRequestStatus
};
