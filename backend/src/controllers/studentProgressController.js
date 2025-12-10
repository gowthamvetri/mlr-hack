const StudentStreak = require('../models/StudentStreak');
const StudentSkill = require('../models/StudentSkill');
const CareerProgress = require('../models/CareerProgress');

// Get student streak
const getStreak = async (req, res) => {
  try {
    let streak = await StudentStreak.findOne({ student: req.user._id });
    
    if (!streak) {
      // Create default streak for new students
      streak = await StudentStreak.create({
        student: req.user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
      });
    }

    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update streak (called when student completes activity)
const updateStreak = async (req, res) => {
  try {
    let streak = await StudentStreak.findOne({ student: req.user._id });
    
    if (!streak) {
      streak = await StudentStreak.create({
        student: req.user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        totalActiveDays: 1,
      });
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Already updated today
        return res.json(streak);
      } else if (diffDays === 1) {
        // Consecutive day
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      } else {
        // Streak broken
        streak.currentStreak = 1;
      }
      
      streak.lastActivityDate = new Date();
      streak.totalActiveDays += 1;
      streak.streakHistory.push({ date: new Date(), activities: 1 });
      
      await streak.save();
    }

    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student skills
const getSkills = async (req, res) => {
  try {
    let skills = await StudentSkill.findOne({ student: req.user._id });
    
    if (!skills) {
      // Create default skills for new students
      skills = await StudentSkill.create({
        student: req.user._id,
        skills: [
          { name: 'JavaScript', level: 50, trend: '+0%', category: 'Technical' },
          { name: 'Python', level: 40, trend: '+0%', category: 'Technical' },
          { name: 'React', level: 30, trend: '+0%', category: 'Technical' },
          { name: 'Communication', level: 60, trend: '+0%', category: 'Soft Skills' },
        ],
        totalSkills: 4,
        skillsGainedThisMonth: 0,
      });
    }

    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const { skillName, level, trend } = req.body;
    
    let skills = await StudentSkill.findOne({ student: req.user._id });
    
    if (!skills) {
      skills = await StudentSkill.create({
        student: req.user._id,
        skills: [{ name: skillName, level, trend: trend || '+0%', category: 'Technical' }],
        totalSkills: 1,
        skillsGainedThisMonth: 1,
      });
    } else {
      const existingSkillIndex = skills.skills.findIndex(s => s.name === skillName);
      
      if (existingSkillIndex >= 0) {
        const oldLevel = skills.skills[existingSkillIndex].level;
        const newTrend = level > oldLevel ? `+${level - oldLevel}%` : `${level - oldLevel}%`;
        skills.skills[existingSkillIndex].level = level;
        skills.skills[existingSkillIndex].trend = newTrend;
        skills.skills[existingSkillIndex].lastUpdated = new Date();
      } else {
        skills.skills.push({ 
          name: skillName, 
          level, 
          trend: '+' + level + '%', 
          category: 'Technical',
          lastUpdated: new Date()
        });
        skills.totalSkills += 1;
        skills.skillsGainedThisMonth += 1;
      }
      
      await skills.save();
    }

    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get career progress
const getCareerProgress = async (req, res) => {
  try {
    let progress = await CareerProgress.findOne({ student: req.user._id });
    
    if (!progress) {
      // Create default career progress for new students
      progress = await CareerProgress.create({
        student: req.user._id,
        profileScore: 30,
        careerReadiness: 20,
        roadmap: [
          { step: 1, title: 'Complete Profile', progress: 30, completed: false },
          { step: 2, title: 'Skill Assessment', progress: 0, completed: false },
          { step: 3, title: 'Resume Building', progress: 0, completed: false },
          { step: 4, title: 'Interview Preparation', progress: 0, completed: false },
          { step: 5, title: 'Job Applications', progress: 0, completed: false },
        ],
        activeGoals: 1,
        exploredCareers: { current: 0, total: 6 },
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update career progress
const updateCareerProgress = async (req, res) => {
  try {
    let progress = await CareerProgress.findOne({ student: req.user._id });
    
    if (!progress) {
      progress = await CareerProgress.create({
        student: req.user._id,
        profileScore: 30,
        careerReadiness: 20,
        roadmap: [
          { step: 1, title: 'Complete Profile', progress: 30, completed: false, tasks: [] },
          { step: 2, title: 'Skill Assessment', progress: 0, completed: false, tasks: [] },
          { step: 3, title: 'Resume Building', progress: 0, completed: false, tasks: [] },
          { step: 4, title: 'Interview Preparation', progress: 0, completed: false, tasks: [] },
          { step: 5, title: 'Job Applications', progress: 0, completed: false, tasks: [] },
        ],
        activeGoals: 1,
        exploredCareers: { current: 0, total: 6 },
      });
    }

    const { step, stepProgress, profileScore, careerReadiness, exploredCareers, taskId, taskCompleted, goals } = req.body;
    
    if (step !== undefined && stepProgress !== undefined) {
      const roadmapStep = progress.roadmap.find(r => r.step === step);
      if (roadmapStep) {
        roadmapStep.progress = stepProgress;
        roadmapStep.completed = stepProgress >= 100;
      }
    }
    
    // Handle task completion within a step
    if (step !== undefined && taskId !== undefined && taskCompleted !== undefined) {
      const roadmapStep = progress.roadmap.find(r => r.step === step);
      if (roadmapStep) {
        if (!roadmapStep.tasks) roadmapStep.tasks = [];
        const taskIndex = roadmapStep.tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          roadmapStep.tasks[taskIndex].completed = taskCompleted;
        } else {
          roadmapStep.tasks.push({ id: taskId, completed: taskCompleted });
        }
      }
    }
    
    // Handle goals update
    if (goals !== undefined) {
      progress.goals = goals;
    }
    
    if (profileScore !== undefined) progress.profileScore = profileScore;
    if (careerReadiness !== undefined) progress.careerReadiness = careerReadiness;
    if (exploredCareers !== undefined) progress.exploredCareers = exploredCareers;
    
    // Recalculate active goals
    progress.activeGoals = progress.roadmap.filter(r => r.progress > 0 && !r.completed).length;
    
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all streaks for admin (aggregated stats)
const getAllStreaks = async (req, res) => {
  try {
    const activeStreaks = await StudentStreak.countDocuments({ currentStreak: { $gt: 0 } });
    const avgStreak = await StudentStreak.aggregate([
      { $group: { _id: null, avg: { $avg: '$currentStreak' } } }
    ]);
    
    const topStreaks = await StudentStreak.find({})
      .sort({ currentStreak: -1 })
      .limit(10)
      .populate('student', 'name email department');

    res.json({
      activeStreaks,
      avgStreak: Math.round(avgStreak[0]?.avg || 0),
      topStreaks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStreak,
  updateStreak,
  getSkills,
  updateSkill,
  getCareerProgress,
  updateCareerProgress,
  getAllStreaks
};
