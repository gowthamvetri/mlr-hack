const Placement = require('../models/Placement');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// Get all placements
const getPlacements = async (req, res) => {
  try {
    const { status, department, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.departmentNames = department;
    if (type) filter.type = type;

    const placements = await Placement.find(filter)
      .populate('departments', 'name code')
      .populate('selectedStudents', 'name email rollNumber')
      .sort({ driveDate: -1 });
    res.json(placements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get placement by ID
const getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('departments', 'name code')
      .populate('selectedStudents', 'name email rollNumber department year')
      .populate('applicants', 'name email rollNumber');
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }
    res.json(placement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create placement drive
const createPlacement = async (req, res) => {
  try {
    const placementData = { ...req.body };

    // Handle department - accept both ObjectId and department code
    // Handle departments
    if (placementData.departments && Array.isArray(placementData.departments)) {
      const deptIds = [];
      const deptNames = [];

      for (const deptInput of placementData.departments) {
        if (mongoose.Types.ObjectId.isValid(deptInput)) {
          const dept = await Department.findById(deptInput);
          if (dept) {
            deptIds.push(dept._id);
            deptNames.push(dept.name);
          }
        } else {
          const dept = await Department.findOne({ code: deptInput });
          if (dept) {
            deptIds.push(dept._id);
            deptNames.push(dept.name);
          } else {
            deptNames.push(deptInput);
          }
        }
      }
      placementData.departments = deptIds;
      placementData.departmentNames = deptNames;
    }

    const placement = await Placement.create(placementData);

    // Log activity
    await ActivityLog.create({
      type: 'placement',
      title: 'New placement drive added',
      description: `${placement.company} - ${placement.position}`,
      color: 'purple'
    });

    const populatedPlacement = await Placement.findById(placement._id)
      .populate('departments', 'name code')
      .populate('selectedStudents', 'name email');

    // Notify relevant users
    if (req.io) {
      req.io.to('role:Admin').to('role:Student').emit('placement_created', populatedPlacement);
      req.io.to('role:Student').emit('notification', {
        title: 'New Placement Drive',
        message: `${placement.company} is hiring for ${placement.position}`,
        type: 'info'
      });
    }

    res.status(201).json(populatedPlacement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update placement
const updatePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    const updateData = { ...req.body };

    // Handle department update - accept both ObjectId and department code
    // Handle departments update
    if (updateData.departments && Array.isArray(updateData.departments)) {
      const deptIds = [];
      const deptNames = [];

      for (const deptInput of updateData.departments) {
        if (mongoose.Types.ObjectId.isValid(deptInput)) {
          const dept = await Department.findById(deptInput);
          if (dept) {
            deptIds.push(dept._id);
            deptNames.push(dept.name);
          }
        } else {
          const dept = await Department.findOne({ code: deptInput });
          if (dept) {
            deptIds.push(dept._id);
            deptNames.push(dept.name);
          } else {
            deptNames.push(deptInput);
          }
        }
      }
      updateData.departments = deptIds;
      updateData.departmentNames = deptNames;
    }

    Object.assign(placement, updateData);
    const updatedPlacement = await placement.save();

    const populatedPlacement = await Placement.findById(updatedPlacement._id)
      .populate('departments', 'name code')
      .populate('selectedStudents', 'name email');

    // Notify relevant users
    if (req.io) {
      req.io.to('role:Admin').to('role:Student').emit('placement_updated', populatedPlacement);
    }

    res.json(populatedPlacement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete placement
const deletePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }
    await placement.deleteOne();

    // Notify relevant users
    if (req.io) {
      req.io.to('role:Admin').to('role:Student').emit('placement_deleted', { _id: req.params.id });
    }

    res.json({ message: 'Placement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply for placement
const applyForPlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    const studentId = req.user._id;
    if (placement.applicants.includes(studentId)) {
      return res.status(400).json({ message: 'Already applied for this placement' });
    }

    placement.applicants.push(studentId);
    placement.totalApplicants = placement.applicants.length;
    await placement.save();

    res.json({ message: 'Applied successfully', placement });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get placement stats
const getPlacementStats = async (req, res) => {
  try {
    const totalDrives = await Placement.countDocuments({});
    const ongoingDrives = await Placement.countDocuments({ status: 'Ongoing' });
    const upcomingDrives = await Placement.countDocuments({ status: 'Upcoming' });
    const completedDrives = await Placement.countDocuments({ status: 'Completed' });

    // Get all placements to calculate stats
    const allPlacements = await Placement.find({});

    // Calculate package stats
    let highestPackage = 0;
    let totalPackage = 0;
    let packageCount = 0;
    let totalPlaced = 0;

    allPlacements.forEach(p => {
      if (p.package) {
        highestPackage = Math.max(highestPackage, p.package);
        totalPackage += p.package;
        packageCount++;
      }
      totalPlaced += p.totalSelected || 0;
    });

    let averagePackage = packageCount > 0 ? (totalPackage / packageCount).toFixed(1) : 0;

    // Calculate placement rate
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const placementRate = totalStudents > 0 ? Math.min(Math.round((totalPlaced / totalStudents) * 100), 100) : 0;

    // Top recruiters with formatted data
    const topRecruiters = allPlacements
      .filter(p => p.company && p.totalSelected > 0)
      .sort((a, b) => (b.totalSelected || 0) - (a.totalSelected || 0))
      .slice(0, 6)
      .map(p => ({
        name: p.company,
        offers: p.totalSelected || 0,
        avgPackage: p.packageRange || (p.package ? `${p.package} LPA` : 'N/A')
      }));
    res.json({
      totalDrives,
      ongoingDrives,
      upcomingDrives,
      completedDrives,
      totalPlaced: totalPlaced || 0,
      averagePackage: parseFloat(averagePackage) || 0,
      highestPackage: highestPackage || 0,
      companiesVisited: totalDrives || 0,
      placementRate: placementRate || 0,
      topRecruiters
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add selected students to a placement drive (Complete Solution Feature)
const addSelectedStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Please provide an array of student IDs' });
    }

    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    // Update placement with selected students
    placement.selectedStudents = studentIds;
    placement.totalSelected = studentIds.length;
    await placement.save();

    // Update student records - mark them as placed
    await User.updateMany(
      { _id: { $in: studentIds }, role: 'Student' },
      {
        $set: {
          isPlaced: true,
          placedAt: placement._id,
          placementCompany: placement.company,
          placementPackage: placement.package,
          placementPosition: placement.position,
          placementDate: new Date()
        }
      }
    );

    // Log activity
    await ActivityLog.create({
      type: 'placement',
      title: 'Students placed',
      description: `${studentIds.length} students placed at ${placement.company}`,
      color: 'green'
    });

    const populatedPlacement = await Placement.findById(placement._id)
      .populate('selectedStudents', 'name email rollNumber department');

    res.json({
      message: 'Students added successfully',
      placement: populatedPlacement
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get eligible students for placement selection (Complete Solution Feature)
const getEligibleStudents = async (req, res) => {
  try {
    const { department, year, onlyUnplaced } = req.query;
    const filter = { role: 'Student' };

    if (department) filter.department = department;
    if (year) filter.year = year;
    if (onlyUnplaced === 'true') filter.isPlaced = false;

    const students = await User.find(filter)
      .select('name email rollNumber department year isPlaced placementCompany')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlacements,
  getPlacementById,
  createPlacement,
  updatePlacement,
  deletePlacement,
  applyForPlacement,
  getPlacementStats,
  addSelectedStudents,
  getEligibleStudents
};
