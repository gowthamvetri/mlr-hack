const PlacementSlide = require('../models/PlacementSlide');
const Recruiter = require('../models/Recruiter');
const TrainingContent = require('../models/TrainingContent');

// ============= PLACEMENT SLIDES =============

// Get all active slides (public)
const getPlacementSlides = async (req, res) => {
  try {
    const slides = await PlacementSlide.find({ isActive: true }).sort('order');
    res.json(slides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all slides (admin)
const getAllPlacementSlides = async (req, res) => {
  try {
    const slides = await PlacementSlide.find({}).sort('order');
    res.json(slides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create slide
const createPlacementSlide = async (req, res) => {
  try {
    const slide = await PlacementSlide.create(req.body);
    res.status(201).json(slide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update slide
const updatePlacementSlide = async (req, res) => {
  try {
    const slide = await PlacementSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    Object.assign(slide, req.body);
    await slide.save();
    res.json(slide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete slide
const deletePlacementSlide = async (req, res) => {
  try {
    const slide = await PlacementSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }
    await slide.deleteOne();
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= RECRUITERS =============

// Get all active recruiters (public)
const getRecruiters = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    
    const recruiters = await Recruiter.find(filter).sort('order');
    res.json(recruiters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all recruiters (admin)
const getAllRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({}).sort('order');
    res.json(recruiters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create recruiter
const createRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.create(req.body);
    res.status(201).json(recruiter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update recruiter
const updateRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    Object.assign(recruiter, req.body);
    await recruiter.save();
    res.json(recruiter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete recruiter
const deleteRecruiter = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    await recruiter.deleteOne();
    res.json({ message: 'Recruiter deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============= TRAINING CONTENT =============

// Get all active training content (public)
const getTrainingContent = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    
    const content = await TrainingContent.find(filter).sort('order');
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all training content (admin)
const getAllTrainingContent = async (req, res) => {
  try {
    const content = await TrainingContent.find({}).sort('order');
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create training content
const createTrainingContent = async (req, res) => {
  try {
    const content = await TrainingContent.create(req.body);
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update training content
const updateTrainingContent = async (req, res) => {
  try {
    const content = await TrainingContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Training content not found' });
    }
    Object.assign(content, req.body);
    await content.save();
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete training content
const deleteTrainingContent = async (req, res) => {
  try {
    const content = await TrainingContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Training content not found' });
    }
    await content.deleteOne();
    res.json({ message: 'Training content deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlacementSlides,
  getAllPlacementSlides,
  createPlacementSlide,
  updatePlacementSlide,
  deletePlacementSlide,
  getRecruiters,
  getAllRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  getTrainingContent,
  getAllTrainingContent,
  createTrainingContent,
  updateTrainingContent,
  deleteTrainingContent,
};
