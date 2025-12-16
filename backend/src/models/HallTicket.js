const mongoose = require('mongoose');

const hallTicketSchema = mongoose.Schema({
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

    // Student details (cached for PDF generation)
    rollNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: Number },
    semester: { type: String },

    // Exam details
    examType: { type: String }, // Internal/Semester
    subjects: [{
        code: { type: String },
        name: { type: String },
        date: { type: Date },
        session: { type: String, enum: ['FN', 'AN'] }
    }],

    // QR Code for verification & attendance
    qrCode: { type: String }, // Base64 encoded QR image
    qrData: { type: String }, // JSON string with verification data

    // Authorization status
    authorized: { type: Boolean, default: false },
    authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorizedAt: { type: Date },

    // Generated PDF path
    pdfPath: { type: String },
    pdfGeneratedAt: { type: Date },

    // Seating info
    roomNumber: { type: String },
    seatNumber: { type: String },
    building: { type: String },

    // Download tracking
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date }
}, {
    timestamps: true,
});

// Compound index for efficient queries
hallTicketSchema.index({ student: 1, exam: 1 }, { unique: true });
hallTicketSchema.index({ exam: 1, authorized: 1 });
hallTicketSchema.index({ rollNumber: 1 });

const HallTicket = mongoose.model('HallTicket', hallTicketSchema);

module.exports = HallTicket;
