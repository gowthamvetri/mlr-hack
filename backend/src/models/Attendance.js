const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    hallTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HallTicket'
    },

    // Attendance details
    markedAt: { type: Date, default: Date.now },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, // Faculty who marked attendance

    method: {
        type: String,
        enum: ['QR', 'MANUAL'],
        default: 'QR'
    },

    // For specific exam sessions
    examDate: { type: Date },
    examSession: { type: String, enum: ['FN', 'AN'] },
    subjectCode: { type: String },

    // Verification status
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'LATE'],
        default: 'PRESENT'
    },

    // Location verification
    roomNumber: { type: String },
    seatNumber: { type: String },

    // Notes
    remarks: { type: String }
}, {
    timestamps: true,
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ student: 1, exam: 1, examDate: 1, subjectCode: 1 }, { unique: true });
attendanceSchema.index({ exam: 1, examDate: 1 });
attendanceSchema.index({ markedBy: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
