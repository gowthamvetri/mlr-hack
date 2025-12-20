const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');

// @desc    Create a new timetable
// @route   POST /api/timetables
// @access  Private/Staff
const createTimetable = async (req, res) => {
    try {
        const { department, year, semester, section, effectiveFrom, slots } = req.body;

        // Validate required fields
        if (!department || !year) {
            return res.status(400).json({ message: 'Department and year are required' });
        }

        // Check if timetable already exists for this combination
        const existingTimetable = await Timetable.findOne({
            department,
            year,
            section: section || 'A',
            isActive: true
        });

        if (existingTimetable) {
            return res.status(400).json({
                message: `An active timetable already exists for ${department} Year ${year} Section ${section || 'A'}. Please update or deactivate it first.`
            });
        }

        const timetable = new Timetable({
            department,
            year,
            semester,
            section: section || 'A',
            effectiveFrom: effectiveFrom || new Date(),
            createdBy: req.user._id,
            slots: slots || []
        });

        const createdTimetable = await timetable.save();

        const populatedTimetable = await Timetable.findById(createdTimetable._id)
            .populate('createdBy', 'name email')
            .populate('slots.subject', 'name code');

        res.status(201).json(populatedTimetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a timetable
// @route   PUT /api/timetables/:id
// @access  Private/Staff
const updateTimetable = async (req, res) => {
    try {
        const { department, year, semester, section, effectiveFrom, slots, isActive } = req.body;

        const timetable = await Timetable.findById(req.params.id);
        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        // Check if user is the creator or admin
        if (timetable.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to update this timetable' });
        }

        // Update fields
        if (department) timetable.department = department;
        if (year) timetable.year = year;
        if (semester !== undefined) timetable.semester = semester;
        if (section) timetable.section = section;
        if (effectiveFrom) timetable.effectiveFrom = effectiveFrom;
        if (slots) timetable.slots = slots;
        if (isActive !== undefined) timetable.isActive = isActive;

        await timetable.save();

        const updatedTimetable = await Timetable.findById(timetable._id)
            .populate('createdBy', 'name email')
            .populate('slots.subject', 'name code');

        res.json(updatedTimetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a timetable
// @route   DELETE /api/timetables/:id
// @access  Private/Staff
const deleteTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        // Check if user is the creator or admin
        if (timetable.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this timetable' });
        }

        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get timetables with filters
// @route   GET /api/timetables
// @access  Private/Staff/Admin
const getTimetables = async (req, res) => {
    try {
        const { department, year, section, createdBy, isActive } = req.query;

        const filter = {};
        if (department) filter.department = department;
        if (year) filter.year = parseInt(year);
        if (section) filter.section = section;
        if (createdBy) filter.createdBy = createdBy;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        // For staff, optionally show only their created timetables
        if (req.user.role === 'Staff' && !req.query.all) {
            filter.createdBy = req.user._id;
        }

        const timetables = await Timetable.find(filter)
            .populate('createdBy', 'name email department')
            .populate('slots.subject', 'name code')
            .sort({ createdAt: -1 });

        res.json(timetables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get timetable by ID
// @route   GET /api/timetables/:id
// @access  Private
const getTimetableById = async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('slots.subject', 'name code');

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's timetable based on their profile
// @route   GET /api/timetables/my-timetable
// @access  Private/Student
const getMyTimetable = async (req, res) => {
    try {
        const studentDepartment = req.user.department;
        const studentYear = req.user.year;

        if (!studentDepartment) {
            return res.status(400).json({ message: 'Your profile does not have a department set' });
        }

        // Find active timetable matching student's department and year
        const filter = {
            department: studentDepartment,
            isActive: true
        };

        // If student has year set, filter by it
        if (studentYear) {
            filter.year = studentYear;
        }

        const timetable = await Timetable.findOne(filter)
            .populate('createdBy', 'name email')
            .populate('slots.subject', 'name code')
            .sort({ effectiveFrom: -1 }); // Get the most recent one

        if (!timetable) {
            return res.json(null); // No timetable found, but not an error
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get subjects for timetable dropdown (by department)
// @route   GET /api/timetables/subjects
// @access  Private/Staff
const getSubjectsForTimetable = async (req, res) => {
    try {
        const { department, year } = req.query;

        const filter = {};
        if (department) filter.department = department;
        if (year) filter.year = parseInt(year);

        const subjects = await Subject.find(filter)
            .select('name code credits year semester')
            .sort({ year: 1, semester: 1, code: 1 });

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getTimetables,
    getTimetableById,
    getMyTimetable,
    getSubjectsForTimetable
};
