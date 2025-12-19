import { useState, useEffect, useRef, useMemo } from 'react';
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

// Premium Animated Counter - Smooth count-up with easing
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

  return (
    <span className="tabular-nums tracking-tight">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Minimal Progress Ring - Clean, refined circular progress
const ProgressRing = ({ percentage, size = 40, strokeWidth = 3, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-dark-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-dark-300">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton with subtle shimmer
const SkeletonCard = () => (
  <div className="rounded-xl p-5 bg-dark-800/50 border border-dark-700">
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="w-9 h-9 bg-dark-700 rounded-lg" />
        <div className="w-16 h-5 bg-dark-700 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-dark-700 rounded" />
        <div className="h-8 w-14 bg-dark-700 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonStudentCard = () => (
  <div className="rounded-xl p-5 bg-dark-800/50 border border-dark-700">
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-dark-700 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 bg-dark-700 rounded" />
          <div className="h-3 w-36 bg-dark-700 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-dark-700 rounded" />
        <div className="h-3 w-2/3 bg-dark-700 rounded" />
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
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', department: 'CSE', year: '1', role: 'Student'
  });
  const [formError, setFormError] = useState('');

  // Bulk import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Excel import state
  const [excelPreview, setExcelPreview] = useState([]);
  const [uploadMode, setUploadMode] = useState('excel'); // 'excel' or 'json'
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const years = ['all', '1', '2', '3', '4'];

  const { data: departmentsData } = useGetDepartmentsQuery();
  const departments = ['all', ...(departmentsData?.map(d => d.code) || ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'])];

  const queryParams = { role: 'Student' };
  if (filterDept !== 'all') queryParams.department = filterDept;

  const { data: students = [], isLoading: loading, refetch } = useGetUsersQuery(queryParams, {
    refetchOnMountOrArgChange: true
  });

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdate = (data) => {
      if (data && data.role && data.role !== 'Student') return;
      refetch();
    };
    socket.on('user_created', handleUserUpdate);
    socket.on('user_deleted', handleUserUpdate);
    return () => {
      socket.off('user_created', handleUserUpdate);
      socket.off('user_deleted', handleUserUpdate);
    };
  }, [socket, refetch]);

  // Refined GSAP Animations - Subtle and elegant
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

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    // Roll number is now auto-generated on backend, so only check name, email, password
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }
    try {
      await createUser(formData).unwrap();
      dispatch(showSuccessToast('Student added successfully!'));
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', department: 'CSE', year: '1', role: 'Student' });
    } catch (error) {
      setFormError(error?.data?.message || error?.message || 'Error adding student');
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await deleteUser(selectedStudent._id).unwrap();
      dispatch(showSuccessToast('Student deleted successfully'));
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      dispatch(showErrorToast(error?.data?.message || 'Error deleting student'));
    }
  };

  // Student Approval Handlers
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const handleApproveStudent = async (studentId, studentName) => {
    setApprovingId(studentId);
    try {
      await approveStudent(studentId);
      dispatch(showSuccessToast(`${studentName} has been approved!`));
      refetch();
    } catch (error) {
      dispatch(showErrorToast(error?.response?.data?.message || 'Error approving student'));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to reject and remove ${studentName}? This cannot be undone.`)) {
      return;
    }
    setRejectingId(studentId);
    try {
      await rejectStudent(studentId);
      dispatch(showSuccessToast(`${studentName} has been rejected and removed.`));
      refetch();
    } catch (error) {
      dispatch(showErrorToast(error?.response?.data?.message || 'Error rejecting student'));
    } finally {
      setRejectingId(null);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Status', 'Approved'];
    const csvContent = [headers.join(','), ...filteredStudents.map(s =>
      [s.name, s.email, s.rollNumber, s.department, s.year, s.status || 'Active', s.isApproved ? 'Yes' : 'No'].join(',')
    )].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); window.URL.revokeObjectURL(url);
  };

  // Bulk import handler
  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      setBulkResult({ error: 'Please enter student data' });
      return;
    }
    try {
      setBulkLoading(true);
      setBulkResult(null);
      const parsed = JSON.parse(bulkData);
      const studentsArray = Array.isArray(parsed) ? parsed : [parsed];
      const { data } = await bulkImportStudents(studentsArray);
      setBulkResult(data);
      refetch();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setBulkResult({ error: 'Invalid JSON format. Please check your data.' });
      } else {
        setBulkResult({ error: error.response?.data?.message || 'Error importing students' });
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { name: 'John Doe', email: '', department: 'CSE', year: '1', joiningYear: 2024 },
      { name: 'Jane Smith', email: 'jane.custom@gmail.com', department: 'ECE', year: '2', joiningYear: 2023 }
    ];
    // Note in template: email is optional, auto-generated as firstname.lastname.dept@mlrit.ac.in
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'students_template.json';
    a.click();
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const templateData = [
      { Name: 'John Doe', Email: '', Password: '', Department: 'CSE', Year: '1', JoiningYear: 2024 },
      { Name: 'Jane Smith', Email: '', Password: 'jane456', Department: 'ECE', Year: '2', JoiningYear: 2023 },
      { Name: 'Bob Wilson', Email: 'bob.custom@gmail.com', Password: 'bob123', Department: 'MECH', Year: '3', JoiningYear: 2022 }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 35 }, // Email (wider to show auto-generated format)
      { wch: 15 }, // Password
      { wch: 12 }, // Department
      { wch: 8 },  // Year
      { wch: 12 }  // JoiningYear
    ];

    XLSX.writeFile(wb, 'students_template.xlsx');
  };

  // Handle Excel file upload
  const handleExcelUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Normalize column names (handle case variations)
        const normalizedData = jsonData.map(row => {
          const normalized = {};
          Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'name') normalized.name = row[key];
            else if (lowerKey === 'email') normalized.email = row[key];
            else if (lowerKey === 'password' || lowerKey === 'pass') normalized.password = row[key];
            else if (lowerKey === 'department' || lowerKey === 'dept') normalized.department = row[key];
            else if (lowerKey === 'year') normalized.year = String(row[key]);
            else if (lowerKey === 'joiningyear' || lowerKey === 'joining year') normalized.joiningYear = row[key];
          });
          return normalized;
        });

        setExcelPreview(normalizedData);
        setBulkResult(null);
      } catch (error) {
        console.error('Excel parse error:', error);
        setBulkResult({ error: 'Failed to parse Excel file. Please check the format.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExcelUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleExcelUpload(file);
    } else {
      setBulkResult({ error: 'Please upload an Excel file (.xlsx or .xls)' });
    }
  };

  // Import from Excel preview
  const handleExcelImport = async () => {
    if (excelPreview.length === 0) {
      setBulkResult({ error: 'No data to import' });
      return;
    }

    try {
      setBulkLoading(true);
      setBulkResult(null);
      const { data } = await bulkImportStudents(excelPreview);
      setBulkResult(data);
      setExcelPreview([]);
      refetch();
    } catch (error) {
      setBulkResult({ error: error.response?.data?.message || 'Error importing students' });
    } finally {
      setBulkLoading(false);
    }
  };

  // Clear Excel preview
  const clearExcelPreview = () => {
    setExcelPreview([]);
    setBulkResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDept('all');
    setFilterYear('all');
  };

  const hasActiveFilters = searchQuery || filterDept !== 'all' || filterYear !== 'all';

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = filterYear === 'all' || s.year === filterYear;
    return matchesSearch && matchesYear;
  });

  // Calculate stats from real data
  const stats = {
    total: students.length,
    approved: students.filter(s => s.isApproved).length,
    pending: students.filter(s => !s.isApproved).length,
    departments: departments.length - 1,
    // Calculate real average attendance from student data
    avgAttendance: students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length)
      : 0,
    // Calculate students with fees paid
    feesPaid: students.filter(s => s.feesPaid).length,
    // Calculate placed students
    placed: students.filter(s => s.isPlaced).length
  };

  // Year distribution for mini chart
  const yearDistribution = ['1', '2', '3', '4'].map(y => ({
    year: y,
    count: students.filter(s => s.year === y).length
  }));
  const maxYearCount = Math.max(...yearDistribution.map(y => y.count), 1);

  // Department distribution
  const deptDistribution = departments.slice(1).map(d => ({
    name: d,
    count: students.filter(s => s.department === d).length
  })).filter(d => d.count > 0);

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* Premium Header - Clean and confident */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Student Directory</h1>
            <p className="text-dark-400 text-sm mt-0.5">Manage enrolled students across departments</p>
          </div>
          <div className="flex items-center gap-2.5">
            <FilterTriggerButton
              isOpen={filterPanelOpen}
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              activeFiltersCount={(filterDept !== 'all' ? 1 : 0) + (filterYear !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
            />
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-dark-300 glass-card-dark border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Import</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-dark-300 glass-card-dark border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-lg shadow-violet-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Metric Cards - Premium minimal design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Total Students */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-dark-800/80 flex items-center justify-center border border-dark-700">
                    <Users className="w-4.5 h-4.5 text-dark-400" strokeWidth={1.5} />
                  </div>
                  {stats.placed > 0 && (
                    <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">{stats.placed} placed</span>
                  )}
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Students</p>
                <p className="text-2xl font-semibold text-white">
                  <AnimatedNumber value={stats.total} />
                </p>

                {/* Mini bar chart for years */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-end gap-1 h-8">
                    {yearDistribution.map((y) => (
                      <div
                        key={y.year}
                        className="flex-1 bg-violet-500/20 rounded-sm transition-all duration-500 hover:bg-violet-500/40"
                        style={{ height: `${(y.count / maxYearCount) * 100}%`, minHeight: '4px' }}
                        title={`Year ${y.year}: ${y.count}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {yearDistribution.map((y) => (
                      <span key={y.year} className="text-[9px] text-dark-400 flex-1 text-center">Y{y.year}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approved Students */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <GraduationCap className="w-4.5 h-4.5 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0} color="#10b981" />
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Approved Students</p>
                <p className="text-2xl font-semibold text-white">
                  <AnimatedNumber value={stats.approved} />
                </p>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs text-dark-400">Enrolled</span>
                    </div>
                    {stats.pending > 0 && (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">{stats.pending} pending</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Building className="w-4.5 h-4.5 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{deptDistribution.length} active</span>
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Departments</p>
                <p className="text-2xl font-semibold text-white">
                  <AnimatedNumber value={stats.departments} />
                </p>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-1">
                    {deptDistribution.slice(0, 4).map((d) => (
                      <span key={d.name} className="text-[10px] text-dark-400 bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700">
                        {d.name}
                      </span>
                    ))}
                    {deptDistribution.length > 4 && (
                      <span className="text-[10px] text-dark-500">+{deptDistribution.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avg Attendance */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                    <Target className="w-4.5 h-4.5 text-violet-500" strokeWidth={1.5} />
                  </div>
                  {stats.feesPaid > 0 && (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{stats.feesPaid} fees paid</span>
                  )}
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Avg. Attendance</p>
                <p className="text-2xl font-semibold text-white">
                  <AnimatedNumber value={stats.avgAttendance} suffix="%" />
                </p>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="relative h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                      style={{ width: `${stats.avgAttendance}%` }}
                    />
                    {/* Target marker at 85% */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-violet-400/50" style={{ left: '85%' }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-dark-500">0%</span>
                    <span className={`font-medium ${stats.avgAttendance >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {stats.avgAttendance >= 85 ? '✓ Above target' : '↑ Below 85%'}
                    </span>
                    <span className="text-dark-500">100%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Collapsible Premium Filter Panel */}
        <PremiumFilterBar
          isOpen={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}

          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by name, email, roll number..."

          departments={departments}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          deptCounts={deptDistribution.reduce((acc, d) => ({ ...acc, [d.name]: d.count }), {})}

          years={years}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          yearCounts={yearDistribution.reduce((acc, y) => ({ ...acc, [y.year]: y.count }), {})}

          viewMode={viewMode}
          setViewMode={setViewMode}
          showViewToggle={true}

          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}

          filteredCount={filteredStudents.length}
          totalCount={students.length}
        />

        {/* Students Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStudentCard key={i} />)}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length > 0 ? filteredStudents.map((student) => {
              const attendancePercent = ((student.name?.charCodeAt(0) || 65) % 20) + 80;
              const performanceScore = ((student.name?.charCodeAt(1) || 66) % 30) + 70;

              return (
                <div
                  key={student._id}
                  className="student-item group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-500 hover:shadow-lg transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                          <span className="text-white font-medium text-sm">
                            {student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-dark-800" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-sm group-hover:text-violet-400 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-xs text-dark-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                      className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="px-2 py-2 bg-dark-800/50 rounded-lg text-center border border-dark-700">
                      <Hash className="w-3 h-3 mx-auto text-dark-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-mono font-medium text-dark-300 truncate">{student.rollNumber}</p>
                    </div>
                    <div className="px-2 py-2 bg-dark-800/50 rounded-lg text-center border border-dark-700">
                      <BookOpen className="w-3 h-3 mx-auto text-dark-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-medium text-dark-300">{student.department}</p>
                    </div>
                    <div className="px-2 py-2 bg-dark-800/50 rounded-lg text-center border border-dark-700">
                      <Calendar className="w-3 h-3 mx-auto text-dark-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-medium text-dark-300">Year {student.year}</p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-dark-400">Performance</span>
                      <span className={`font-medium ${performanceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {performanceScore}%
                      </span>
                    </div>
                    <div className="h-1 bg-dark-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${performanceScore}%`,
                          background: performanceScore >= 80 ? '#10b981' : '#f59e0b'
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer with Approval Status */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    {/* Approval Status Badge */}
                    {student.isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    <div className="flex items-center gap-0.5">
                      {/* Approve/Reject buttons for pending students */}
                      {!student.isApproved && (
                        <>
                          <button
                            onClick={() => handleApproveStudent(student._id, student.name)}
                            disabled={approvingId === student._id}
                            className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors disabled:opacity-50"
                            title="Approve Student"
                          >
                            {approvingId === student._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectStudent(student._id, student.name)}
                            disabled={rejectingId === student._id}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                            title="Reject Student"
                          >
                            {rejectingId === student._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                      <button className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-md transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                        className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700">
                  <Users className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No students found</h3>
                <p className="text-xs text-dark-400 mb-4">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-700 hover:text-white transition-colors border border-dark-700">
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-white/5">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Roll Number</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Department</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Year</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="student-item group hover:bg-white/5 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center border border-white/10">
                            <span className="text-white font-medium text-xs">{student.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{student.name}</p>
                            <p className="text-xs text-dark-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-xs font-medium text-dark-300 bg-dark-800/50 px-2 py-1 rounded border border-dark-700">{student.rollNumber}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-1 bg-dark-800/50 text-dark-300 rounded text-xs font-medium border border-dark-700">{student.department}</span>
                      </td>
                      <td className="py-3 px-5 text-sm text-dark-400">Year {student.year}</td>
                      <td className="py-3 px-5">
                        {student.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-0.5">
                          {/* Approve/Reject buttons for pending */}
                          {!student.isApproved && (
                            <>
                              <button
                                onClick={() => handleApproveStudent(student._id, student.name)}
                                disabled={approvingId === student._id}
                                className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {approvingId === student._id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectStudent(student._id, student.name)}
                                disabled={rejectingId === student._id}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                {rejectingId === student._id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                          <button className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-md transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                            className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700">
                  <Users className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No students found</h3>
              </div>
            )}
            {filteredStudents.length > 0 && (
              <div className="px-5 py-3 bg-dark-800/80 border-t border-white/5">
                <p className="text-xs text-dark-400">
                  Showing <span className="font-medium text-white">{filteredStudents.length}</span> of <span className="font-medium text-white">{students.length}</span> students
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student" size="md">
          <form onSubmit={handleAddStudent} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm flex items-center gap-2 border border-red-500/20">
                <AlertTriangle className="w-4 h-4" />
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder-dark-500" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder-dark-500" placeholder="student@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Password *</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder-dark-500" placeholder="Min 6 characters" />
            </div>
            <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <div className="flex items-center gap-2 text-violet-300">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-medium">Roll Number Auto-Generated</span>
              </div>
              <p className="text-[10px] text-violet-400 mt-1">Format: 24MLRIDCSE001 (Year + MLRID + Dept + Seq)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  {departments.slice(1).map(d => <option key={d} value={d} className="bg-dark-900">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Year</label>
                <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  <option value="1" className="bg-dark-900">1st Year</option>
                  <option value="2" className="bg-dark-900">2nd Year</option>
                  <option value="3" className="bg-dark-900">3rd Year</option>
                  <option value="4" className="bg-dark-900">4th Year</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-300 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isCreating} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50">
                {isCreating ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal && selectedStudent} onClose={() => setShowDeleteModal(false)} size="sm">
          {selectedStudent && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Student?</h3>
              <p className="text-sm text-dark-400 mb-6">
                Are you sure you want to delete <strong className="text-white">{selectedStudent.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-300 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteStudent} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Bulk Import Modal */}
        <Modal isOpen={showBulkModal} onClose={() => { setShowBulkModal(false); setBulkResult(null); setBulkData(''); setExcelPreview([]); clearExcelPreview(); }} title="Bulk Import Students" size="xl">
          <div className="space-y-5">
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-dark-800 rounded-lg w-fit border border-dark-700">
              <button
                onClick={() => setUploadMode('excel')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'excel' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-white'
                  }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel Upload
              </button>
              <button
                onClick={() => setUploadMode('json')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'json' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-white'
                  }`}
              >
                <Hash className="w-4 h-4" />
                JSON Paste
              </button>
            </div>

            {/* Excel Upload Mode */}
            {uploadMode === 'excel' && (
              <>
                {/* Instructions */}
                <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-violet-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-violet-200 mb-1">Excel File Format</h4>
                      <p className="text-xs text-violet-300">Columns: <span className="font-medium text-white">Name (required), Email (optional), Password (optional), Department, Year, JoiningYear</span></p>
                      <div className="mt-2 text-[10px] text-violet-300 space-y-0.5">
                        <p>📧 <strong>Email:</strong> If empty, auto-generated as <code className="bg-violet-500/20 px-1 rounded text-violet-200">firstname.lastname.dept@mlrit.ac.in</code></p>
                        <p>🔑 <strong>Password:</strong> If empty, uses email prefix without dots</p>
                        <p>🎫 <strong>Roll Number:</strong> Auto-generated as 24MLRIDCSE001</p>
                      </div>
                      <button onClick={downloadExcelTemplate} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-white bg-violet-500/20 hover:bg-violet-500/30 px-2.5 py-1.5 rounded-md transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download Sample Excel Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drag & Drop Upload Zone */}
                {excelPreview.length === 0 && (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragActive
                      ? 'border-violet-500/50 bg-violet-500/10'
                      : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800'
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${dragActive ? 'bg-violet-500/20' : 'bg-dark-700'
                        }`}>
                        <Upload className={`w-6 h-6 ${dragActive ? 'text-violet-400' : 'text-dark-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {dragActive ? 'Drop your Excel file here' : 'Drag & drop Excel file here'}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">or click to browse (.xlsx, .xls)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Excel Preview Table */}
                {excelPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-white">Preview ({excelPreview.length} students)</span>
                      </div>
                      <button
                        onClick={clearExcelPreview}
                        className="text-xs text-dark-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Upload Different File
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-auto border border-dark-700 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-dark-800 sticky top-0 border-b border-dark-700">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">#</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Email</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Password</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Department</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Year</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {excelPreview.slice(0, 50).map((student, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="px-4 py-2.5 text-dark-500 text-xs">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-white">{student.name || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-2.5 text-dark-300">
                                {student.email
                                  ? student.email
                                  : <span className="text-blue-400 italic text-xs">Auto: {student.name ? `${student.name.toLowerCase().split(' ')[0]}.${(student.department || 'cse').toLowerCase()}@mlrit.ac.in` : '...'}</span>
                                }
                              </td>
                              <td className="px-4 py-2.5 text-dark-300">{student.password ? <span className="text-emerald-400">Set</span> : <span className="text-dark-500 italic">Default</span>}</td>
                              <td className="px-4 py-2.5 text-dark-300">{student.department || '-'}</td>
                              <td className="px-4 py-2.5 text-dark-300">{student.year || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {excelPreview.length > 50 && (
                        <div className="p-3 bg-dark-800 text-center text-xs text-dark-400 border-t border-dark-700">
                          Showing first 50 of {excelPreview.length} students
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* JSON Mode */}
            {uploadMode === 'json' && (
              <>
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-200 mb-1">JSON Format</h4>
                      <p className="text-xs text-blue-300">Paste a JSON array with fields: name, email, department, year, joiningYear (optional)</p>
                      <p className="text-[10px] text-blue-300 mt-1">Roll numbers auto-generated as: 24MLRIDCSE001 (Year + MLRID + Dept + Seq)</p>
                      <button onClick={downloadTemplate} className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">Download JSON template</button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5">Student Data (JSON)</label>
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-dark-900 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all placeholder-dark-500"
                    placeholder={`[\n  { "name": "John Doe", "email": "john@example.com", "department": "CSE", "year": "1", "joiningYear": 2024 },\n  { "name": "Jane Smith", "email": "jane@example.com", "department": "ECE", "year": "2" }\n]`}
                  />
                </div>
              </>
            )}

            {/* Result Display */}
            {bulkResult && (
              <div className={`p-4 rounded-xl border ${bulkResult.error ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                {bulkResult.error ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{bulkResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{bulkResult.message}</span>
                    </div>
                    <div className="text-xs text-emerald-300">
                      <p>✓ {bulkResult.successful} imported successfully</p>
                      {bulkResult.duplicates > 0 && <p>⚠ {bulkResult.duplicates} duplicates skipped</p>}
                      {bulkResult.failed > 0 && <p>✗ {bulkResult.failed} failed</p>}
                    </div>
                    <p className="text-[10px] text-emerald-300 mt-2">Note: Default password is the email prefix (before @)</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowBulkModal(false); setBulkResult(null); setBulkData(''); setExcelPreview([]); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-300 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transition-colors"
              >
                Close
              </button>
              {uploadMode === 'excel' ? (
                <button
                  onClick={handleExcelImport}
                  disabled={bulkLoading || excelPreview.length === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                >
                  {bulkLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Import {excelPreview.length} Students</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkData.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                >
                  {bulkLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Import Students</>
                  )}
                </button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
