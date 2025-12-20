import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import {
  Users, Search, Save, Check, AlertTriangle, Calendar, BookOpen,
  RefreshCw, ArrowUp, ArrowDown, Loader, Clock, CheckCircle, XCircle
} from 'lucide-react';
import {
  getStudentsForStaff, updateStudentAttendance,
  bulkUpdateAttendance, getAttendanceSummary,
  getStaffAttendanceSummary, getSubjectStudentsAttendance, markSubjectAttendance
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
  const [mode, setMode] = useState('class');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const staffDepartment = user?.department || '';

  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectStudents, setSubjectStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [classAttendance, setClassAttendance] = useState({});

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [editedAttendance, setEditedAttendance] = useState({});
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    if (mode === 'class') fetchMySubjects();
    else fetchOverallData();
  }, [mode, filterYear, staffDepartment]);

  useEffect(() => {
    if (selectedSubject) fetchSubjectStudents();
  }, [selectedSubject]);

  const fetchMySubjects = async () => {
    try {
      setLoading(true);
      const { data } = await getStaffAttendanceSummary();
      setMySubjects(data.subjects || []);
      if (data.subjects?.length > 0 && !selectedSubject) setSelectedSubject(data.subjects[0]);
    } catch (error) { console.error('Error fetching subjects:', error); }
    finally { setLoading(false); }
  };

  const fetchSubjectStudents = async () => {
    if (!selectedSubject?._id) return;
    try {
      setLoading(true);
      const { data } = await getSubjectStudentsAttendance(selectedSubject._id);
      setSubjectStudents(data.students || []);
      const initialAttendance = {};
      (data.students || []).forEach(s => { initialAttendance[s._id] = 'PRESENT'; });
      setClassAttendance(initialAttendance);
    } catch (error) { console.error('Error fetching students:', error); }
    finally { setLoading(false); }
  };

  const fetchOverallData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;
      const [studentsRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getAttendanceSummary(params).catch(() => ({ data: {} }))
      ]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setSummary(summaryRes.data);
      setEditedAttendance({});
    } catch (error) { console.error('Error fetching students:', error); }
    finally { setLoading(false); }
  };

  const handleStatusChange = (studentId, status) => setClassAttendance(prev => ({ ...prev, [studentId]: status }));
  const handleMarkAll = (status) => {
    const newAttendance = {};
    subjectStudents.forEach(s => { newAttendance[s._id] = status; });
    setClassAttendance(newAttendance);
  };

  const handleSubmitClassAttendance = async () => {
    if (!selectedSubject?._id) return;
    setSaving(true);
    try {
      const attendanceRecords = Object.entries(classAttendance).map(([studentId, status]) => ({ studentId, status }));
      await markSubjectAttendance({ subjectId: selectedSubject._id, date: attendanceDate, period: selectedPeriod, attendanceRecords });
      setSuccessMessage(`Marked attendance for ${attendanceRecords.length} students!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSubjectStudents();
    } catch (error) { alert(error.response?.data?.message || 'Error saving attendance'); }
    finally { setSaving(false); }
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

  const filteredStudents = Array.isArray(students) ? students.filter(student => student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const getAttendanceColor = (att) => att >= 75 ? 'text-emerald-600' : att >= 60 ? 'text-amber-600' : 'text-red-600';
  const years = [{ value: '1', label: '1st Year' }, { value: '2', label: '2nd Year' }, { value: '3', label: '3rd Year' }, { value: '4', label: '4th Year' }];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const presentCount = Object.values(classAttendance).filter(s => s === 'PRESENT' || s === 'LATE').length;
  const absentCount = Object.values(classAttendance).filter(s => s === 'ABSENT').length;

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Attendance Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Mark class attendance or manage overall percentages
              {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">{staffDepartment}</span>}
            </p>
          </div>
          <button onClick={() => mode === 'class' ? fetchMySubjects() : fetchOverallData()} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex gap-2">
            <button onClick={() => setMode('class')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${mode === 'class' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'}`}>
              <Calendar className="w-4 h-4" /> Mark Today's Class
            </button>
            <button onClick={() => setMode('overall')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${mode === 'overall' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'}`}>
              <Users className="w-4 h-4" /> Edit Overall %
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4" /> {successMessage}
          </div>
        )}

        {/* CLASS MARKING MODE */}
        {mode === 'class' && (
          <>
            {/* Subject & Date Selection */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Subject</label>
                  <select value={selectedSubject?._id || ''} onChange={(e) => setSelectedSubject(mySubjects.find(s => s._id === e.target.value))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    <option value="">Select Subject</option>
                    {mySubjects.map(s => (<option key={s._id} value={s._id}>{s.name} ({s.code})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Date</label>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Period</label>
                  <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                    {periods.map(p => (<option key={p} value={p}>Period {p}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats & Quick Actions */}
            {selectedSubject && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={subjectStudents.length} /></p>
                </div>
                <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Present</p>
                  <p className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={presentCount} /></p>
                </div>
                <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600"><AnimatedNumber value={absentCount} /></p>
                </div>
                <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 flex items-center gap-3">
                  <button onClick={() => handleMarkAll('PRESENT')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all">All Present</button>
                  <button onClick={() => handleMarkAll('ABSENT')} className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">All Absent</button>
                </div>
              </div>
            )}

            {/* Students List for Class Marking */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-zinc-600" />
                  <h3 className="font-bold text-zinc-900">{selectedSubject?.name || 'Select a Subject'}</h3>
                </div>
                <button onClick={handleSubmitClassAttendance} disabled={saving || !selectedSubject || subjectStudents.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white disabled:text-zinc-500 rounded-xl font-medium transition-all">
                  {saving ? (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (<Save className="w-4 h-4" />)}
                  Save Attendance
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Student</th>
                      <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Roll No</th>
                      <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Overall %</th>
                      <th className="text-center py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr><td colSpan="4" className="px-5 py-10 text-center text-zinc-500 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td></tr>
                    ) : !selectedSubject ? (
                      <tr><td colSpan="4" className="px-5 py-10 text-center text-zinc-500 text-sm">Select a subject to mark attendance</td></tr>
                    ) : subjectStudents.length === 0 ? (
                      <tr><td colSpan="4" className="px-5 py-10 text-center text-zinc-500 text-sm">No students found for this subject</td></tr>
                    ) : (
                      subjectStudents.map(student => {
                        const status = classAttendance[student._id] || 'PRESENT';
                        const overallAtt = student.attendance?.percentage || 0;
                        return (
                          <tr key={student._id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white">{student.name?.charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                                  <p className="text-xs text-zinc-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-sm font-mono text-zinc-600">{student.rollNumber || '-'}</td>
                            <td className="py-3 px-5"><span className={`text-sm font-bold ${getAttendanceColor(overallAtt)}`}>{overallAtt}%</span></td>
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleStatusChange(student._id, 'PRESENT')} className={`p-2 rounded-lg transition-all ${status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`} title="Present"><CheckCircle className="w-5 h-5" /></button>
                                <button onClick={() => handleStatusChange(student._id, 'LATE')} className={`p-2 rounded-lg transition-all ${status === 'LATE' ? 'bg-amber-500 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`} title="Late"><Clock className="w-5 h-5" /></button>
                                <button onClick={() => handleStatusChange(student._id, 'ABSENT')} className={`p-2 rounded-lg transition-all ${status === 'ABSENT' ? 'bg-red-500 text-white shadow-lg' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`} title="Absent"><XCircle className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* OVERALL % MODE */}
        {mode === 'overall' && (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: summary.totalStudents, color: 'zinc' },
                  { label: 'Above 75%', value: summary.aboveThreshold, color: 'emerald' },
                  { label: 'Below 75%', value: summary.belowThreshold, color: 'red' },
                  { label: 'Average', value: summary.averageAttendance, suffix: '%', color: 'violet' }
                ].map((stat, i) => (
                  <div key={i} className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color === 'zinc' ? 'zinc-900' : stat.color + '-600'}`}>
                      <AnimatedNumber value={stat.value || 0} suffix={stat.suffix || ''} />
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input type="text" placeholder="Search by name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all" />
                </div>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all">
                  <option value="all">All Years</option>
                  {years.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
                </select>
                {Object.keys(editedAttendance).length > 0 && (
                  <button onClick={handleBulkSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors">
                    <Save className="w-4 h-4" /> Save All ({Object.keys(editedAttendance).length})
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
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
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr><td colSpan="6" className="px-5 py-10 text-center text-zinc-500 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto text-zinc-400" /></td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-10 text-center text-zinc-500 text-sm">No students found</td></tr>
                    ) : (
                      filteredStudents.map(student => {
                        const att = editedAttendance[student._id] ?? student.attendance ?? 0;
                        return (
                          <tr key={student._id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white">{student.name?.charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                                  <p className="text-xs text-zinc-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-sm font-mono text-zinc-600">{student.rollNumber || '-'}</td>
                            <td className="py-3 px-5 text-sm text-zinc-600">{student.year || '-'}</td>
                            <td className="py-3 px-5">
                              <input type="number" min="0" max="100" value={att} onChange={(e) => handleAttendanceChange(student._id, e.target.value)} className={`w-16 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-center font-bold ${getAttendanceColor(att)} focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all`} />
                            </td>
                            <td className="py-3 px-5">
                              {att >= 75 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200"><ArrowUp className="w-3 h-3" /> Eligible</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-50 text-red-600 border border-red-200"><ArrowDown className="w-3 h-3" /> Low</span>
                              )}
                            </td>
                            <td className="py-3 px-5">
                              {editedAttendance[student._id] !== undefined && (
                                <button onClick={() => handleSaveAttendance(student._id)} disabled={saving} className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50 border border-transparent hover:border-zinc-200"><Save className="w-4 h-4" /></button>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
