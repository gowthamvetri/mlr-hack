import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  getEvents, updateEventStatus, getAdminStats,
  getCourseStats, getFacultyStats, getPlacementStats, getRecentActivities,
  getPerformanceMetrics, getDepartmentDistribution
} from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import gsap from 'gsap';
import {
  Users, Clock, Check, X,
  GraduationCap, BookOpen, Award,
  UserPlus, CheckCircle, AlertCircle, UserCheck, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, TrendingUp, Sparkles, Activity, Building2, Briefcase,
  ChevronRight, MoreHorizontal, Zap
} from 'lucide-react';

// ============================================================================
// VISUAL COMPONENTS - Integrated micro-visualizations
// ============================================================================

// Animated Counter with smooth easing
const AnimatedValue = ({ value, suffix = '', prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = prev.current;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * eased;
      setDisplay(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(animate);
      else prev.current = end;
    };
    requestAnimationFrame(animate);
  }, [value, decimals]);

  return <span className="tabular-nums font-semibold">{prefix}{display.toLocaleString()}{suffix}</span>;
};

// Organic flowing area chart
const FlowChart = ({ data, color = '#8b5cf6', height = 64, showDots = true }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 200;
  const padding = { x: 8, y: 8 };

  const points = data.map((val, i) => ({
    x: padding.x + (i / (data.length - 1)) * (width - padding.x * 2),
    y: padding.y + (1 - (val - min) / range) * (height - padding.y * 2)
  }));

  // Create smooth bezier curve
  const bezierPath = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp2x = prev.x + 2 * (point.x - prev.x) / 3;
    return `${acc} C ${cp1x},${prev.y} ${cp2x},${point.y} ${point.x},${point.y}`;
  }, '');

  const areaPath = `${bezierPath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`flow-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#flow-${color.replace('#', '')})`} />
      <path d={bezierPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
      {showDots && <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} className="drop-shadow-md" />}
    </svg>
  );
};

// Radial progress indicator
const RadialProgress = ({ value, size = 72, thickness = 6, color = '#8b5cf6' }) => {
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-zinc-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-sm" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-zinc-900">{value}%</span>
      </div>
    </div>
  );
};

