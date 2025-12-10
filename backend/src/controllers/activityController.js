const ActivityLog = require('../models/ActivityLog');

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email');

    // Format time ago
    const formattedActivities = activities.map(activity => {
      const now = new Date();
      const activityTime = new Date(activity.createdAt);
      const diffMs = now - activityTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo;
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return {
        _id: activity._id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        time: timeAgo,
        color: activity.color,
        createdAt: activity.createdAt
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create activity log
const createActivity = async (req, res) => {
  try {
    const { type, title, description, color, relatedEntity, entityType } = req.body;
    
    const activity = await ActivityLog.create({
      type,
      title,
      description,
      user: req.user?._id,
      relatedEntity,
      entityType,
      color: color || 'blue'
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to log activity (for internal use)
const logActivity = async (type, title, description, userId = null, color = 'blue') => {
  try {
    await ActivityLog.create({
      type,
      title,
      description,
      user: userId,
      color
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = {
  getRecentActivities,
  createActivity,
  logActivity
};
