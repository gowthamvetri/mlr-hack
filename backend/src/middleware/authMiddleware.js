const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// Staff middleware - allows Staff role access
const staff = (req, res, next) => {
  if (req.user && req.user.role === 'Staff') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as staff' });
  }
};

// Admin or Staff middleware - allows both Admin and Staff roles
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Staff')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin or staff' });
  }
};

// Authorize middleware - allows specific roles access
  const authorize = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `User role ${req.user.role} is not authorized to access this route`
        });
      }
      next();
    };
  };

  module.exports = { protect, admin, staff, adminOrStaff, authorize };
