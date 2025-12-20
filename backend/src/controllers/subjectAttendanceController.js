/**
 * Subject Attendance Controller
 * Handles class-level attendance marking and retrieval
 */

const SubjectAttendance = require('../models/SubjectAttendance');
const Subject = require('../models/Subject');
const User = require('../models/User');

/**
 * @desc    Mark attendance for a class session
 * @route   POST /api/subject-attendance/mark
 * @access  Private/Staff
 */
const markAttendance = async (req, res) => {
    try {
        const { subjectId, date, period, attendanceRecords } = req.body;
        // attendanceRecords: [{ studentId, status, remarks }]

        if (!subjectId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
            return res.status(400).json({ message: 'Subject ID and attendance records are required' });
        }

        // Verify staff is assigned to this subject
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const isAssigned = subject.assignedStaff?.some(
            staffId => staffId.toString() === req.user._id.toString()
        );
        if (!isAssigned && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized for this subject' });
        }

        const results = [];
        const errors = [];

        for (const record of attendanceRecords) {
            try {
                const attendanceData = {
                    student: record.studentId,
                    subject: subjectId,
                    date: date || new Date(),
                    period: period || 1,
                    status: record.status || 'PRESENT',
                    markedBy: req.user._id,
                    remarks: record.remarks
                };

                // Upsert: update if exists, create if not
                const attendance = await SubjectAttendance.findOneAndUpdate(
                    {
                        student: record.studentId,
                        subject: subjectId,
                        date: new Date(date || Date.now()).toDateString(),
                        period: period || 1
                    },
                    attendanceData,
                    { upsert: true, new: true, runValidators: true }
                );

                results.push(attendance);
            } catch (err) {
                errors.push({ studentId: record.studentId, error: err.message });
            }
        }

        res.json({
            message: `Marked attendance for ${results.length} students`,
            success: results.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get attendance for a subject on a specific date
 * @route   GET /api/subject-attendance/subject/:subjectId
 * @access  Private/Staff
 */
const getSubjectAttendance = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { date, period } = req.query;

        const query = { subject: subjectId };
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }
        if (period) query.period = period;

        const attendance = await SubjectAttendance.find(query)
            .populate('student', 'name email rollNumber year')
            .populate('markedBy', 'name')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        console.error('Error fetching subject attendance:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get student's own attendance (all subjects)
 * @route   GET /api/subject-attendance/my-attendance
 * @access  Private/Student
 */
const getMySubjectAttendance = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Get subject-wise summary with eligibility status
        const summary = await SubjectAttendance.getStudentSummary(studentId);

        // Calculate overall stats
        const totalClasses = summary.reduce((sum, s) => sum + s.totalClasses, 0);
        const totalPresent = summary.reduce((sum, s) => sum + s.presentClasses, 0);
        const overallPercentage = totalClasses > 0
            ? Math.round((totalPresent / totalClasses) * 100)
            : 0;

        const shortageSubjects = summary.filter(s => s.percentage < 75).length;
        const eligibleSubjects = summary.filter(s => s.percentage >= 75).length;

        res.json({
            overall: {
                percentage: overallPercentage,
                totalClasses,
                totalPresent,
                totalAbsent: totalClasses - totalPresent
            },
            stats: {
                totalSubjects: summary.length,
                eligibleSubjects,
                shortageSubjects,
                isOverallEligible: overallPercentage >= 75
            },
            subjects: summary
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get detailed attendance history for a specific subject
 * @route   GET /api/subject-attendance/my-attendance/:subjectId
 * @access  Private/Student
 */
const getMySubjectHistory = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const studentId = req.user._id;

        const records = await SubjectAttendance.find({
            student: studentId,
            subject: subjectId
        })
            .populate('subject', 'name code')
            .sort({ date: -1 });

        const totalClasses = records.length;
        const presentClasses = records.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length;
        const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

        res.json({
            subject: records[0]?.subject,
            percentage,
            totalClasses,
            presentClasses,
            absentClasses: totalClasses - presentClasses,
            eligibilityStatus: percentage >= 75 ? 'ELIGIBLE' : percentage >= 60 ? 'WARNING' : 'NOT_ELIGIBLE',
            records
        });
    } catch (error) {
        console.error('Error fetching subject history:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get students for a subject with attendance summary (Staff view)
 * @route   GET /api/subject-attendance/subject/:subjectId/students
 * @access  Private/Staff
 */
const getSubjectStudents = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get all students in this subject's department and year
        const students = await User.find({
            role: 'Student',
            department: subject.department,
            year: subject.year
        }).select('name email rollNumber year');

        // Get attendance stats for each student
        const studentsWithAttendance = await Promise.all(
            students.map(async (student) => {
                const totalClasses = await SubjectAttendance.countDocuments({
                    subject: subjectId,
                    student: student._id
                });
                const presentClasses = await SubjectAttendance.countDocuments({
                    subject: subjectId,
                    student: student._id,
                    status: { $in: ['PRESENT', 'LATE'] }
                });
                const percentage = totalClasses > 0
                    ? Math.round((presentClasses / totalClasses) * 100)
                    : 0;

                return {
                    ...student.toObject(),
                    attendance: {
                        totalClasses,
                        presentClasses,
                        percentage,
                        eligibilityStatus: percentage >= 75 ? 'ELIGIBLE' : percentage >= 60 ? 'WARNING' : 'NOT_ELIGIBLE'
                    }
                };
            })
        );

        res.json({
            subject: { _id: subject._id, name: subject.name, code: subject.code },
            students: studentsWithAttendance
        });
    } catch (error) {
        console.error('Error fetching subject students:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get attendance summary for staff dashboard
 * @route   GET /api/subject-attendance/staff-summary
 * @access  Private/Staff
 */
const getStaffAttendanceSummary = async (req, res) => {
    try {
        // Get subjects assigned to this staff
        const subjects = await Subject.find({
            assignedStaff: req.user._id
        }).select('name code department year semester');

        const subjectsWithStats = await Promise.all(
            subjects.map(async (subject) => {
                const students = await User.countDocuments({
                    role: 'Student',
                    department: subject.department,
                    year: subject.year
                });

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const todayAttendance = await SubjectAttendance.countDocuments({
                    subject: subject._id,
                    date: { $gte: todayStart, $lte: todayEnd }
                });

                const avgAttendance = await SubjectAttendance.aggregate([
                    { $match: { subject: subject._id } },
                    {
                        $group: {
                            _id: '$student',
                            present: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] } },
                            total: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avgPercentage: { $avg: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } }
                        }
                    }
                ]);

                return {
                    ...subject.toObject(),
                    totalStudents: students,
                    markedToday: todayAttendance > 0,
                    averageAttendance: Math.round(avgAttendance[0]?.avgPercentage || 0)
                };
            })
        );

        res.json({
            totalSubjects: subjects.length,
            subjects: subjectsWithStats
        });
    } catch (error) {
        console.error('Error fetching staff summary:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    markAttendance,
    getSubjectAttendance,
    getMySubjectAttendance,
    getMySubjectHistory,
    getSubjectStudents,
    getStaffAttendanceSummary
};
