const User = require('../models/User');

// @desc    Get all students for attendance/fee management
// @route   GET /api/staff/students
// @access  Private/Staff or Admin
const getStudents = async (req, res) => {
  try {
    const { department, year, search } = req.query;

    const query = { role: 'Student' };

    // For Staff users, auto-filter by their department unless they're Admin
    if (req.user.role === 'Staff' && !department) {
      // Staff can only see students from their own department
      query.department = req.user.department;
    } else if (department) {
      // If department is explicitly provided, use it (for filtering within allowed scope)
      // Staff can still only filter within their own department
      if (req.user.role === 'Staff' && department !== req.user.department) {
        return res.status(403).json({ message: 'You can only view students from your own department' });
      }
      query.department = department;
    }

    if (year) query.year = year;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('name email rollNumber department year attendance feesPaid feeDetails semester batch isApproved createdAt')
      .sort({ department: 1, year: 1, rollNumber: 1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student details
// @route   GET /api/staff/students/:id
// @access  Private/Staff
const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password');

    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student attendance
// @route   PUT /api/staff/students/:id/attendance
// @access  Private/Staff
const updateAttendance = async (req, res) => {
  try {
    const { attendance } = req.body;

    if (attendance < 0 || attendance > 100) {
      return res.status(400).json({ message: 'Attendance must be between 0 and 100' });
    }

    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.attendance = attendance;
    await student.save();

    res.json({
      message: 'Attendance updated successfully',
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        attendance: student.attendance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update attendance for multiple students
// @route   PUT /api/staff/students/bulk-attendance
// @access  Private/Staff
const bulkUpdateAttendance = async (req, res) => {
  try {
    const { updates } = req.body; // [{ studentId, attendance }, ...]

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    const results = await Promise.all(updates.map(async ({ studentId, attendance }) => {
      try {
        if (attendance < 0 || attendance > 100) {
          return { studentId, success: false, error: 'Invalid attendance value' };
        }

        const student = await User.findByIdAndUpdate(
          studentId,
          { attendance },
          { new: true }
        ).select('name rollNumber attendance');

        if (!student) {
          return { studentId, success: false, error: 'Student not found' };
        }

        return { studentId, success: true, student };
      } catch (error) {
        return { studentId, success: false, error: error.message };
      }
    }));

    const successCount = results.filter(r => r.success).length;

    res.json({
      message: `Updated attendance for ${successCount} of ${updates.length} students`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student fee status
// @route   PUT /api/staff/students/:id/fees
// @access  Private/Staff
const updateFeeStatus = async (req, res) => {
  try {
    const { feesPaid, feeDetails } = req.body;

    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (typeof feesPaid === 'boolean') {
      student.feesPaid = feesPaid;
    }

    if (feeDetails) {
      student.feeDetails = {
        ...student.feeDetails,
        ...feeDetails
      };

      // Auto-set feesPaid based on dueAmount
      if (feeDetails.dueAmount === 0) {
        student.feesPaid = true;
      }
    }

    await student.save();

    res.json({
      message: 'Fee status updated successfully',
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        feesPaid: student.feesPaid,
        feeDetails: student.feeDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance summary/statistics
// @route   GET /api/staff/attendance-summary
// @access  Private/Staff
const getAttendanceSummary = async (req, res) => {
  try {
    const { department, year } = req.query;

    const query = { role: 'Student' };
    if (department) query.department = department;
    if (year) query.year = year;

    const students = await User.find(query).select('attendance department year');

    const totalStudents = students.length;
    const aboveThreshold = students.filter(s => s.attendance >= 75).length;
    const belowThreshold = students.filter(s => s.attendance < 75).length;
    const averageAttendance = totalStudents > 0
      ? students.reduce((sum, s) => sum + (s.attendance || 0), 0) / totalStudents
      : 0;

    // Group by department
    const byDepartment = students.reduce((acc, s) => {
      const dept = s.department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { count: 0, totalAttendance: 0 };
      }
      acc[dept].count++;
      acc[dept].totalAttendance += s.attendance || 0;
      return acc;
    }, {});

    const departmentSummary = Object.entries(byDepartment).map(([dept, data]) => ({
      department: dept,
      studentCount: data.count,
      averageAttendance: (data.totalAttendance / data.count).toFixed(2)
    }));

    res.json({
      totalStudents,
      aboveThreshold,
      belowThreshold,
      eligibilityRate: ((aboveThreshold / totalStudents) * 100).toFixed(2),
      averageAttendance: averageAttendance.toFixed(2),
      departmentSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fee summary/statistics
// @route   GET /api/staff/fee-summary
// @access  Private/Staff
const getFeeSummary = async (req, res) => {
  try {
    const { department, year } = req.query;

    const query = { role: 'Student' };
    if (department) query.department = department;
    if (year) query.year = year;

    const students = await User.find(query).select('feesPaid feeDetails department year');

    const totalStudents = students.length;
    const feesPaidCount = students.filter(s => s.feesPaid).length;
    const feesPendingCount = students.filter(s => !s.feesPaid).length;

    const totalDue = students.reduce((sum, s) => sum + (s.feeDetails?.dueAmount || 0), 0);
    const totalPaid = students.reduce((sum, s) => sum + (s.feeDetails?.paidAmount || 0), 0);

    res.json({
      totalStudents,
      feesPaidCount,
      feesPendingCount,
      clearanceRate: ((feesPaidCount / totalStudents) * 100).toFixed(2),
      totalAmountDue: totalDue,
      totalAmountPaid: totalPaid
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students with eligibility issues (for hall ticket)
// @route   GET /api/staff/ineligible-students
// @access  Private/Staff
const getIneligibleStudents = async (req, res) => {
  try {
    const { department, year } = req.query;

    const query = {
      role: 'Student',
      $or: [
        { attendance: { $lt: 75 } },
        { feesPaid: { $ne: true } }
      ]
    };

    if (department) query.department = department;
    if (year) query.year = year;

    const students = await User.find(query)
      .select('name email rollNumber department year attendance feesPaid feeDetails')
      .sort({ department: 1, rollNumber: 1 });

    const studentsWithIssues = students.map(s => ({
      ...s.toObject(),
      issues: [
        ...(s.attendance < 75 ? [`Low attendance: ${s.attendance}%`] : []),
        ...(!s.feesPaid ? ['Fees not cleared'] : [])
      ]
    }));

    res.json({
      count: studentsWithIssues.length,
      students: studentsWithIssues
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateAttendance,
  bulkUpdateAttendance,
  updateFeeStatus,
  getAttendanceSummary,
  getFeeSummary,
  getIneligibleStudents
};
