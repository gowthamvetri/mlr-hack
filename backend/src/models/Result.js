const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    batchId: {
        type: String,
        required: true, // Logical grouping for uploads (e.g., specific timestamp or generated ID)
        index: true
    },
    studentId: {
        type: String,
        required: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    examType: {
        type: String,
        enum: ['Exam', 'Placement', 'Other'],
        default: 'Placement',
        required: true
    },
    title: {
        type: String,
        required: true // e.g., "Google Placement Drive", "Sem 5 Results"
    },
    score: {
        type: String, // Can be "85/100" or "A" or "Selected"
        required: true
    },
    status: {
        type: String,
        enum: ['Pass', 'Fail', 'Selected', 'Rejected', 'Waitlisted', 'Pending'],
        default: 'Pending'
    },
    remarks: {
        type: String,
        default: ''
    },
    published: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// compound index for lookups
resultSchema.index({ studentId: 1, published: 1 });
resultSchema.index({ batchId: 1 });

module.exports = mongoose.model('Result', resultSchema);
