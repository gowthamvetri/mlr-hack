import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { useGetUsersQuery, useGetDepartmentsQuery, useDeleteUserMutation, useCreateUserMutation } from '../../services/api';
import { bulkImportStudents, approveStudent, rejectStudent } from '../../utils/api';
import { useAppDispatch } from '../../store';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import {
  Users, Search, UserPlus, Download,
  GraduationCap, Building, Trash2, Edit, Eye, AlertTriangle,
  ArrowUpRight, X, Grid3X3, List, Calendar, Upload,
  Mail, Hash, BookOpen, Target, CheckCircle, MoreHorizontal, FileSpreadsheet, Table, RefreshCw,
  UserCheck, XCircle, Clock
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import PremiumFilterBar, { FilterTriggerButton } from '../../components/PremiumFilterBar';
import gsap from 'gsap';
import * as XLSX from 'xlsx';

// Premium Animated Counter
const AnimatedNumber = ({ value, suffix = '', prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const duration = 600;
    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newVal = start + (end - start) * eased;
      setDisplayValue(suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value, suffix]);

  return <span className="tabular-nums tracking-tight">{prefix}{displayValue}{suffix}</span>;
};

// Minimal Progress Ring
const ProgressRing = ({ percentage, size = 40, strokeWidth = 3, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e4e7" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-zinc-500">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton
const SkeletonCard = () => (
  <div className="rounded-xl p-5 bg-white border border-zinc-200">
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="w-9 h-9 bg-zinc-100 rounded-lg" />
        <div className="w-16 h-5 bg-zinc-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-zinc-100 rounded" />
        <div className="h-8 w-14 bg-zinc-100 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonStudentCard = () => (
  <div className="rounded-xl p-5 bg-white border border-zinc-200">
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-zinc-100 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 bg-zinc-100 rounded" />
          <div className="h-3 w-36 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-100 rounded" />
        <div className="h-3 w-2/3 bg-zinc-100 rounded" />
      </div>
    </div>
  </div>
);

const AdminStudents = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const pageRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', department: 'CSE', year: '1', role: 'Student' });
  const [formError, setFormError] = useState('');

  // Bulk import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Excel import state
  const [excelPreview, setExcelPreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const years = ['all', '1', '2', '3', '4'];
  const { data: departmentsData } = useGetDepartmentsQuery();
  const departments = ['all', ...(departmentsData?.map(d => d.code) || ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'])];
  const queryParams = { role: 'Student' };
  if (filterDept !== 'all') queryParams.department = filterDept;

  const { data: students = [], isLoading: loading, refetch } = useGetUsersQuery(queryParams, { refetchOnMountOrArgChange: true });
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdate = (data) => { if (data?.role && data.role !== 'Student') return; refetch(); };
    socket.on('user_created', handleUserUpdate);
    socket.on('user_deleted', handleUserUpdate);
    return () => { socket.off('user_created', handleUserUpdate); socket.off('user_deleted', handleUserUpdate); };
  }, [socket, refetch]);

  useEffect(() => {
    if (!pageRef.current || loading) return;
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        gsap.fromTo('.filter-bar', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.2, ease: 'power2.out' });
        gsap.fromTo('.student-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.25, ease: 'power2.out' });
      }, pageRef);
      return () => ctx.revert();
    }, 50);
    return () => clearTimeout(timer);
  }, [loading, viewMode]);

  const [createUser] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleAddStudent = async (e) => {
    e.preventDefault(); setFormError('');
    if (!formData.name || !formData.email || !formData.password) { setFormError('Please fill in all required fields'); return; }
    try {
      await createUser(formData).unwrap();
      dispatch(showSuccessToast('Student added successfully!'));
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', department: 'CSE', year: '1', role: 'Student' });
    } catch (error) { setFormError(error?.data?.message || 'Error adding student'); }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await deleteUser(selectedStudent._id).unwrap();
      dispatch(showSuccessToast('Student deleted successfully'));
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) { dispatch(showErrorToast(error?.data?.message || 'Error deleting student')); }
  };

  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const handleApproveStudent = async (studentId, studentName) => {
    setApprovingId(studentId);
    try { await approveStudent(studentId); dispatch(showSuccessToast(`${studentName} has been approved!`)); refetch(); }
    catch (error) { dispatch(showErrorToast(error?.response?.data?.message || 'Error approving student')); }
    finally { setApprovingId(null); }
  };

  const handleRejectStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to reject ${studentName}?`)) return;
    setRejectingId(studentId);
    try { await rejectStudent(studentId); dispatch(showSuccessToast(`${studentName} rejected.`)); refetch(); }
    catch (error) { dispatch(showErrorToast(error?.response?.data?.message || 'Error rejecting student')); }
    finally { setRejectingId(null); }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Status', 'Approved'];
    const csvContent = [headers.join(','), ...filteredStudents.map(s => [s.name, s.email, s.rollNumber, s.department, s.year, s.status || 'Active', s.isApproved ? 'Yes' : 'No'].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `students_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const handleExcelUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const normalizedData = jsonData.map(row => {
          const normalized = {};
          Object.keys(row).forEach(key => {
            const lower = key.toLowerCase();
            if (lower === 'name') normalized.name = row[key];
            else if (lower === 'email') normalized.email = row[key];
            else if (lower.includes('pass')) normalized.password = row[key];
            else if (lower.includes('dept')) normalized.department = row[key];
            else if (lower === 'year') normalized.year = String(row[key]);
            else if (lower.includes('joining')) normalized.joiningYear = row[key];
          });
          return normalized;
        });
        setExcelPreview(normalizedData);
        setBulkResult(null);
      } catch (error) { setBulkResult({ error: 'Failed to parse Excel file.' }); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => { const file = e.target.files?.[0]; if (file) handleExcelUpload(file); };
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file) handleExcelUpload(file); };

  const handleExcelImport = async () => {
    if (excelPreview.length === 0) return;
    try {
      setBulkLoading(true); setBulkResult(null);
      const { data } = await bulkImportStudents(excelPreview);
      setBulkResult(data); setExcelPreview([]); refetch();
    } catch (error) { setBulkResult({ error: error.response?.data?.message || 'Error importing students' }); }
    finally { setBulkLoading(false); }
  };

  const clearFilters = () => { setSearchQuery(''); setFilterDept('all'); setFilterYear('all'); };
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.email?.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = filterYear === 'all' || s.year === filterYear;
    return matchesSearch && matchesYear;
  });

  const stats = {
    total: students.length,
    approved: students.filter(s => s.isApproved).length,
    pending: students.filter(s => !s.isApproved).length,
    departments: departments.length - 1,
    avgAttendance: students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length) : 0,
    feesPaid: students.filter(s => s.feesPaid).length,
    placed: students.filter(s => s.isPlaced).length
  };

  const yearDistribution = ['1', '2', '3', '4'].map(y => ({ year: y, count: students.filter(s => s.year === y).length }));
  const maxYearCount = Math.max(...yearDistribution.map(y => y.count), 1);
  const deptDistribution = departments.slice(1).map(d => ({ name: d, count: students.filter(s => s.department === d).length })).filter(d => d.count > 0);

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto text-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Student Directory</h1>
            <p className="text-zinc-500 text-sm mt-0.5 font-medium">Manage enrolled students across departments</p>
          </div>
          <div className="flex items-center gap-2.5">
            <FilterTriggerButton isOpen={filterPanelOpen} onClick={() => setFilterPanelOpen(!filterPanelOpen)} activeFiltersCount={(filterDept !== 'all' ? 1 : 0) + (filterYear !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)} />
            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-200 shadow-sm">
              <Upload className="w-4 h-4" /><span className="hidden sm:inline">Bulk Import</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-200 shadow-sm">
              <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all duration-200 shadow-sm">
              <UserPlus className="w-4 h-4" /><span>Add Student</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
            <>
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200"><Users className="w-4.5 h-4.5 text-zinc-500" /></div>
                  {stats.placed > 0 && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">{stats.placed} placed</span>}
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Total Students</p>
                <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={stats.total} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="flex items-end gap-1 h-8">
                    {yearDistribution.map(y => <div key={y.year} className="flex-1 bg-violet-100 rounded-sm hover:bg-violet-200" style={{ height: `${(y.count / maxYearCount) * 100}%`, minHeight: '4px' }} title={`Year ${y.year}: ${y.count}`} />)}
                  </div>
                </div>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100"><GraduationCap className="w-4.5 h-4.5 text-emerald-600" /></div>
                  <ProgressRing percentage={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0} color="#10b981" />
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Approved Students</p>
                <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={stats.approved} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Enrolled</span>
                    {stats.pending > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{stats.pending} pending</span>}
                  </div>
                </div>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100"><Building className="w-4.5 h-4.5 text-blue-600" /></div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{deptDistribution.length} active</span>
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Departments</p>
                <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={stats.departments} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="flex flex-wrap gap-1">
                    {deptDistribution.slice(0, 4).map(d => <span key={d.name} className="text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-bold">{d.name}</span>)}
                  </div>
                </div>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100"><Target className="w-4.5 h-4.5 text-violet-600" /></div>
                  {stats.feesPaid > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">{stats.feesPaid} fees paid</span>}
                </div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Avg. Attendance</p>
                <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={stats.avgAttendance} suffix="%" /></p>
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${stats.avgAttendance}%` }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <PremiumFilterBar
          isOpen={filterPanelOpen} onClose={() => setFilterPanelOpen(false)}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchPlaceholder="Search by name, email, roll number..."
          departments={departments} filterDept={filterDept} setFilterDept={setFilterDept} deptCounts={deptDistribution.reduce((acc, d) => ({ ...acc, [d.name]: d.count }), {})}
          years={years} filterYear={filterYear} setFilterYear={setFilterYear} yearCounts={yearDistribution.reduce((acc, y) => ({ ...acc, [y.year]: y.count }), {})}
          viewMode={viewMode} setViewMode={setViewMode} showViewToggle={true} onClearFilters={clearFilters} hasActiveFilters={searchQuery || filterDept !== 'all' || filterYear !== 'all'}
          filteredCount={filteredStudents.length} totalCount={students.length}
        />

        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <SkeletonStudentCard key={i} />)}</div> :
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                const performanceScore = ((student.name?.charCodeAt(1) || 66) % 30) + 70;
                return (
                  <div key={student._id} className="student-item group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center shadow-inner">
                            <span className="text-white font-bold text-sm">{student.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 text-sm group-hover:text-violet-600 transition-colors">{student.name}</h3>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 font-medium"><Mail className="w-3 h-3" /><span className="truncate max-w-[140px]">{student.email}</span></p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center border border-zinc-100">
                        <Hash className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" /><p className="text-[10px] font-mono font-bold text-zinc-600 truncate">{student.rollNumber}</p>
                      </div>
                      <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center border border-zinc-100">
                        <BookOpen className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" /><p className="text-[10px] font-bold text-zinc-600">{student.department}</p>
                      </div>
                      <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center border border-zinc-100">
                        <Calendar className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" /><p className="text-[10px] font-bold text-zinc-600">Year {student.year}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-zinc-500 font-medium">Performance</span>
                        <span className={`font-bold ${performanceScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{performanceScore}%</span>
                      </div>
                      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${performanceScore}%`, background: performanceScore >= 80 ? '#10b981' : '#f59e0b' }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      {student.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle className="w-3 h-3" />Approved</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100"><Clock className="w-3 h-3" />Pending</span>
                      )}
                      <div className="flex items-center gap-0.5">
                        {!student.isApproved && (
                          <>
                            <button onClick={() => handleApproveStudent(student._id, student.name)} disabled={approvingId === student._id} className="p-1.5 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50">
                              {approvingId === student._id ? <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-emerald-200 rounded-full animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleRejectStudent(student._id, student.name)} disabled={rejectingId === student._id} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50">
                              {rejectingId === student._id ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-red-200 rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                        <button className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="col-span-full text-center py-16"><div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400"><Users className="w-7 h-7" /></div><h3 className="text-sm font-bold text-zinc-900">No students found</h3></div>}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-bold text-zinc-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-zinc-500 uppercase tracking-wide">ID/Dept</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-zinc-500 uppercase tracking-wide">Year</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-zinc-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-zinc-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredStudents.map(student => (
                    <tr key={student._id} className="group hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">{student.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{student.name}</p>
                            <p className="text-xs text-zinc-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900">{student.rollNumber}</span>
                          <span className="text-[10px] text-zinc-500">{student.department}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-sm text-zinc-600 font-medium">Year {student.year}</td>
                      <td className="py-3 px-5">{student.isApproved ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span> : <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1">
                          {!student.isApproved && <button onClick={() => handleApproveStudent(student._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><UserCheck className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        {/* Add Student Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student" size="md">
          <form onSubmit={handleAddStudent} className="space-y-4">
            {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100 font-medium"><AlertTriangle className="w-4 h-4" />{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-zinc-500 uppercase">Full Name *</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-medium" /></div>
              <div><label className="text-xs font-bold text-zinc-500 uppercase">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-medium" /></div>
            </div>
            <div><label className="text-xs font-bold text-zinc-500 uppercase">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-medium" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-zinc-500 uppercase">Department</label><select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label className="text-xs font-bold text-zinc-500 uppercase">Year</label><select value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium">{['1', '2', '3', '4'].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-sm font-bold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
              <button type="submit" className="flex-1 py-2 text-sm font-bold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-md">Add Student</button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100"><Trash2 className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-zinc-900">Delete Student?</h3>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Are you sure you want to delete <strong className="text-zinc-900">{selectedStudent?.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-sm font-bold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
              <button onClick={handleDeleteStudent} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md">Delete</button>
            </div>
          </div>
        </Modal>

        {/* Bulk Import Modal */}
        <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Import Students" size="lg">
          <div className="space-y-4">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-violet-500 bg-violet-50' : 'border-zinc-200 hover:border-violet-400 hover:bg-zinc-50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-zinc-900 font-bold">Drag & drop excel file here</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">or click to browse</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">Browse Files</button>
            </div>

            {excelPreview.length > 0 && (
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-zinc-900 text-sm">Preview ({excelPreview.length} students)</h4>
                  <button onClick={() => setExcelPreview([])} className="text-xs text-red-600 hover:underline font-bold">Clear</button>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs border border-zinc-200 rounded bg-white">
                  <table className="w-full">
                    <thead className="bg-zinc-100 text-zinc-500 font-bold"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Dept</th></tr></thead>
                    <tbody>
                      {excelPreview.slice(0, 10).map((s, i) => (<tr key={i} className="border-t border-zinc-100"><td className="p-2 font-medium">{s.name}</td><td className="p-2 text-zinc-500">{s.email}</td><td className="p-2 text-zinc-500">{s.department}</td></tr>))}
                    </tbody>
                  </table>
                  {excelPreview.length > 10 && <div className="p-2 text-center text-zinc-400 italic">...and {excelPreview.length - 10} more</div>}
                </div>
                <button onClick={handleExcelImport} disabled={bulkLoading} className="w-full mt-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-700 shadow-md disabled:opacity-50">{bulkLoading ? 'Importing...' : 'Import Students'}</button>
              </div>
            )}

            {bulkResult && (
              <div className={`p-4 rounded-xl border ${bulkResult.error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                {bulkResult.error ? (
                  <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4" />{bulkResult.error}</div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 font-bold mb-1"><CheckCircle className="w-4 h-4" />Import Successful</div>
                    <p className="text-xs">Added: {bulkResult.added}, Updated: {bulkResult.updated}, Failed: {bulkResult.failed}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
