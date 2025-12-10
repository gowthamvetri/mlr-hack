const ClubProfile = require('../models/ClubProfile');
const Event = require('../models/Event');

const getClubProfile = async (req, res) => {
  try {
    // Assuming user is linked to club profile via coordinator ID or we fetch by user's clubName
    // For simplicity, let's find by coordinator ID
    let profile = await ClubProfile.findOne({ coordinator: req.user._id });
    if (!profile) {
        // Try to find by clubName if user has one
        if (req.user.clubName) {
            profile = await ClubProfile.findOne({ clubName: req.user.clubName });
        }
    }
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClubProfile = async (req, res) => {
  const { clubName, category, tagline, description, objectives, facultyInCharge, contactEmail } = req.body;
  try {
    let profile = await ClubProfile.findOne({ coordinator: req.user._id });
    
    if (profile) {
      profile.clubName = clubName || profile.clubName;
      profile.category = category || profile.category;
      profile.tagline = tagline || profile.tagline;
      profile.description = description || profile.description;
      profile.objectives = objectives || profile.objectives;
      profile.facultyInCharge = facultyInCharge || profile.facultyInCharge;
      profile.contactEmail = contactEmail || profile.contactEmail;
      
      const updatedProfile = await profile.save();
      res.json(updatedProfile);
    } else {
      const newProfile = await ClubProfile.create({
        coordinator: req.user._id,
        clubName,
        category,
        tagline,
        description,
        objectives,
        facultyInCharge,
        contactEmail
      });
      res.status(201).json(newProfile);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClubStats = async (req, res) => {
  try {
    // Assuming events have a 'coordinator' field or 'clubName'
    // We'll filter by coordinator for now as per existing logic
    const totalEvents = await Event.countDocuments({ coordinator: req.user._id });
    const pendingEvents = await Event.countDocuments({ coordinator: req.user._id, status: 'Pending' });
    const approvedEvents = await Event.countDocuments({ coordinator: req.user._id, status: 'Approved' });
    const rejectedEvents = await Event.countDocuments({ coordinator: req.user._id, status: 'Rejected' });

    res.json({
      totalEvents,
      pendingEvents,
      approvedEvents,
      rejectedEvents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClubProfile, updateClubProfile, getClubStats };