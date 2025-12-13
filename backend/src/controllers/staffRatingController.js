const StaffRating = require('../models/StaffRating');
const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');

// Submit a rating for a staff member
const submitRating = async (req, res) => {
    try {
        const { staffId, courseId, rating, comment } = req.body;
        const studentId = req.user._id;

        // Validate rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Get the course
        const course = await Course.findById(courseId).populate('department');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Verify staff is the instructor of this course
        if (course.instructor?.toString() !== staffId) {
            return res.status(403).json({ message: 'Staff is not the instructor for this course' });
        }

        // Verify student is enrolled in this course
        const isEnrolled = course.enrolledStudents?.some(
            s => s.toString() === studentId.toString()
        );
        if (!isEnrolled) {
            return res.status(403).json({ message: 'You must be enrolled in this course to rate the instructor' });
        }

        // Verify student and course are in same department
        const student = await User.findById(studentId);
        const courseDeptCode = course.department?.code;
        if (student.department !== courseDeptCode) {
            return res.status(403).json({ message: 'You can only rate instructors from your department courses' });
        }

        // Create or update rating
        const existingRating = await StaffRating.findOne({
            staff: staffId,
            student: studentId,
            course: courseId
        });

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.comment = comment;
            await existingRating.save();
            res.json({ message: 'Rating updated successfully', rating: existingRating });
        } else {
            const newRating = await StaffRating.create({
                staff: staffId,
                student: studentId,
                course: courseId,
                rating,
                comment
            });
            res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already rated this instructor for this course' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get all ratings for a staff member
const getStaffRatings = async (req, res) => {
    try {
        const { staffId } = req.params;

        const ratings = await StaffRating.find({ staff: staffId })
            .populate('student', 'name')
            .populate('course', 'name code')
            .sort({ createdAt: -1 });

        // Calculate average
        const avgRating = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : null;

        res.json({
            ratings,
            averageRating: avgRating,
            totalRatings: ratings.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if student can rate a staff member for a course
const canRateStaff = async (req, res) => {
    try {
        const { staffId, courseId } = req.params;
        const studentId = req.user._id;

        const course = await Course.findById(courseId).populate('department');
        if (!course) {
            return res.json({ canRate: false, reason: 'Course not found' });
        }

        // Check if staff is instructor
        if (course.instructor?.toString() !== staffId) {
            return res.json({ canRate: false, reason: 'Staff is not the instructor' });
        }

        // Check if student is enrolled
        const isEnrolled = course.enrolledStudents?.some(
            s => s.toString() === studentId.toString()
        );
        if (!isEnrolled) {
            return res.json({ canRate: false, reason: 'Not enrolled in course' });
        }

        // Check department match
        const student = await User.findById(studentId);
        if (student.department !== course.department?.code) {
            return res.json({ canRate: false, reason: 'Department mismatch' });
        }

        // Check if already rated
        const existingRating = await StaffRating.findOne({
            staff: staffId,
            student: studentId,
            course: courseId
        });

        res.json({
            canRate: true,
            hasRated: !!existingRating,
            existingRating: existingRating?.rating
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get average rating for a staff member (for admin view)
const getStaffAverageRating = async (req, res) => {
    try {
        const { staffId } = req.params;

        const result = await StaffRating.aggregate([
            { $match: { staff: require('mongoose').Types.ObjectId(staffId) } },
            { $group: { _id: '$staff', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        if (result.length === 0) {
            return res.json({ averageRating: null, totalRatings: 0 });
        }

        res.json({
            averageRating: result[0].avgRating.toFixed(1),
            totalRatings: result[0].count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitRating,
    getStaffRatings,
    canRateStaff,
    getStaffAverageRating
};
