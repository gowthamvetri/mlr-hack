import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import {
  Users, Search, Save, Check, AlertTriangle,
  RefreshCw, TrendingUp, ArrowUp, ArrowDown, Loader
} from 'lucide-react';
import {
  getStudentsForStaff, updateStudentAttendance,
  bulkUpdateAttendance, getAttendanceSummary
} from '../../utils/api';

// Animated counter
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 500;
    const start = displayValue;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(suffix === '%' ? parseFloat((start + (end - start) * eased).toFixed(1)) : Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

const StaffAttendance = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [editedAttendance, setEditedAttendance] = useState({});
  const [summary, setSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const staffDepartment = user?.department || '';

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => { fetchData(); }, [filterYear, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
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
    setEditedAttendance(prev => ({ ...prev, [studentId]: numValue }));
  };

  const handleSaveAttendance = async (studentId) => {
    if (editedAttendance[studentId] === undefined) return;
    try {
      setSaving(true);
      await updateStudentAttendance(studentId, editedAttendance[studentId]);
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, attendance: editedAttendance[studentId] } : s));
      setEditedAttendance(prev => { const newState = { ...prev }; delete newState[studentId]; return newState; });
      setSuccessMessage('Attendance updated'); setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) { console.error('Error updating attendance:', error); }
    finally { setSaving(false); }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editedAttendance).map(([studentId, attendance]) => ({ studentId, attendance }));
    if (updates.length === 0) return;
    try {
      setSaving(true);
      await bulkUpdateAttendance(updates);
      setStudents(prev => prev.map(s => editedAttendance[s._id] !== undefined ? { ...s, attendance: editedAttendance[s._id] } : s));
      setEditedAttendance({});
      setSuccessMessage(`Updated ${updates.length} students`); setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) { console.error('Error bulk updating:', error); }
    finally { setSaving(false); }
  };

  const filteredStudents = students.filter(student => student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
  const getAttendanceColor = (att) => att >= 75 ? 'text-emerald-600' : att >= 60 ? 'text-amber-600' : 'text-red-600';
  const years = [{ value: '1', label: '1st Year' }, { value: '2', label: '2nd Year' }, { value: '3', label: '3rd Year' }, { value: '4', label: '4th Year' }];

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Attendance Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Update and manage student attendance
              {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">{staffDepartment}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {Object.keys(editedAttendance).length > 0 && (
              <button onClick={handleBulkSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm">
                <Save className="w-4 h-4" /> Save All ({Object.keys(editedAttendance).length})
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2 border border-emerald-100">
            <Check className="w-4 h-4" /> {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: summary.totalStudents, color: 'blue' },
              { label: 'Above 75%', value: summary.aboveThreshold, color: 'emerald' },
              { label: 'Below 75%', value: summary.belowThreshold, color: 'red' },
              { label: 'Average', value: summary.averageAttendance, suffix: '%', color: 'violet' }
            ].map((stat, i) => (
              <div key={i} className={`metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all`}>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className={`text-2xl font-semibold text-${stat.color === 'blue' ? 'zinc-900' : stat.color + '-600'}`}>
                  <AnimatedNumber value={stat.value || 0} suffix={stat.suffix || ''} />
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search by name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
            </div>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
              <option value="all">All Years</option>
              {years.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Roll No</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Year</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Attendance</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-zinc-400 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-zinc-400 text-sm">No students found</td></tr>
                ) : (
                  filteredStudents.map(student => {
                    const att = editedAttendance[student._id] ?? student.attendance ?? 0;
                    return (
                      <tr key={student._id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center text-xs font-semibold text-violet-600">{student.name?.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                              <p className="text-xs text-zinc-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-sm font-mono text-zinc-600">{student.rollNumber || '-'}</td>
                        <td className="py-3 px-5 text-sm text-zinc-600">{student.year || '-'}</td>
                        <td className="py-3 px-5">
                          <input type="number" min="0" max="100" value={att} onChange={(e) => handleAttendanceChange(student._id, e.target.value)} className={`w-16 px-2 py-1 border border-zinc-200 rounded-lg text-sm text-center font-medium ${getAttendanceColor(att)} focus:outline-none focus:ring-2 focus:ring-violet-100`} />
                        </td>
                        <td className="py-3 px-5">
                          {att >= 75 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><ArrowUp className="w-3 h-3" /> Eligible</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100"><ArrowDown className="w-3 h-3" /> Low</span>
                          )}
                        </td>
                        <td className="py-3 px-5">
                          {editedAttendance[student._id] !== undefined && (
                            <button onClick={() => handleSaveAttendance(student._id)} disabled={saving} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors disabled:opacity-50"><Save className="w-4 h-4" /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
