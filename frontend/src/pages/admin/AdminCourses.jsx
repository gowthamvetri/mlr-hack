import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getCourses, getDepartments, getCourseStats, createCourse, deleteCourse, getCourseById, updateCourse, uploadCourseMaterial, deleteCourseMaterial, getUsers } from '../../utils/api';
import {
  BookOpen, Search, Plus, Users, Star, Edit, Trash2, Eye, X, AlertTriangle, CheckCircle,
  Download, Upload, FileText, File, BrainCircuit, ArrowUpRight, Grid3X3, List, GraduationCap,
  MoreHorizontal
} from 'lucide-react';
import Modal from '../../components/Modal';
import MindMapPreview from '../../components/MindMapPreview';
import PremiumFilterBar, { FilterTriggerButton } from '../../components/PremiumFilterBar';
import gsap from 'gsap';

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
      setDisplayValue(suffix === '/5' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-dark-400">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton Components
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

const SkeletonCourseCard = () => (
  <div className="rounded-xl p-5 bg-dark-800/50 border border-dark-700">
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-dark-700 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-dark-700 rounded" />
          <div className="h-3 w-20 bg-dark-700 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-dark-700 rounded" />
        <div className="h-3 w-2/3 bg-dark-700 rounded" />
      </div>
    </div>
  </div>
);

const AdminCourses = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [departments, setDepartments] = useState(['all']);
  const [staffList, setStaffList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active', description: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFile, setMaterialFile] = useState(null);
  const [materialName, setMaterialName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showMindMapModal, setShowMindMapModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, students: 0, avgRating: 0 });

  const statuses = ['all', 'Active', 'Upcoming', 'Completed'];

  // Refined GSAP Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        gsap.fromTo('.filter-bar', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.2, ease: 'power2.out' });
        gsap.fromTo('.course-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.25, ease: 'power2.out' });
      }, pageRef);
      return () => ctx.revert();
    }, 50);
    return () => clearTimeout(timer);
  }, [loading, viewMode]);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchCourses(); }, [filterDept, filterStatus]);

  useEffect(() => {
    if (!socket) return;
    socket.on('course_created', () => { fetchCourses(); fetchInitialData(); });
    socket.on('course_updated', () => { fetchCourses(); fetchInitialData(); });
    socket.on('course_deleted', () => { fetchCourses(); fetchInitialData(); });
    return () => { socket.off('course_created'); socket.off('course_updated'); socket.off('course_deleted'); };
  }, [socket]);

  const fetchInitialData = async () => {
    try {
      const { data } = await getDepartments();
      const deptCodes = data.map(d => d.code);
      setDepartments(['all', ...deptCodes]);
      try {
        const staffRes = await getUsers({ role: 'Staff' });
        setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (e) { setStaffList([]); }
      try {
        const statsRes = await getCourseStats();
        setStats({ total: statsRes.data.totalCourses || 0, active: statsRes.data.activeCourses || 0, students: statsRes.data.totalEnrollments || 0, avgRating: statsRes.data.avgRating || 0 });
      } catch (e) { }
    } catch (error) {
      setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept !== 'all') params.department = filterDept;
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await getCourses(params);
      setCourses(data);
      const courseData = data;
      setStats({
        total: courseData.length,
        active: courseData.filter(c => c.status === 'Active' || c.status === 'active').length,
        students: courseData.reduce((acc, c) => acc + (c.enrolledStudents?.length || c.students || 0), 0),
        avgRating: courseData.length > 0 ? (courseData.reduce((acc, c) => acc + (c.rating || 0), 0) / courseData.length).toFixed(1) : 0
      });
    } catch (error) {
      setCourses([]);
      setStats({ total: 0, active: 0, students: 0, avgRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.code) { setFormError('Please fill in all required fields'); return; }
    try {
      await createCourse(formData);
      setFormSuccess('Course added successfully!');
      setTimeout(() => { setShowAddModal(false); setFormData({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active' }); setFormSuccess(''); fetchCourses(); }, 1500);
    } catch (error) { setFormError(error.response?.data?.message || 'Error adding course'); }
  };

  const handleEditClick = async (course) => {
    setSelectedCourse(course);
    setFormData({ name: course.name, code: course.code, department: course.department?.code || course.department || 'CSE', credits: course.credits || 3, instructor: course.instructor?._id || course.instructor || '', status: course.status || 'Active' });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.code) { setFormError('Please fill in all required fields'); return; }
    try {
      await updateCourse(selectedCourse._id, formData);
      setFormSuccess('Course updated successfully!');
      setTimeout(() => { setShowEditModal(false); setSelectedCourse(null); setFormData({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active' }); setFormSuccess(''); fetchCourses(); }, 1500);
    } catch (error) { setFormError(error.response?.data?.message || 'Error updating course'); }
  };

  const handleViewClick = async (course) => {
    try {
      const { data } = await getCourseById(course._id);
      setViewCourse(data);
      setShowViewModal(true);
    } catch (error) {
      setViewCourse(course);
      setShowViewModal(true);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    try { await deleteCourse(selectedCourse._id); setShowDeleteModal(false); setSelectedCourse(null); fetchCourses(); }
    catch (error) { alert('Error deleting course'); }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile || !selectedCourse) return;
    setUploadingMaterial(true);
    try {
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('name', materialName || materialFile.name);
      await uploadCourseMaterial(selectedCourse._id, formData);
      const { data } = await getCourseById(selectedCourse._id);
      setSelectedCourse(data);
      setMaterialFile(null);
      setMaterialName('');
      setFormSuccess('Material uploaded successfully!');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error uploading material');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!selectedCourse || !materialId) return;
    try {
      await deleteCourseMaterial(selectedCourse._id, materialId);
      const { data } = await getCourseById(selectedCourse._id);
      setSelectedCourse(data);
    } catch (error) { alert('Error deleting material'); }
  };

  const openMaterialModal = async (course) => {
    try {
      const { data } = await getCourseById(course._id);
      setSelectedCourse(data);
      setShowMaterialModal(true);
    } catch (error) {
      setSelectedCourse(course);
      setShowMaterialModal(true);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Code', 'Department', 'Credits', 'Instructor', 'Students', 'Rating', 'Status'];
    const csvContent = [headers.join(','), ...filteredCourses.map(c => [c.name, c.code, c.department, c.credits, c.instructor, c.students, c.rating, c.status].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const clearFilters = () => { setSearchQuery(''); setFilterDept('all'); setFilterStatus('all'); };
  const hasActiveFilters = searchQuery || filterDept !== 'all' || filterStatus !== 'all';

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || c.department === filterDept || c.department?.code === filterDept;
    const matchesStatus = filterStatus === 'all' || c.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Department distribution
  const deptDistribution = departments.slice(1).map(d => ({
    name: d,
    count: courses.filter(c => c.department === d).length
  })).filter(d => d.count > 0);

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* Premium Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Course Catalog</h1>
            <p className="text-dark-400 text-sm mt-0.5">Manage courses and curriculum</p>
          </div>
          <div className="flex items-center gap-2.5">
            <FilterTriggerButton
              isOpen={filterPanelOpen}
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              activeFiltersCount={(filterDept !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
            />
            <button onClick={handleExport} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-dark-400 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-all duration-200">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-sm shadow-violet-500/20">
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Total Courses */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center border border-white/5">
                    <BookOpen className="w-4.5 h-4.5 text-dark-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>8</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Courses</p>
                <p className="text-2xl font-semibold text-white"><AnimatedNumber value={stats.total} /></p>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap gap-1">
                    {deptDistribution.slice(0, 3).map((d) => (
                      <span key={d.name} className="text-[10px] text-dark-400 bg-dark-700/50 px-1.5 py-0.5 rounded border border-white/5">{d.name}: {d.count}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Courses */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                    <BookOpen className="w-4.5 h-4.5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0} color="#10b981" />
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Active Courses</p>
                <p className="text-2xl font-semibold text-white"><AnimatedNumber value={stats.active} /></p>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-dark-400">Currently taught</span>
                  </div>
                </div>
              </div>

              {/* Enrolled Students */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                    <Users className="w-4.5 h-4.5 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>12%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Enrolled</p>
                <p className="text-2xl font-semibold text-white"><AnimatedNumber value={stats.students} /></p>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-dark-400">Across all courses</p>
                </div>
              </div>

              {/* Avg Rating */}
              <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                    <Star className="w-4.5 h-4.5 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 transition-colors ${i <= Math.round(parseFloat(stats.avgRating) || 0) ? 'text-amber-400 fill-amber-400' : 'text-dark-600'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Avg. Rating</p>
                <p className="text-2xl font-semibold text-white"><AnimatedNumber value={parseFloat(stats.avgRating) || 0} suffix="/5" /></p>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="relative h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700" style={{ width: `${((parseFloat(stats.avgRating) || 0) / 5) * 100}%` }} />
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
          searchPlaceholder="Search by name or code..."

          departments={departments}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          deptCounts={deptDistribution.reduce((acc, d) => ({ ...acc, [d.name]: d.count }), {})}

          statuses={statuses}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}

          viewMode={viewMode}
          setViewMode={setViewMode}
          showViewToggle={true}

          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}

          filteredCount={filteredCourses.length}
          totalCount={courses.length}
        />

        {/* Courses Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCourseCard key={i} />)}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.length > 0 ? filteredCourses.map((course) => (
              <div key={course._id} className="course-item group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600/20 to-violet-600/10 rounded-lg flex items-center justify-center border border-violet-500/20">
                      <BookOpen className="w-5 h-5 text-violet-300" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm group-hover:text-violet-400 transition-colors line-clamp-1">{course.name}</h3>
                      <p className="text-xs text-dark-400 font-mono">{course.code}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="px-2 py-2 bg-dark-700/50 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Dept</p>
                    <p className="text-xs font-medium text-dark-300">{typeof course.department === 'object' ? course.department?.code : course.department}</p>
                  </div>
                  <div className="px-2 py-2 bg-dark-700/50 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Credits</p>
                    <p className="text-xs font-medium text-dark-300">{course.credits || 3}</p>
                  </div>
                  <div className="px-2 py-2 bg-dark-700/50 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Students</p>
                    <p className="text-xs font-medium text-dark-300">{course.enrolledStudents?.length || course.students || 0}</p>
                  </div>
                </div>

                {course.rating > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-dark-400">Rating</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-dark-300">{course.rating}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${(course.rating / 5) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border border-white/5 ${course.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : course.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-400' : 'bg-dark-700 text-dark-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'Active' ? 'bg-emerald-500' : course.status === 'Upcoming' ? 'bg-blue-500' : 'bg-dark-500'}`} />
                    {course.status || 'Active'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleViewClick(course)} className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleEditClick(course)} className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openMaterialModal(course)} className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-full flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No courses found</h3>
                <p className="text-xs text-dark-400 mb-4">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-600 transition-colors">
                    <X className="w-3 h-3" />Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50 border-b border-dark-700">
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Course</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Department</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Credits</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Rating</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filteredCourses.map((course) => (
                    <tr key={course._id} className="course-item group hover:bg-dark-800/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-violet-600/20 to-violet-600/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-violet-300" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{course.name}</p>
                            <p className="text-xs text-dark-400 font-mono">{course.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5"><span className="px-2 py-1 bg-dark-700/50 text-dark-300 border border-white/5 rounded text-xs font-medium">{typeof course.department === 'object' ? course.department?.code : course.department}</span></td>
                      <td className="py-3 px-5 text-sm text-dark-400">{course.credits || 3}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-dark-300">{course.rating || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/5 ${course.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                          <span className={`w-1 h-1 rounded-full ${course.status === 'Active' ? 'bg-emerald-500' : 'bg-dark-500'}`} />
                          {course.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => handleViewClick(course)} className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleEditClick(course)} className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-full flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No courses found</h3>
              </div>
            )}
            {filteredCourses.length > 0 && (
              <div className="px-5 py-3 bg-dark-800/30 border-t border-dark-700">
                <p className="text-xs text-dark-500">Showing <span className="font-medium text-white">{filteredCourses.length}</span> of <span className="font-medium text-white">{courses.length}</span> courses</p>
              </div>
            )}
          </div>
        )}

        {/* Add Course Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Course" size="md">
          <form onSubmit={handleAddCourse} className="space-y-4">
            {formError && <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/10 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Course Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="Enter course name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Course Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all font-mono" placeholder="CS101" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Credits</label>
                <input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white transition-all" min="1" max="6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, instructor: '' })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  {departments.slice(1).map(d => <option key={d} value={d} className="bg-dark-800">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  <option className="bg-dark-800">Active</option>
                  <option className="bg-dark-800">Upcoming</option>
                  <option className="bg-dark-800">Completed</option>
                </select>
              </div>
            </div>
            {(() => {
              const filteredStaff = staffList.filter(s => {
                const staffDept = s.department?.code || s.department;
                return staffDept === formData.department;
              });
              return filteredStaff.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5">Instructor <span className="text-dark-500 font-normal">({filteredStaff.length} in {formData.department})</span></label>
                  <select value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                    <option value="" className="bg-dark-800">Select instructor</option>
                    {filteredStaff.map(s => <option key={s._id} value={s._id} className="bg-dark-800">{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/10 rounded-lg">
                  <p className="text-xs text-amber-400">No staff available in {formData.department} department</p>
                </div>
              );
            })()}
            <div className="flex gap-2.5 pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">Add Course</button>
            </div>
          </form>
        </Modal>

        {/* Edit Course Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Course" size="md">
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            {formError && <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/10 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Course Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Course Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Credits</label>
                <input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white transition-all" min="1" max="6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Department</label>
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, instructor: '' })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  {departments.slice(1).map(d => <option key={d} value={d} className="bg-dark-800">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                  <option className="bg-dark-800">Active</option>
                  <option className="bg-dark-800">Upcoming</option>
                  <option className="bg-dark-800">Completed</option>
                </select>
              </div>
            </div>
            {(() => {
              const filteredStaff = staffList.filter(s => {
                const staffDept = s.department?.code || s.department;
                return staffDept === formData.department;
              });
              return filteredStaff.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-dark-400 mb-1.5">Instructor <span className="text-dark-500 font-normal">({filteredStaff.length} in {formData.department})</span></label>
                  <select value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                    <option value="" className="bg-dark-800">Select instructor</option>
                    {filteredStaff.map(s => <option key={s._id} value={s._id} className="bg-dark-800">{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/10 rounded-lg">
                  <p className="text-xs text-amber-400">No staff available in {formData.department} department</p>
                </div>
              );
            })()}
            <div className="flex gap-2.5 pt-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">Update Course</button>
            </div>
          </form>
        </Modal>

        {/* View Course Modal */}
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Course Details" size="md">
          {viewCourse && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-violet-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{viewCourse.name}</h3>
                  <p className="text-sm text-dark-400 font-mono">{viewCourse.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-dark-700/50 border border-white/5 rounded-lg">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Department</p>
                  <p className="text-sm font-medium text-dark-300">{typeof viewCourse.department === 'object' ? viewCourse.department?.name : viewCourse.department}</p>
                </div>
                <div className="p-3 bg-dark-700/50 border border-white/5 rounded-lg">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Credits</p>
                  <p className="text-sm font-medium text-dark-300">{viewCourse.credits || 3}</p>
                </div>
                <div className="p-3 bg-dark-700/50 border border-white/5 rounded-lg">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Instructor</p>
                  <p className="text-sm font-medium text-dark-300">{viewCourse.instructor?.name || 'Not assigned'}</p>
                </div>
                <div className="p-3 bg-dark-700/50 border border-white/5 rounded-lg">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Status</p>
                  <p className="text-sm font-medium text-dark-300">{viewCourse.status || 'Active'}</p>
                </div>
              </div>
              {viewCourse.description && (
                <div className="p-3 bg-dark-700/50 border border-white/5 rounded-lg">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-dark-400">{viewCourse.description}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={showDeleteModal && selectedCourse} onClose={() => setShowDeleteModal(false)} size="sm">
          {selectedCourse && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Course?</h3>
              <p className="text-sm text-dark-400 mb-6">Are you sure you want to delete <strong className="text-white">{selectedCourse.name}</strong>?</p>
              <div className="flex gap-2.5">
                <button onClick={() => { setShowDeleteModal(false); setSelectedCourse(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleDeleteCourse} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Materials Modal */}
        <Modal isOpen={showMaterialModal} onClose={() => { setShowMaterialModal(false); setSelectedCourse(null); }} title="Course Materials" size="lg">
          {selectedCourse && (
            <div className="space-y-4">
              <form onSubmit={handleUploadMaterial} className="p-4 bg-dark-700/30 rounded-xl border border-white/5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={materialName} onChange={(e) => setMaterialName(e.target.value)} placeholder="Material name (optional)" className="flex-1 px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500" />
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg cursor-pointer hover:bg-dark-700 transition-colors">
                    <Upload className="w-4 h-4 text-dark-400" />
                    <span className="text-sm text-dark-300">{materialFile ? materialFile.name : 'Choose file'}</span>
                    <input type="file" className="hidden" onChange={(e) => setMaterialFile(e.target.files[0])} />
                  </label>
                  <button type="submit" disabled={!materialFile || uploadingMaterial} className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
                    {uploadingMaterial ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>

              {formError && <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/10 rounded-lg text-sm">{formError}</div>}
              {formSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg text-sm">{formSuccess}</div>}

              <div className="space-y-2">
                {selectedCourse.materials?.length > 0 ? selectedCourse.materials.map((material) => (
                  <div key={material._id} className="flex items-center justify-between p-3 bg-dark-800 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-dark-700/50 rounded-lg flex items-center justify-center border border-white/5">
                        <File className="w-4 h-4 text-dark-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{material.name}</p>
                        <p className="text-xs text-dark-400">{new Date(material.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedMaterial(material); setShowMindMapModal(true); }} className="p-2 text-dark-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors" title="Generate Mind Map">
                        <BrainCircuit className="w-4 h-4" />
                      </button>
                      <a href={material.url} target="_blank" rel="noopener noreferrer" className="p-2 text-dark-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleDeleteMaterial(material._id)} className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-dark-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No materials uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Mind Map Modal */}
        <Modal isOpen={showMindMapModal} onClose={() => { setShowMindMapModal(false); setSelectedMaterial(null); }} title="Mind Map Preview" size="xl">
          {selectedMaterial && <MindMapPreview material={selectedMaterial} />}
        </Modal>
      </div>
    </DashboardLayout >
  );
};

export default AdminCourses;
