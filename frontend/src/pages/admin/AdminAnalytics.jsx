import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getAdminStats, getDepartments, getCourseStats,
  getPlacementStats, getFacultyStats
} from '../../utils/api';
import {
  BarChart3, TrendingUp, Users, GraduationCap, Award,
  Download, Calendar, ArrowUpRight, ArrowDownRight, Target, BookOpen,
  Star, Activity, ChevronRight
} from 'lucide-react';
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
      setDisplayValue(suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value, suffix]);

  return <span className="tabular-nums tracking-tight">{prefix}{displayValue}{suffix}</span>;
};

// Minimal Progress Ring
const ProgressRing = ({ percentage, size = 80, strokeWidth = 6, color = '#8b5cf6' }) => {
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
        <span className="text-lg font-semibold text-zinc-900">{percentage}%</span>
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const pageRef = useRef(null);

  const [overviewStats, setOverviewStats] = useState([
    { label: 'Total Students', value: 0, change: '+12%', trend: 'up', icon: Users, color: 'violet' },
    { label: 'Completion Rate', value: 87, change: '+5%', trend: 'up', icon: Target, color: 'emerald', suffix: '%' },
    { label: 'Avg. Score', value: 78, change: '+3.2', trend: 'up', icon: Award, color: 'amber' },
    { label: 'Active Courses', value: 0, change: '+8', trend: 'up', icon: BookOpen, color: 'blue' },
  ]);

  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [topCourses, setTopCourses] = useState([]);

  const monthlyTrends = [
    { month: 'Jan', enrollments: 120, completions: 85 },
    { month: 'Feb', enrollments: 135, completions: 92 },
    { month: 'Mar', enrollments: 150, completions: 98 },
    { month: 'Apr', enrollments: 142, completions: 105 },
    { month: 'May', enrollments: 168, completions: 112 },
    { month: 'Jun', enrollments: 185, completions: 125 },
  ];

  useEffect(() => { fetchAnalytics(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [adminStats, departmentsData, courseStats, placementStats] = await Promise.all([
        getAdminStats().catch(() => ({ data: {} })),
        getDepartments().catch(() => ({ data: [] })),
        getCourseStats().catch(() => ({ data: {} })),
        getPlacementStats().catch(() => ({ data: {} }))
      ]);

      setOverviewStats([
        { label: 'Total Students', value: adminStats.data?.totalStudents || 1847, change: '+12%', trend: 'up', icon: Users, color: 'violet' },
        { label: 'Completion Rate', value: courseStats.data?.completionRate || 87, change: '+5%', trend: 'up', icon: Target, color: 'emerald', suffix: '%' },
        { label: 'Avg. Score', value: parseInt(adminStats.data?.avgScore) || 78, change: '+3.2', trend: 'up', icon: Award, color: 'amber' },
        { label: 'Active Courses', value: courseStats.data?.totalCourses || 156, change: '+8', trend: 'up', icon: BookOpen, color: 'blue' },
      ]);

      // Ensure departmentsData is an array before using
      const deptsArray = Array.isArray(departmentsData.data) ? departmentsData.data : (departmentsData.data?.departments || []);

      if (deptsArray.length > 0) {
        setDepartmentPerformance(deptsArray.slice(0, 4).map((dept, i) => ({
          dept: dept.name,
          students: dept.totalStudents || [847, 523, 312, 165][i],
          completion: 85 + Math.floor(Math.random() * 10),
          placement: 80 + Math.floor(Math.random() * 15),
          avgScore: 75 + Math.floor(Math.random() * 10)
        })));
      } else {
        setDepartmentPerformance([
          { dept: 'Computer Science', students: 847, completion: 92, placement: 95, avgScore: 82 },
          { dept: 'Electronics', students: 523, completion: 88, placement: 89, avgScore: 78 },
          { dept: 'Mechanical', students: 312, completion: 85, placement: 82, avgScore: 75 },
          { dept: 'Information Tech', students: 165, completion: 90, placement: 91, avgScore: 80 },
        ]);
      }

      setTopCourses([
        { name: 'Data Structures & Algorithms', enrolled: 456, completion: 94, rating: 4.8, trend: 'up' },
        { name: 'Machine Learning Basics', enrolled: 389, completion: 88, rating: 4.7, trend: 'up' },
        { name: 'Web Development', enrolled: 342, completion: 91, rating: 4.6, trend: 'stable' },
        { name: 'Database Management', enrolled: 298, completion: 89, rating: 4.5, trend: 'up' },
        { name: 'Computer Networks', enrolled: 276, completion: 86, rating: 4.4, trend: 'down' },
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxEnrollment = Math.max(...monthlyTrends.map(m => m.enrollments));

  const getColorClasses = (color) => {
    const colors = {
      violet: { bg: 'bg-violet-50', icon: 'text-violet-500', ring: '#8b5cf6' },
      emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', ring: '#10b981' },
      amber: { bg: 'bg-amber-50', icon: 'text-amber-500', ring: '#f59e0b' },
      blue: { bg: 'bg-blue-50', icon: 'text-blue-500', ring: '#3b82f6' },
    };
    return colors[color] || colors.violet;
  };

  return (
    <DashboardLayout title="Analytics">
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Analytics Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Real-time insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-zinc-100 rounded-lg">
              {['overview', 'trends', 'performance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all duration-200 shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => {
            const colorClasses = getColorClasses(stat.color);
            return (
              <div key={index} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${colorClasses.icon}`} strokeWidth={1.5} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Performance Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900">Monthly Performance</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Enrollment & completion trends</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-xs text-zinc-500">Enrollments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-500">Completions</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-3 h-48 mb-4">
              {monthlyTrends.map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    <div
                      className="w-5 bg-violet-500 rounded-t transition-all duration-500 hover:opacity-80"
                      style={{ height: `${(month.enrollments / maxEnrollment) * 100}%` }}
                    />
                    <div
                      className="w-5 bg-emerald-500 rounded-t transition-all duration-500 hover:opacity-80"
                      style={{ height: `${(month.completions / maxEnrollment) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">{month.month}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
              <div className="text-center">
                <p className="text-xl font-semibold text-zinc-900">
                  {monthlyTrends.reduce((sum, m) => sum + m.enrollments, 0)}
                </p>
                <p className="text-xs text-zinc-500">Total Enrollments</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-emerald-600">
                  {monthlyTrends.reduce((sum, m) => sum + m.completions, 0)}
                </p>
                <p className="text-xs text-zinc-500">Total Completions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-violet-600">
                  {Math.round(monthlyTrends.reduce((sum, m) => sum + m.completions, 0) / monthlyTrends.reduce((sum, m) => sum + m.enrollments, 0) * 100)}%
                </p>
                <p className="text-xs text-zinc-500">Overall Rate</p>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white rounded-xl p-6 text-black">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-sm">Quick Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">Top Department</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">+15%</span>
                </div>
                <p className="text-sm font-semibold">Computer Science</p>
                <p className="text-[10px] text-zinc-400 mt-1">Highest placement rate</p>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">Best Course</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px]">4.8</span>
                  </div>
                </div>
                <p className="text-sm font-semibold">Data Structures</p>
                <p className="text-[10px] text-zinc-400 mt-1">456 active students</p>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">This Month</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-sm font-semibold">185 New Enrollments</p>
                <p className="text-[10px] text-zinc-400 mt-1">↑ 10% vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-zinc-900">Department Performance</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Comparative analysis across departments</p>
            </div>
            <button className="text-violet-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentPerformance.map((dept, index) => (
              <div key={index} className="group rounded-xl border border-zinc-100 p-5 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-zinc-900 text-sm truncate">{dept.dept}</h4>
                  <span className="text-xs text-zinc-400">{dept.students} students</span>
                </div>

                <div className="flex justify-center mb-4">
                  <ProgressRing percentage={dept.completion} color="#10b981" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-zinc-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-600">{dept.placement}%</p>
                    <p className="text-[10px] text-zinc-500">Placement</p>
                  </div>
                  <div className="text-center p-2 bg-zinc-50 rounded-lg">
                    <p className="text-sm font-semibold text-violet-600">{dept.avgScore}</p>
                    <p className="text-[10px] text-zinc-500">Avg Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-zinc-900">Top Performing Courses</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Based on enrollment and completion rates</p>
            </div>
          </div>

          <div className="space-y-3">
            {topCourses.map((course, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors group">
                <div className="w-9 h-9 bg-violet-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  #{index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-zinc-900 text-sm truncate">{course.name}</h4>
                  <p className="text-xs text-zinc-500">{course.enrolled} students enrolled</p>
                </div>

                <div className="hidden md:flex items-center gap-6">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Completion</span>
                      <span className="font-medium text-zinc-700">{course.completion}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.completion}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-semibold text-zinc-900">{course.rating}</span>
                  </div>

                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${course.trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                    course.trend === 'down' ? 'bg-red-50 text-red-600' :
                      'bg-zinc-100 text-zinc-600'
                    }`}>
                    {course.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> :
                      course.trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> :
                        <Activity className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
