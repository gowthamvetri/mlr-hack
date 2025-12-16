const mongoose = require('mongoose');

const invigilatorAssignmentSchema = mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    invigilator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Exam timing for this assignment
    date: { type: Date, required: true },
    session: {
        type: String,
        enum: ['FN', 'AN'],
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['Assigned', 'Confirmed', 'Completed'],
        default: 'Assigned'
    },

    // Assigned by
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Notes
    remarks: { type: String }
}, {
    timestamps: true,
});

// Compound index to prevent duplicate assignments
invigilatorAssignmentSchema.index({ exam: 1, room: 1, date: 1, session: 1 }, { unique: true });
invigilatorAssignmentSchema.index({ invigilator: 1, date: 1, session: 1 });

const InvigilatorAssignment = mongoose.model('InvigilatorAssignment', invigilatorAssignmentSchema);

module.exports = InvigilatorAssignment;