// Inline sparkline for trends
const TrendLine = ({ data, positive = true, height = 24 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 48;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * width},${4 + (1 - (val - min) / range) * (height - 8)}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={positive ? '#10b981' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Horizontal bar segment
const BarSegment = ({ label, value, max, color, index }) => {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className="group cursor-default" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-zinc-600 font-medium">{label}</span>
        <span className="text-[13px] font-semibold text-zinc-900">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-zinc-100/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const AdminDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentData, setDepartmentData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [facultyCount, setFacultyCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [placementRate, setPlacementRate] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const pageRef = useRef(null);

  // Smooth entry animations
  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-section', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo('.insight-block', { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.2 });
      gsap.fromTo('.content-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.4 });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const getActivityIcon = (type) => {
    const icons = { enrollment: { icon: UserPlus, color: 'blue' }, course: { icon: CheckCircle, color: 'green' }, system: { icon: AlertCircle, color: 'amber' }, faculty: { icon: UserCheck, color: 'violet' } };
    return icons[type] || { icon: Activity, color: 'zinc' };
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes] = await Promise.all([
        getAdminStats(),
        getEvents('Pending')
      ]);
      setStats(statsRes.data);
      setPendingEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);

      try {
        const [deptDistRes, perfMetricsRes, courseStatsRes, facultyStatsRes, placementStatsRes, activitiesRes] = await Promise.all([
          getDepartmentDistribution(), getPerformanceMetrics(), getCourseStats(), getFacultyStats(), getPlacementStats(), getRecentActivities(10)
        ]);

        if (deptDistRes.data?.length > 0) setDepartmentData(deptDistRes.data.slice(0, 5));
        if (perfMetricsRes.data?.length > 0) setPerformanceMetrics(perfMetricsRes.data);
        if (courseStatsRes.data) setCourseCount(courseStatsRes.data.totalCourses || 0);
        if (facultyStatsRes.data) setFacultyCount(facultyStatsRes.data.totalFaculty || 0);
        if (placementStatsRes.data) setPlacementRate(placementStatsRes.data.placementRate || 0);
        if (activitiesRes.data) {
          setRecentActivities(activitiesRes.data.map(a => ({ ...a, ...getActivityIcon(a.type), time: getTimeAgo(a.createdAt) })));
        }
      } catch { /* silent fail for secondary data */ }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setTimeout(() => setRefreshing(false), 400); };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleApproveEvent = async (id) => { try { await updateEventStatus(id, { status: 'Approved', adminComments: 'Approved' }); fetchData(); } catch { /* handle error */ } };
  const handleRejectEvent = async (id) => { const reason = prompt("Rejection reason:"); if (reason) { try { await updateEventStatus(id, { status: 'Rejected', adminComments: reason }); fetchData(); } catch { /* handle error */ } } };

  // Sample trend data - in production, this would come from API
  const trendData = {
    students: [180, 195, 210, 205, 235, 248, 265],
    courses: [42, 45, 48, 52, 55, 58, 62],
    placements: [65, 68, 72, 75, 78, 82, 85]
  };

  const defaultDepts = [
    { name: 'Computer Science', count: 450, color: '#8b5cf6' },
    { name: 'Electronics & Comm.', count: 320, color: '#3b82f6' },
    { name: 'Mechanical Eng.', count: 280, color: '#10b981' },
    { name: 'Information Tech.', count: 240, color: '#f59e0b' },
    { name: 'Civil Engineering', count: 180, color: '#ec4899' }
  ];

  const depts = Array.isArray(departmentData) && departmentData.length > 0
    ? departmentData.map((d, i) => ({ ...d, color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'][i] }))
    : defaultDepts;

  const maxDeptCount = Math.max(...depts.map(d => d.count || 0));

  // Loading state with refined skeleton
  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="max-w-[1400px] mx-auto space-y-8 animate-pulse">
          <div className="h-20 bg-gradient-to-r from-zinc-100 to-zinc-50 rounded-2xl" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 h-48 bg-zinc-100/60 rounded-2xl" />
            <div className="col-span-4 h-48 bg-zinc-100/60 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-zinc-100/50 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-8">

        {/* ================================================================
            HERO SECTION - Primary insight at a glance
            ================================================================ */}
        <div className="hero-section relative overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-sm p-8 lg:p-10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-medium border border-zinc-200">
                  Updated {getTimeAgo(lastUpdated)}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-2 tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-zinc-500 text-sm lg:text-base max-w-lg">
                {Array.isArray(pendingEvents) && pendingEvents.length > 0
                  ? `You have ${pendingEvents.length} event${pendingEvents.length > 1 ? 's' : ''} awaiting approval. Student enrollment is up this month.`
                  : `Everything looks great! Student enrollment shows positive trends this month.`}
              </p>
            </div>

            {/* Primary action & key stat */}
            <div className="flex items-center gap-6">
              <div className="hidden lg:block text-right">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Total Enrollment</p>
                <p className="text-4xl font-bold text-zinc-900">
                  <AnimatedValue value={stats?.totalStudents || 0} />
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600">+12% this month</span>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-zinc-800 transition-all disabled:opacity-60 shadow-lg shadow-zinc-200 hover:shadow-xl"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================
            INSIGHTS ROW - Visual data panels (not boxed cards)
            ================================================================ */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left: Department distribution with flowing visualization */}
          <div className="insight-block col-span-12 lg:col-span-7 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 lg:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 mb-1">Student Distribution</h2>
                <p className="text-sm text-zinc-500">Enrollment by department</p>
              </div>
              <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-5">
              {depts.slice(0, 5).map((dept, i) => (
                <BarSegment key={i} label={dept.name} value={dept.count || 0} max={maxDeptCount} color={dept.color} index={i} />
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {depts.reduce((acc, d) => acc + (d.count || 0), 0).toLocaleString()} total students across {depts.length} departments
              </span>
              <button className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Placement highlight with radial progress */}
          <div className="insight-block col-span-12 lg:col-span-5 bg-gradient-to-br from-violet-50/50 via-white to-violet-50/20 rounded-2xl border border-violet-100/50 shadow-sm p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center border border-violet-200">
                <Briefcase className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Placement Rate</h2>
                <p className="text-xs text-zinc-500">Current academic year</p>
              </div>
            </div>

            <div className="flex items-center justify-center py-4">
              <RadialProgress value={placementRate || 78} size={140} thickness={10} color="#8b5cf6" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide">Offers Made</p>
                <p className="text-xl font-bold text-zinc-900">847</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide">Avg. Package</p>
                <p className="text-xl font-bold text-zinc-900">₹8.5L</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">+8%</span>
              <span className="text-zinc-400">vs last year</span>
            </div>
          </div>
        </div>

        {/* ================================================================
            METRICS STRIP - Key numbers with inline visualizations
            ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Students metric */}
          <div className="insight-block group relative bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-violet-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                <GraduationCap className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-600">12%</span>
              </div>
            </div>

            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Students</p>
            <p className="text-2xl font-bold text-zinc-900 mb-3">
              <AnimatedValue value={stats?.totalStudents || 0} />
            </p>

            <FlowChart data={trendData.students} color="#8b5cf6" height={48} />
          </div>

          {/* Faculty metric */}
          <div className="insight-block group relative bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Users className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Faculty</p>
            <p className="text-2xl font-bold text-zinc-900 mb-3">
              <AnimatedValue value={facultyCount || 0} />
            </p>

            <div className="flex items-center gap-3">
              <TrendLine data={[12, 14, 13, 15, 16, 15, 18]} positive={true} />
              <span className="text-xs text-zinc-400">Active this week</span>
            </div>
          </div>

          {/* Courses metric */}
          <div className="insight-block group relative bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <BookOpen className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400">Completion</p>
                <p className="text-xs font-semibold text-emerald-600">85%</p>
              </div>
            </div>

            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Courses</p>
            <p className="text-2xl font-bold text-zinc-900 mb-3">
              <AnimatedValue value={courseCount || 0} />
            </p>

            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
            </div>
          </div>

          {/* Pending metric */}
          <div className="insight-block group relative bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-amber-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              </div>
              {Array.isArray(pendingEvents) && pendingEvents.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100 animate-pulse">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-600">Action needed</span>
                </div>
              )}
            </div>

            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-bold text-zinc-900 mb-3">
              <AnimatedValue value={pendingEvents.length} />
            </p>

            <p className="text-xs text-zinc-400">Events awaiting review</p>
          </div>
        </div>

        {/* ================================================================
            CONTENT SECTIONS - Approvals & Activity
            ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Pending Approvals - Primary action area */}
          <div className="content-section lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                    <Calendar className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">Pending Approvals</h3>
                    <p className="text-xs text-zinc-500">Review and approve events</p>
                  </div>
                </div>
                {Array.isArray(pendingEvents) && pendingEvents.length > 0 && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                    {pendingEvents.length} pending
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {Array.isArray(pendingEvents) && pendingEvents.length > 0 ? (
                <div className="space-y-2">
                  {pendingEvents.slice(0, 5).map((event, i) => (
                    <div key={event._id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-100">
                        <Calendar className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-zinc-900 text-sm truncate">{event.title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.category || 'Event'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleApproveEvent(event._id)}
                          className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRejectEvent(event._id)}
                          className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors border border-red-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h4 className="font-medium text-zinc-900 mb-1">All caught up!</h4>
                  <p className="text-sm text-zinc-400">No pending approvals at the moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="content-section lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <Activity className="w-4.5 h-4.5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">Activity Feed</h3>
                  <p className="text-xs text-zinc-500">Recent updates</p>
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto">
              {Array.isArray(recentActivities) && recentActivities.length > 0 ? (
                <div className="space-y-1">
                  {recentActivities.slice(0, 8).map((activity, i) => {
                    const Icon = activity.icon;
                    const colors = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-emerald-50 text-emerald-600 border-emerald-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', violet: 'bg-violet-50 text-violet-600 border-violet-100', zinc: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colors[activity.color] || colors.zinc}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-800 truncate">{activity.title}</p>
                          <p className="text-xs text-zinc-400">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================
            PERFORMANCE METRICS - Visual summary
            ================================================================ */}
        {/* <div className="content-section bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                <TrendingUp className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">Performance Overview</h3>
                <p className="text-xs text-zinc-500">Key metrics for this semester</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(Array.isArray(performanceMetrics) && performanceMetrics.length > 0 ? performanceMetrics : [
              { label: 'Course Completion Rate', value: 87, trend: '+5%' },
              { label: 'Student Satisfaction', value: 92, trend: '+3%' },
              { label: 'Faculty Performance', value: 89, trend: '+4%' }
            ]).slice(0, 3).map((metric, i) => (
              <div key={i} className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-600">{metric.label}</span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />{metric.trend}
                  </span>
                </div>
                <div className="flex items-end gap-4">
                  <span className="text-4xl font-bold text-zinc-900">{metric.value}%</span>
                  <FlowChart data={trendData.placements.map(v => v + i * 5)} color={['#8b5cf6', '#10b981', '#3b82f6'][i]} height={40} showDots={false} />
                </div>
                <div className="mt-4 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${metric.value}%`, backgroundColor: ['#8b5cf6', '#10b981', '#3b82f6'][i] }} />
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
