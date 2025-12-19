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
  Users, Clock, Check, X, AlertTriangle,
  GraduationCap, Building, BookOpen, Award,
  UserPlus, CheckCircle, AlertCircle, UserCheck, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar
} from 'lucide-react';

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

// Mini Sparkline
const Sparkline = ({ data, color = '#8b5cf6', height = 32 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const padding = 4;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - min) / range) * (height - padding * 2)
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
    </svg>
  );
};

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

  const pageRef = useRef(null);

  // Refined GSAP Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        gsap.fromTo('.section-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 });
      }, pageRef);
      return () => ctx.revert();
    }, 50);
    return () => clearTimeout(timer);
  }, [loading]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'enrollment': return { icon: UserPlus, color: 'blue' };
      case 'course': return { icon: CheckCircle, color: 'green' };
      case 'system': return { icon: AlertCircle, color: 'yellow' };
      case 'faculty': return { icon: UserCheck, color: 'purple' };
      default: return { icon: AlertCircle, color: 'gray' };
    }
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
      setPendingEvents(eventsRes.data);

      try {
        const [deptDistRes, perfMetricsRes, courseStatsRes, facultyStatsRes, placementStatsRes, activitiesRes] = await Promise.all([
          getDepartmentDistribution(),
          getPerformanceMetrics(),
          getCourseStats(),
          getFacultyStats(),
          getPlacementStats(),
          getRecentActivities(10)
        ]);

        if (deptDistRes.data?.length > 0) setDepartmentData(deptDistRes.data.slice(0, 5));
        if (perfMetricsRes.data?.length > 0) {
          const metricsWithPlacement = perfMetricsRes.data.map(m => {
            if (m.label === 'Job Placement Rate') return { ...m, value: placementStatsRes.data?.placementRate || m.value };
            return m;
          });
          setPerformanceMetrics(metricsWithPlacement);
        }
        if (courseStatsRes.data) setCourseCount(courseStatsRes.data.totalCourses || 0);
        if (facultyStatsRes.data) setFacultyCount(facultyStatsRes.data.totalFaculty || 0);
        if (placementStatsRes.data) setPlacementRate(placementStatsRes.data.placementRate || 0);
        if (activitiesRes.data) {
          setRecentActivities(activitiesRes.data.map(activity => {
            const { icon, color } = getActivityIcon(activity.type);
            const timeAgo = getTimeAgo(activity.createdAt);
            return { type: activity.type, icon, title: activity.title, description: activity.description, time: timeAgo, color };
          }));
        }
      } catch (additionalError) {
        setDepartmentData([]);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleApproveEvent = async (id) => {
    try {
      await updateEventStatus(id, { status: 'Approved', adminComments: 'Approved by Admin' });
      fetchData();
    } catch (error) {
      alert('Error approving event');
    }
  };

  const handleRejectEvent = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await updateEventStatus(id, { status: 'Rejected', adminComments: reason });
      fetchData();
    } catch (error) {
      alert('Error rejecting event');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="space-y-6 max-w-[1400px] mx-auto animate-pulse">
          <div className="h-12 w-64 bg-zinc-100 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-100 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-zinc-100 rounded-xl" />
            <div className="h-80 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Here's what's happening today</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Hero Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-violet-500" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>12%</span>
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Students</p>
            <p className="text-2xl font-semibold text-zinc-900">
              <AnimatedNumber value={stats?.totalStudents || 0} />
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-50">
              <Sparkline data={[120, 145, 132, 168, 155, 189, 210]} color="#8b5cf6" />
            </div>
          </div>

          {/* Faculty */}
          <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-blue-500" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>5%</span>
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Faculty</p>
            <p className="text-2xl font-semibold text-zinc-900">
              <AnimatedNumber value={facultyCount || 0} />
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs text-zinc-500">Active members</span>
              </div>
            </div>
          </div>

          {/* Active Courses */}
          <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <ProgressRing percentage={courseCount > 0 ? 85 : 0} color="#10b981" />
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Active Courses</p>
            <p className="text-2xl font-semibold text-zinc-900">
              <AnimatedNumber value={courseCount || 0} />
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-50">
              <p className="text-[10px] text-zinc-400">85% completion rate</p>
            </div>
          </div>

          {/* Placement Rate */}
          <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="w-4.5 h-4.5 text-amber-500" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>8%</span>
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Placement Rate</p>
            <p className="text-2xl font-semibold text-zinc-900">
              <AnimatedNumber value={placementRate || 0} suffix="%" />
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-50">
              <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${placementRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Events */}
          <div className="section-card lg:col-span-2 bg-white rounded-xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900">Pending Approvals</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Events awaiting your review</p>
              </div>
              {pendingEvents.length > 0 && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">
                  {pendingEvents.length} pending
                </span>
              )}
            </div>

            {pendingEvents.length > 0 ? (
              <div className="space-y-3">
                {pendingEvents.slice(0, 4).map((event) => (
                  <div key={event._id} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors group">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-zinc-900 text-sm truncate">{event.title}</h4>
                      <p className="text-xs text-zinc-500">{new Date(event.date).toLocaleDateString()} • {event.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveEvent(event._id)}
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectEvent(event._id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-zinc-400" />
                </div>
                <h4 className="text-sm font-medium text-zinc-700 mb-1">All caught up!</h4>
                <p className="text-xs text-zinc-500">No pending events to review</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="section-card bg-white rounded-xl p-6 text-black">
            <h3 className="font-semibold text-sm mb-6">Performance Metrics</h3>
            <div className="space-y-4">
              {(performanceMetrics.length > 0 ? performanceMetrics : [
                { label: 'Course Completion', value: 87, trend: '+5%' },
                { label: 'Student Satisfaction', value: 92, trend: '+3%' },
                { label: 'Placement Rate', value: placementRate || 85, trend: '+8%' },
              ]).slice(0, 3).map((metric, i) => (
                <div key={i} className="p-4 bg-gray-100 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-black/60">{metric.label}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{metric.trend}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{metric.value}%</p>
                    <div className="w-16 h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-black/80 rounded-full transition-all duration-700" style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Distribution & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900">Department Distribution</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Students per department</p>
              </div>
            </div>
            <div className="space-y-4">
              {(departmentData.length > 0 ? departmentData : [
                { name: 'Computer Science', count: 450 },
                { name: 'Electronics', count: 320 },
                { name: 'Mechanical', count: 280 },
                { name: 'Information Tech', count: 240 },
              ]).slice(0, 4).map((dept, i) => {
                const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
                const maxCount = Math.max(...(departmentData.length > 0 ? departmentData : [{ count: 450 }]).map(d => d.count || 100));
                const percentage = Math.round(((dept.count || 100) / maxCount) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-700">{dept.name}</span>
                      <span className="text-sm font-semibold text-zinc-900">{dept.count || 0}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: colors[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900">Recent Activity</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Latest updates</p>
              </div>
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity, i) => {
                  const Icon = activity.icon;
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600',
                    green: 'bg-emerald-50 text-emerald-600',
                    yellow: 'bg-amber-50 text-amber-600',
                    purple: 'bg-violet-50 text-violet-600',
                    gray: 'bg-zinc-50 text-zinc-600'
                  };
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{activity.title}</p>
                        <p className="text-xs text-zinc-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
