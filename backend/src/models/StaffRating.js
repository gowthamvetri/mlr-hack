const mongoose = require('mongoose');

const staffRatingSchema = mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
});

// Prevent duplicate ratings (one rating per student per staff per course)
staffRatingSchema.index({ staff: 1, student: 1, course: 1 }, { unique: true });

const StaffRating = mongoose.model('StaffRating', staffRatingSchema);

module.exports = StaffRating;
