const mongoose = require('mongoose');

const timetableSlotSchema = mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    startTime: { type: String, required: true }, // e.g., "09:00"
    endTime: { type: String, required: true },   // e.g., "09:50"
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, required: true },
    subjectCode: { type: String },
    faculty: { type: String },
    room: { type: String },
    type: {
        type: String,
        enum: ['Lecture', 'Lab', 'Tutorial', 'Break', 'Free'],
        default: 'Lecture'
    }
});

const timetableSchema = mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        min: 1,
        max: 4,
        required: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 8
    },
    section: {
        type: String,
        default: 'A'
    },
    effectiveFrom: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    slots: [timetableSlotSchema]
}, {
    timestamps: true
});

// Index for efficient queries by department and year
timetableSchema.index({ department: 1, year: 1, section: 1 });
timetableSchema.index({ createdBy: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
