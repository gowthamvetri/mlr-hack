import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Users, Search, Filter, Save, Check, X, 
  AlertTriangle, ChevronDown, RefreshCw 
} from 'lucide-react';
import { 
  getStudentsForStaff, updateStudentAttendance, 
  bulkUpdateAttendance, getAttendanceSummary, getDepartments 
} from '../../utils/api';

const StaffAttendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [editedAttendance, setEditedAttendance] = useState({});
  const [summary, setSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterDept, filterYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept !== 'all') params.department = filterDept;
      if (filterYear !== 'all') params.year = filterYear;

      const [studentsRes, deptRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getDepartments().catch(() => ({ data: [] })),
        getAttendanceSummary(params).catch(() => ({ data: {} }))
      ]);

      setStudents(studentsRes.data);
      setDepartments(deptRes.data);
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
    if (attendance >= 75) return 'text-green-600 dark:text-green-400';
    if (attendance >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Update and manage student attendance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {Object.keys(editedAttendance).length > 0 && (
              <button
                onClick={handleBulkSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save All ({Object.keys(editedAttendance).length})
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalStudents}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Eligible (≥75%)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.aboveThreshold}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Below Threshold</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.belowThreshold}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Attendance</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.averageAttendance}%</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept.code || dept.name}>{dept.name}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                            {student.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{student.rollNumber || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{student.department || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{student.year || '-'}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editedAttendance[student._id] ?? student.attendance ?? 0}
                          onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                          className={`w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-center ${getAttendanceColor(editedAttendance[student._id] ?? student.attendance ?? 0)}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {(editedAttendance[student._id] ?? student.attendance ?? 0) >= 75 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <Check className="w-3 h-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editedAttendance[student._id] !== undefined && (
                          <button
                            onClick={() => handleSaveAttendance(student._id)}
                            disabled={saving}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
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
