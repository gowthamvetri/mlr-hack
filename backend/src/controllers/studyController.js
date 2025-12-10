const StudyProgress = require('../models/StudyProgress');

// @desc    Get progress for a subject
// @route   GET /api/study-progress/:subjectId
// @access  Private/Student
const getProgress = async (req, res) => {
  try {
    let progress = await StudyProgress.findOne({ 
      student: req.user._id, 
      subject: req.params.subjectId 
    });
    
    if (!progress) {
      progress = { completedTopics: [], status: 'Not Started' };
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle topic completion
// @route   POST /api/study-progress/toggle
// @access  Private/Student
const toggleTopic = async (req, res) => {
  try {
    const { subjectId, topicName } = req.body;
    
    let progress = await StudyProgress.findOne({ 
      student: req.user._id, 
      subject: subjectId 
    });

    if (!progress) {
      progress = new StudyProgress({
        student: req.user._id,
        subject: subjectId,
        completedTopics: [topicName],
        status: 'In Progress'
      });
    } else {
      if (progress.completedTopics.includes(topicName)) {
        progress.completedTopics = progress.completedTopics.filter(t => t !== topicName);
      } else {
        progress.completedTopics.push(topicName);
      }
      progress.status = 'In Progress'; // Simplified logic
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProgress, toggleTopic };
