const ExternalCourse = require('../models/ExternalCourse');

// @desc    Get all external courses
// @route   GET /api/external-courses
// @access  Private (All authenticated users)
const getExternalCourses = async (req, res) => {
    try {
        const { category, provider, department } = req.query;
        let query = { isActive: true };

        if (category && category !== 'all') query.category = category;
        if (provider && provider !== 'all') query.provider = provider;
        if (department && department !== 'all') query.department = department;

        const courses = await ExternalCourse.find(query)
            .populate('postedBy', 'name email')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching external courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create external course
// @route   POST /api/external-courses
// @access  Private (Admin, Staff)
const createExternalCourse = async (req, res) => {
    try {
        const { title, description, provider, url, category, department } = req.body;

        if (!title || !url) {
            return res.status(400).json({ message: 'Title and URL are required' });
        }

        const course = await ExternalCourse.create({
            title,
            description,
            provider: provider || 'Other',
            url,
            category: category || 'Other',
            department: department || null,
            postedBy: req.user._id
        });

        const populated = await course.populate([
            { path: 'postedBy', select: 'name email' },
            { path: 'department', select: 'name code' }
        ]);

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating external course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update external course
// @route   PUT /api/external-courses/:id
// @access  Private (Admin, or Staff who created)
const updateExternalCourse = async (req, res) => {
    try {
        const course = await ExternalCourse.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization: Admin can edit any, Staff can only edit their own
        if (req.user.role !== 'admin' && course.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this course' });
        }

        const { title, description, provider, url, category, department, isActive } = req.body;

        course.title = title || course.title;
        course.description = description !== undefined ? description : course.description;
        course.provider = provider || course.provider;
        course.url = url || course.url;
        course.category = category || course.category;
        course.department = department !== undefined ? department : course.department;
        course.isActive = isActive !== undefined ? isActive : course.isActive;

        await course.save();

        const populated = await course.populate([
            { path: 'postedBy', select: 'name email' },
            { path: 'department', select: 'name code' }
        ]);

        res.json(populated);
    } catch (error) {
        console.error('Error updating external course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete external course
// @route   DELETE /api/external-courses/:id
// @access  Private (Admin, or Staff who created)
const deleteExternalCourse = async (req, res) => {
    try {
        const course = await ExternalCourse.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization
        if (req.user.role !== 'admin' && course.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();
        res.json({ message: 'Course removed' });
    } catch (error) {
        console.error('Error deleting external course:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark external course as completed by student
// @route   POST /api/external-courses/:id/complete
// @access  Private (Student)
const markAsCompleted = async (req, res) => {
    try {
        const course = await ExternalCourse.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already completed
        const alreadyCompleted = course.completedBy.find(
            c => c.student.toString() === req.user._id.toString()
        );

        if (alreadyCompleted) {
            return res.status(400).json({ message: 'Already marked as completed' });
        }

        course.completedBy.push({
            student: req.user._id,
            completedAt: new Date()
        });

        await course.save();
        res.json({ message: 'Course marked as completed' });
    } catch (error) {
        console.error('Error marking course as completed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my completed courses (for students)
// @route   GET /api/external-courses/my-completed
// @access  Private (Student)
const getMyCompletedCourses = async (req, res) => {
    try {
        const courses = await ExternalCourse.find({
            'completedBy.student': req.user._id
        }).populate('postedBy', 'name').populate('department', 'name code');

        res.json(courses);
    } catch (error) {
        console.error('Error fetching completed courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getExternalCourses,
    createExternalCourse,
    updateExternalCourse,
    deleteExternalCourse,
    markAsCompleted,
    getMyCompletedCourses
};
