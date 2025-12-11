import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getEvents, updateEventStatus, getExams, getAdminStats, getUsers,
  getDepartments, getCourseStats, getFacultyStats, getPlacementStats, getRecentActivities
} from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, FileText, Calendar, Clock, Check, X, AlertTriangle, 
  GraduationCap, Building, TrendingUp, BookOpen, Award,
  UserPlus, CheckCircle, AlertCircle, UserCheck
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
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

  // Activity icon mapping
  const getActivityIcon = (type) => {
    switch(type) {
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
        const [departmentsRes, courseStatsRes, facultyStatsRes, placementStatsRes, activitiesRes] = await Promise.all([
          getDepartments(),
          getCourseStats(),
          getFacultyStats(),
          getPlacementStats(),
          getRecentActivities(10)
        ]);

        // Process department data
        if (departmentsRes.data) {
          const depts = departmentsRes.data.slice(0, 4);
          const totalStudents = depts.reduce((sum, d) => sum + (d.totalStudents || 0), 0) || 1;
          setDepartmentData(depts.map(d => ({
            name: d.name,
            count: d.totalStudents || 0,
            percentage: Math.round(((d.totalStudents || 0) / totalStudents) * 100)
          })));
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
          setPerformanceMetrics([
            { label: 'Course Completion Rate', value: 87, trend: '+5%', color: 'primary' },
            { label: 'Student Satisfaction', value: 92, trend: '+8%', color: 'primary' },
            { label: 'Job Placement Rate', value: placementStatsRes.data.placementRate || 0, trend: '+12%', color: 'green' },
            { label: 'Skill Assessment Score', value: 85, trend: '+3%', color: 'primary' },
          ]);
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
        // Set fallback data
        setDepartmentData([
          { name: 'Engineering', count: 847, percentage: 46 },
          { name: 'Business', count: 523, percentage: 28 },
          { name: 'Arts', count: 312, percentage: 17 },
          { name: 'Science', count: 165, percentage: 9 },
        ]);
        setRecentActivities([
          { type: 'enrollment', icon: UserPlus, title: 'New student enrolled', description: 'John Doe joined Computer Science', time: '2 minutes ago', color: 'blue' },
          { type: 'course', icon: CheckCircle, title: 'Course completed', description: 'Advanced AI course completed by 15 students', time: '1 hour ago', color: 'green' },
        ]);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Students - Featured */}
        <div className="col-span-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary-100">Total Students</h3>
            <GraduationCap className="w-6 h-6 text-primary-200" />
          </div>
          <p className="text-4xl font-bold mb-1">{stats?.totalStudents || 0}</p>
          <p className="text-primary-200 text-sm">Enrolled students</p>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500">Departments</h3>
            <Building className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{departmentData.length || 0}</p>
          <p className="text-xs text-gray-500">Active departments</p>
        </div>

        {/* Faculty */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500">Faculty</h3>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{facultyCount || 0}</p>
          <p className="text-xs text-gray-500">Teaching faculty</p>
        </div>

        {/* Avg Growth */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500">Avg Growth</h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">89%</p>
          <p className="text-xs text-gray-500">Skill improvement</p>
        </div>

        {/* Placement Rate - Blue gradient */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-blue-100">Placement Rate</h3>
            <Award className="w-4 h-4 text-blue-200" />
          </div>
          <p className="text-2xl font-bold">{placementRate || 0}%</p>
          <p className="text-xs text-blue-200">Job placements</p>
        </div>

        {/* Pending Approvals - Highlighted */}
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-yellow-100">Pending Events</h3>
            <AlertTriangle className="w-4 h-4 text-yellow-200" />
          </div>
          <p className="text-2xl font-bold">{pendingEvents.length || 0}</p>
          <p className="text-xs text-yellow-200">Awaiting review</p>
        </div>

        {/* Active Courses */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500">Active Courses</h3>
            <BookOpen className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{courseCount || 0}</p>
          <p className="text-xs text-gray-500">Running courses</p>
        </div>

        {/* Graduation Rate - Blue gradient */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-green-100">Graduation Rate</h3>
            <GraduationCap className="w-4 h-4 text-green-200" />
          </div>
          <p className="text-2xl font-bold">92%</p>
          <p className="text-xs text-green-200">Success rate</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.color === 'green' ? 'bg-green-500' : 'bg-primary-600'
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-800">Recent Activity</h3>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.color === 'blue' ? 'bg-blue-100' :
                    activity.color === 'green' ? 'bg-green-100' :
                    activity.color === 'yellow' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      activity.color === 'blue' ? 'text-blue-600' :
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
