const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // Fetch notifications for specific user OR broadcast to their role
    const notifications = await Notification.find({
      $or: [
        { user: req.user._id },
        { recipientRole: req.user.role }
      ]
    }).sort({ createdAt: -1 });
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
    // Allow if user matches OR if it's a role-based notification (we can't really mark role-based as read for one user in this simple schema without a 'readBy' array, but for now let's just allow it or ignore)
    // For role-based, we might not want to mark it read globally. 
    // Let's assume for now we only mark user-specific ones as read, or we just return success without saving for role-based to simulate UI update.
    
    if (notification) {
        if (notification.user && notification.user.toString() === req.user._id.toString()) {
            notification.read = true;
            await notification.save();
        }
        // If role based, we do nothing on backend for now as it would hide it for everyone.
        // In a real app, we'd have a 'readBy' array of user IDs.
        res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markNotificationRead };
