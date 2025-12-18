import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { useGetUsersQuery, useGetDepartmentsQuery, useDeleteUserMutation, useCreateUserMutation } from '../../services/api';
import { useAppDispatch } from '../../store';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import {
  Users, Search, UserPlus, Download,
  GraduationCap, Building, Trash2, Edit, Eye, AlertTriangle,
  ArrowUpRight, X, Grid3X3, List, Calendar,
  Mail, Hash, BookOpen, Target, CheckCircle, MoreHorizontal
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import gsap from 'gsap';

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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-zinc-600">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton with subtle shimmer
const SkeletonCard = () => (
  <div className="rounded-xl p-5 bg-white border border-zinc-100">
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
  <div className="rounded-xl p-5 bg-white border border-zinc-100">
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', department: 'CSE', year: '1', rollNumber: '', role: 'Student'
  });
  const [formError, setFormError] = useState('');

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
    if (!formData.name || !formData.email || !formData.password || !formData.rollNumber) {
      setFormError('Please fill in all required fields');
      return;
    }
    try {
      await createUser(formData).unwrap();
      dispatch(showSuccessToast('Student added successfully!'));
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', department: 'CSE', year: '1', rollNumber: '', role: 'Student' });
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

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Status'];
    const csvContent = [headers.join(','), ...filteredStudents.map(s =>
      [s.name, s.email, s.rollNumber, s.department, s.year, s.status || 'Active'].join(',')
    )].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); window.URL.revokeObjectURL(url);
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

  // Calculate stats
  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'Active' || !s.status).length,
    departments: departments.length - 1,
    avgAttendance: 87
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
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Student Directory</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage enrolled students across departments</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all duration-200 shadow-sm"
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
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5 text-zinc-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>12%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Students</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stats.total} />
                </p>

                {/* Mini bar chart for years */}
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex items-end gap-1 h-8">
                    {yearDistribution.map((y) => (
                      <div
                        key={y.year}
                        className="flex-1 bg-violet-100 rounded-sm transition-all duration-500"
                        style={{ height: `${(y.count / maxYearCount) * 100}%`, minHeight: '4px' }}
                        title={`Year ${y.year}: ${y.count}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {yearDistribution.map((y) => (
                      <span key={y.year} className="text-[9px] text-zinc-400 flex-1 text-center">Y{y.year}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Students */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <GraduationCap className="w-4.5 h-4.5 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0} color="#10b981" />
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Active Students</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stats.active} />
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-zinc-500">All enrolled</span>
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building className="w-4.5 h-4.5 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{deptDistribution.length} active</span>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Departments</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stats.departments} />
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex flex-wrap gap-1">
                    {deptDistribution.slice(0, 4).map((d) => (
                      <span key={d.name} className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {d.name}
                      </span>
                    ))}
                    {deptDistribution.length > 4 && (
                      <span className="text-[10px] text-zinc-400">+{deptDistribution.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avg Attendance */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-violet-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>3%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Avg. Attendance</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stats.avgAttendance} suffix="%" />
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700"
                      style={{ width: `${stats.avgAttendance}%` }}
                    />
                    {/* Target marker at 85% */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-violet-800" style={{ left: '85%' }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-zinc-400">0%</span>
                    <span className={`font-medium ${stats.avgAttendance >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {stats.avgAttendance >= 85 ? '✓ Above target' : '↑ Below 85%'}
                    </span>
                    <span className="text-zinc-400">100%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Bar - Clean and functional */}
        <div className="filter-bar bg-white rounded-xl border border-zinc-100 p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all text-zinc-700 placeholder-zinc-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-200 rounded transition-colors">
                  <X className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-50">
            {/* Department Pills */}
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mr-1">Dept</span>
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDept(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterDept === d
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}

            <div className="w-px h-5 bg-zinc-200 mx-1" />

            {/* Year Pills */}
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mr-1">Year</span>
            {years.map(y => (
              <button
                key={y}
                onClick={() => setFilterYear(y)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center ${filterYear === y
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
              >
                {y === 'all' ? '✦' : y}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full transition-colors ml-auto"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

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
                  className="student-item group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-900 text-sm group-hover:text-violet-600 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center">
                      <Hash className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-mono font-medium text-zinc-700 truncate">{student.rollNumber}</p>
                    </div>
                    <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center">
                      <BookOpen className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-medium text-zinc-700">{student.department}</p>
                    </div>
                    <div className="px-2 py-2 bg-zinc-50 rounded-lg text-center">
                      <Calendar className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={1.5} />
                      <p className="text-[10px] font-medium text-zinc-700">Year {student.year}</p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Performance</span>
                      <span className={`font-medium ${performanceScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {performanceScore}%
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${performanceScore}%`,
                          background: performanceScore >= 80 ? '#10b981' : '#f59e0b'
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${(student.status === 'Active' || !student.status)
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-600'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(student.status === 'Active' || !student.status) ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {student.status || 'Active'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-zinc-700 mb-1">No students found</h3>
                <p className="text-xs text-zinc-500 mb-4">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Roll Number</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Department</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Year</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="student-item group hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">{student.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                            <p className="text-xs text-zinc-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-1 rounded">{student.rollNumber}</span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-medium">{student.department}</span>
                      </td>
                      <td className="py-3 px-5 text-sm text-zinc-600">Year {student.year}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${(student.status === 'Active' || !student.status) ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                          <span className={`w-1 h-1 rounded-full ${(student.status === 'Active' || !student.status) ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-0.5">
                          <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-zinc-700 mb-1">No students found</h3>
              </div>
            )}
            {filteredStudents.length > 0 && (
              <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">
                  Showing <span className="font-medium text-zinc-700">{filteredStudents.length}</span> of <span className="font-medium text-zinc-700">{students.length}</span> students
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student" size="md">
          <form onSubmit={handleAddStudent} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" placeholder="student@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password *</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Roll Number *</label>
              <input type="text" value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" placeholder="e.g., 20CS101" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                  {departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Year</label>
                <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isCreating} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {isCreating ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal && selectedStudent} onClose={() => setShowDeleteModal(false)} size="sm">
          {selectedStudent && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Delete Student?</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Are you sure you want to delete <strong className="text-zinc-700">{selectedStudent.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteStudent} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
