import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
  Users, Search, Filter, Save, Check, X,
  AlertTriangle, ChevronDown, RefreshCw
} from 'lucide-react';
import {
  getStudentsForStaff, updateStudentAttendance,
  bulkUpdateAttendance, getAttendanceSummary, getDepartments
} from '../../utils/api';

const StaffAttendance = () => {
  const user = useSelector(selectCurrentUser);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [editedAttendance, setEditedAttendance] = useState({});
  const [summary, setSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Staff can only manage students from their department
  const staffDepartment = user?.department || '';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      // Auto-filter by staff's department
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;

      const [studentsRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getAttendanceSummary(params).catch(() => ({ data: {} }))
      ]);

      setStudents(studentsRes.data);
      setSummary(summaryRes.data);
      setEditedAttendance({});
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, value) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    setEditedAttendance(prev => ({
      ...prev,
      [studentId]: numValue
    }));
  };

  const handleSaveAttendance = async (studentId) => {
    if (editedAttendance[studentId] === undefined) return;

    try {
      setSaving(true);
      await updateStudentAttendance(studentId, editedAttendance[studentId]);

      // Update local state
      setStudents(prev => prev.map(s =>
        s._id === studentId ? { ...s, attendance: editedAttendance[studentId] } : s
      ));

      // Remove from edited
      setEditedAttendance(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });

      setSuccessMessage('Attendance updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editedAttendance).map(([studentId, attendance]) => ({
      studentId,
      attendance
    }));

    if (updates.length === 0) return;

    try {
      setSaving(true);
      await bulkUpdateAttendance(updates);

      // Update local state
      setStudents(prev => prev.map(s =>
        editedAttendance[s._id] !== undefined
          ? { ...s, attendance: editedAttendance[s._id] }
          : s
      ));

      setEditedAttendance({});
      setSuccessMessage(`Updated attendance for ${updates.length} students`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error bulk updating attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getAttendanceColor = (attendance) => {
    if (attendance >= 75) return 'text-green-600';
    if (attendance >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const years = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance Management</h1>
            <p className="text-sm sm:text-base text-gray-500">
              Update and manage student attendance
              {staffDepartment && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {staffDepartment} Department
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {Object.keys(editedAttendance).length > 0 && (
              <button
                onClick={handleBulkSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save All ({Object.keys(editedAttendance).length})
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={summary.totalStudents} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Eligible (≥75%)</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={summary.aboveThreshold} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Below Threshold</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1"><AnimatedNumber value={summary.belowThreshold} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Average Attendance</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1"><AnimatedNumber value={summary.averageAttendance} suffix="%" /></p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm sm:text-base"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Student</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Roll Number</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Department</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Year</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Attendance %</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {student.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-gray-700">{student.rollNumber || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {student.department || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700">{student.year || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editedAttendance[student._id] ?? student.attendance ?? 0}
                          onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                          className={`w-20 px-2 py-1 border border-gray-200 rounded text-center font-medium ${getAttendanceColor(editedAttendance[student._id] ?? student.attendance ?? 0)}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        {(editedAttendance[student._id] ?? student.attendance ?? 0) >= 75 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="w-3 h-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {editedAttendance[student._id] !== undefined && (
                          <button
                            onClick={() => handleSaveAttendance(student._id)}
                            disabled={saving}
                            className="text-primary-600 hover:text-primary-700 disabled:opacity-50"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
