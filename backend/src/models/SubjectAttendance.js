const mongoose = require('mongoose');

/**
 * Subject Attendance Model
 * Tracks class-level attendance per student per subject
 * Auto-updates overall attendance on User model
 */
const subjectAttendanceSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'LATE'],
        default: 'PRESENT'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    period: {
        type: Number,
        min: 1,
        max: 8
    },
    remarks: { type: String }
}, {
    timestamps: true,
});

// Prevent duplicate attendance for same student, subject, date, period
subjectAttendanceSchema.index(
    { student: 1, subject: 1, date: 1, period: 1 },
    { unique: true }
);
subjectAttendanceSchema.index({ student: 1, subject: 1 });
subjectAttendanceSchema.index({ subject: 1, date: 1 });
subjectAttendanceSchema.index({ markedBy: 1 });

/**
 * Calculate and update overall attendance for a student
 * Called after any attendance record is saved/deleted
 */
async function updateOverallAttendance(studentId) {
    const User = mongoose.model('User');
    const SubjectAttendance = mongoose.model('SubjectAttendance');

    try {
        // Get all attendance records for this student
        const totalRecords = await SubjectAttendance.countDocuments({ student: studentId });
        const presentRecords = await SubjectAttendance.countDocuments({
            student: studentId,
            status: { $in: ['PRESENT', 'LATE'] } // LATE counts as present
        });

        // Calculate overall percentage
        const overallPercentage = totalRecords > 0
            ? Math.round((presentRecords / totalRecords) * 100)
            : 0;

        // Update User's attendance field
        await User.findByIdAndUpdate(studentId, { attendance: overallPercentage });

        console.log(`Updated overall attendance for student ${studentId}: ${overallPercentage}%`);
    } catch (error) {
        console.error('Error updating overall attendance:', error);
    }
}

// Post-save hook: Update overall attendance after marking
subjectAttendanceSchema.post('save', async function () {
    await updateOverallAttendance(this.student);
});

// Post-remove hook: Update overall attendance after deletion
subjectAttendanceSchema.post('remove', async function () {
    await updateOverallAttendance(this.student);
});

// Post-deleteOne hook for findOneAndDelete operations
subjectAttendanceSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await updateOverallAttendance(doc.student);
    }
});

/**
 * Static method to get subject-wise attendance summary for a student
 */
subjectAttendanceSchema.statics.getStudentSummary = async function (studentId) {
    const Subject = mongoose.model('Subject');

    const summary = await this.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(studentId) } },
        {
            $group: {
                _id: '$subject',
                totalClasses: { $sum: 1 },
                presentClasses: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0]
                    }
                },
                absentClasses: {
                    $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] }
                },
                lateClasses: {
                    $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'subjects',
                localField: '_id',
                foreignField: '_id',
                as: 'subjectInfo'
            }
        },
        { $unwind: '$subjectInfo' },
        {
            $project: {
                subject: '$subjectInfo',
                totalClasses: 1,
                presentClasses: 1,
                absentClasses: 1,
                lateClasses: 1,
                percentage: {
                    $round: [
                        { $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] },
                        1
                    ]
                }
            }
        },
        {
            $addFields: {
                eligibilityStatus: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$percentage', 75] }, then: 'ELIGIBLE' },
                            { case: { $gte: ['$percentage', 60] }, then: 'WARNING' }
                        ],
                        default: 'NOT_ELIGIBLE'
                    }
                },
                // Calculate classes needed to reach 75%
                classesNeeded: {
                    $cond: {
                        if: { $lt: ['$percentage', 75] },
                        then: {
                            $ceil: {
                                $divide: [
                                    { $subtract: [{ $multiply: [0.75, '$totalClasses'] }, '$presentClasses'] },
                                    0.25
                                ]
                            }
                        },
                        else: 0
                    }
                }
            }
        }
    ]);

    return summary;
};

const SubjectAttendance = mongoose.model('SubjectAttendance', subjectAttendanceSchema);

module.exports = SubjectAttendance;
