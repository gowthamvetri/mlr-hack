const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // Fetch notifications for specific user OR broadcast to their role
    // Exclude role-based notifications that this user has already read
    const notifications = await Notification.find({
      $or: [
        // User-specific notifications (not read yet)
        { user: req.user._id, read: false },
        // Role-based notifications (not read by this user)
        { 
          recipientRole: req.user.role, 
          user: null,
          readBy: { $ne: req.user._id } // Not in readBy array
        }
      ]
    }).sort({ createdAt: -1 }).limit(50); // Limit to last 50 notifications
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (notification) {
      // For user-specific notifications
      if (notification.user && notification.user.toString() === req.user._id.toString()) {
        notification.read = true;
        await notification.save();
      } 
      // For role-based notifications - add user to readBy array
      else if (notification.recipientRole === req.user.role) {
        // Check if user already in readBy array
        if (!notification.readBy.includes(req.user._id)) {
          notification.readBy.push(req.user._id);
          await notification.save();
        }
      }
      
      res.json({ message: 'Notification marked as read', notification });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    // Mark user-specific notifications as read
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    // Add user to readBy array for all role-based notifications they haven't read
    await Notification.updateMany(
      { 
        recipientRole: req.user.role, 
        user: null,
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification (user can only delete their own or role-based they've seen)
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // User can delete if it's their notification or if it's a role-based one
    if (
      (notification.user && notification.user.toString() === req.user._id.toString()) ||
      (notification.recipientRole === req.user.role)
    ) {
      // For role-based, just add to readBy so they don't see it anymore
      if (notification.recipientRole && !notification.user) {
        if (!notification.readBy.includes(req.user._id)) {
          notification.readBy.push(req.user._id);
          await notification.save();
        }
        res.json({ message: 'Notification hidden' });
      } else {
        // For user-specific, actually delete
        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
      }
    } else {
      res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getNotifications, 
  markNotificationRead, 
  markAllAsRead, 
  deleteNotification 
};
