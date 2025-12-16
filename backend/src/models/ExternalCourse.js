const mongoose = require('mongoose');

const externalCourseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    provider: {
        type: String,
        enum: ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'],
        default: 'Other'
    },
    url: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'],
        default: 'Other'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedBy: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        completedAt: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

const ExternalCourse = mongoose.model('ExternalCourse', externalCourseSchema);

module.exports = ExternalCourse;
