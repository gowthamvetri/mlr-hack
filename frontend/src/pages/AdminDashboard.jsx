import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  getEvents, updateEventStatus, getExams, getAdminStats, getUsers,
  getDepartments, getCourseStats, getFacultyStats, getPlacementStats, getRecentActivities,
  getPerformanceMetrics, getDepartmentDistribution
} from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import AnimatedNumber from '../components/AnimatedNumber';
import gsap from 'gsap';
import {
  Users, FileText, Calendar, Clock, Check, X, AlertTriangle,
  GraduationCap, Building, TrendingUp, BookOpen, Award,
  UserPlus, CheckCircle, AlertCircle, UserCheck
} from 'lucide-react';

const AdminDashboard = () => {
  /* REMOVED: const { user } = useAuth(); */
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentData, setDepartmentData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([
    { label: 'Course Completion Rate', value: 0, trend: '+0%', color: 'primary' },
    { label: 'Student Satisfaction', value: 0, trend: '+0%', color: 'primary' },
    { label: 'Job Placement Rate', value: 0, trend: '+0%', color: 'green' },
    { label: 'Skill Assessment Score', value: 0, trend: '+0%', color: 'primary' },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [facultyCount, setFacultyCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [placementRate, setPlacementRate] = useState(0);

  // GSAP Animation Refs
  const pageRef = useRef(null);
  const statsGridRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Stats cards animation
        if (statsGridRef.current) {
          const cards = statsGridRef.current.querySelectorAll('.stat-card');
          gsap.fromTo(cards,
            { opacity: 0, y: 25, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
          );
        }
      }, pageRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]);

  // Activity icon mapping
  const getActivityIcon = (type) => {
    switch (type) {
      case 'enrollment': return { icon: UserPlus, color: 'blue' };
      case 'course': return { icon: CheckCircle, color: 'green' };
      case 'system': return { icon: AlertCircle, color: 'yellow' };
      case 'faculty': return { icon: UserCheck, color: 'purple' };
      default: return { icon: AlertCircle, color: 'gray' };
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch core admin stats and events
      const [statsRes, eventsRes] = await Promise.all([
        getAdminStats(),
        getEvents('Pending')
      ]);
      setStats(statsRes.data);
      setPendingEvents(eventsRes.data);

      // Fetch additional dynamic data
      try {
        const [deptDistRes, perfMetricsRes, courseStatsRes, facultyStatsRes, placementStatsRes, activitiesRes] = await Promise.all([
          getDepartmentDistribution(),
          getPerformanceMetrics(),
          getCourseStats(),
          getFacultyStats(),
          getPlacementStats(),
          getRecentActivities(10)
        ]);

        // Process department distribution (now from dedicated API)
        if (deptDistRes.data && deptDistRes.data.length > 0) {
          setDepartmentData(deptDistRes.data.slice(0, 4));
        }

        // Process performance metrics (now dynamic)
        if (perfMetricsRes.data && perfMetricsRes.data.length > 0) {
          // Update job placement rate from placement stats
          const metricsWithPlacement = perfMetricsRes.data.map(m => {
            if (m.label === 'Job Placement Rate') {
              return { ...m, value: placementStatsRes.data?.placementRate || m.value };
            }
            return m;
          });
          setPerformanceMetrics(metricsWithPlacement);
        }

        // Process course stats
        if (courseStatsRes.data) {
          setCourseCount(courseStatsRes.data.totalCourses || 0);
        }

        // Process faculty stats  
        if (facultyStatsRes.data) {
          setFacultyCount(facultyStatsRes.data.totalFaculty || 0);
        }

        // Process placement stats
        if (placementStatsRes.data) {
          setPlacementRate(placementStatsRes.data.placementRate || 0);
        }

        // Process activities
        if (activitiesRes.data) {
          setRecentActivities(activitiesRes.data.map(activity => {
            const { icon, color } = getActivityIcon(activity.type);
            const timeAgo = getTimeAgo(activity.createdAt);
            return {
              type: activity.type,
              icon,
              title: activity.title,
              description: activity.description,
              time: timeAgo,
              color
            };
          }));
        }
      } catch (additionalError) {
        console.log('Additional stats not available:', additionalError.message);
        // Show empty state when APIs fail - no static fallback data
        setDepartmentData([]);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
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

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        {/* Total Students */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800"><AnimatedNumber value={stats?.totalStudents || 0} /></p>
          <p className="text-xs text-gray-500">Enrolled students</p>
        </div>

        {/* Departments */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Departments</h3>
            <Building className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800"><AnimatedNumber value={departmentData.length || 0} /></p>
          <p className="text-xs text-gray-500">Active departments</p>
        </div>

        {/* Faculty */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Faculty</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800"><AnimatedNumber value={facultyCount || 0} /></p>
          <p className="text-xs text-gray-500">Teaching faculty</p>
        </div>

        {/* Avg Growth */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Avg Growth</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800"><AnimatedNumber value={stats?.avgGrowth || 0} suffix="%" /></p>
          <p className="text-xs text-gray-500">Skill improvement</p>
        </div>
      </div>

      {/* Second Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        {/* Placement Rate */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Placement Rate</h3>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600"><AnimatedNumber value={placementRate || 0} suffix="%" /></p>
          <p className="text-xs text-gray-500">Job placements</p>
        </div>

        {/* Pending Events */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Pending Events</h3>
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600"><AnimatedNumber value={pendingEvents.length || 0} /></p>
          <p className="text-xs text-gray-500">Awaiting review</p>
        </div>

        {/* Active Courses */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Active Courses</h3>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800"><AnimatedNumber value={courseCount || 0} /></p>
          <p className="text-xs text-gray-500">Running courses</p>
        </div>

        {/* Graduation Rate */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Graduation Rate</h3>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600"><AnimatedNumber value={stats?.graduationRate || 0} suffix="%" /></p>
          <p className="text-xs text-gray-500">Success rate</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution */}
        <div className="glass-card rounded-2xl p-6 tilt-card">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-800">Department Distribution</h3>
          </div>
          <div className="space-y-4">
            {departmentData.map((dept, index) => (
              <div key={dept.name} className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                <span className="flex-1 font-medium text-gray-700">{dept.name}</span>
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-primary-400'}`}
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{dept.count}</span>
                <span className="text-sm text-gray-400 w-10 text-right">{dept.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="glass-card rounded-2xl p-6 tilt-card">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-800">Performance Metrics</h3>
          </div>
          <div className="space-y-5">
            {performanceMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{metric.value}%</span>
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${metric.color === 'green' ? 'bg-green-500' : 'bg-primary-600'
                      }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 tilt-card">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-800">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color === 'blue' ? 'bg-blue-100' :
                    activity.color === 'green' ? 'bg-green-100' :
                      activity.color === 'yellow' ? 'bg-yellow-100' :
                        'bg-purple-100'
                    }`}>
                    <IconComponent className={`w-5 h-5 ${activity.color === 'blue' ? 'text-blue-600' :
                      activity.color === 'green' ? 'text-green-600' :
                        activity.color === 'yellow' ? 'text-yellow-600' :
                          'text-purple-600'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No recent activity</p>
                <p className="text-sm">Activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card rounded-2xl tilt-card overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Pending Approvals</h3>
                <p className="text-sm text-gray-500">{pendingEvents.length} events waiting</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {pendingEvents.length > 0 ? pendingEvents.slice(0, 5).map(event => (
              <div key={event._id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm">{event.title}</h4>
                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                    {event.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveEvent(event._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectEvent(event._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Check className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending approvals</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
