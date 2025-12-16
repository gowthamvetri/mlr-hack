import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import gsap from 'gsap';
import {
  Users, BookOpen, CreditCard, Calendar, CheckCircle,
  XCircle, AlertTriangle, TrendingUp, Clock, Award
} from 'lucide-react';
import {
  getAttendanceSummary, getFeeSummary,
  getIneligibleStudents, getPendingApprovals
} from '../../utils/api';

const StaffDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState({
    totalStudents: 0,
    eligibleStudents: 0,
    ineligibleStudents: 0,
    avgAttendance: 0,
    feesClearedCount: 0,
    feesPendingCount: 0,
    pendingApprovals: 0
  });
  const [ineligibleList, setIneligibleList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Staff can only see students from their department
  const staffDepartment = user?.department || '';

  // GSAP Animation Refs
  const pageRef = useRef(null);
  const statsGridRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        if (statsGridRef.current) {
          const cards = statsGridRef.current.children;
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

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffDepartment]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = staffDepartment ? { department: staffDepartment } : {};

      // Fetch all data in parallel with department filter
      const [attendanceRes, feeRes, ineligibleRes, approvalsRes] = await Promise.all([
        getAttendanceSummary(params).catch(() => ({ data: {} })),
        getFeeSummary(params).catch(() => ({ data: {} })),
        getIneligibleStudents(params).catch(() => ({ data: { students: [] } })),
        getPendingApprovals().catch(() => ({ data: [] }))
      ]);

      const attendance = attendanceRes.data;
      const fees = feeRes.data;
      const ineligible = ineligibleRes.data;
      const approvals = Array.isArray(approvalsRes.data) ? approvalsRes.data : [];

      setStats({
        totalStudents: attendance.totalStudents || 0,
        eligibleStudents: attendance.aboveThreshold || 0,
        ineligibleStudents: ineligible.count || 0,
        avgAttendance: attendance.averageAttendance || 0,
        feesClearedCount: fees.feesPaidCount || 0,
        feesPendingCount: fees.feesPendingCount || 0,
        pendingApprovals: approvals.length || 0
      });

      setIneligibleList(ineligible.students?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'blue',
      desc: 'Under your management'
    },
    {
      title: 'Eligible for Exams',
      value: stats.eligibleStudents,
      icon: CheckCircle,
      color: 'green',
      desc: '≥75% attendance & fees paid'
    },
    {
      title: 'Not Eligible',
      value: stats.ineligibleStudents,
      icon: XCircle,
      color: 'red',
      desc: 'Need attention'
    },
    {
      title: 'Avg Attendance',
      value: `${stats.avgAttendance}%`,
      icon: TrendingUp,
      color: 'purple',
      desc: 'Overall average'
    },
    {
      title: 'Fees Cleared',
      value: stats.feesClearedCount,
      icon: CreditCard,
      color: 'emerald',
      desc: 'All dues paid'
    },
    {
      title: 'Fees Pending',
      value: stats.feesPendingCount,
      icon: AlertTriangle,
      color: 'amber',
      desc: 'Outstanding dues'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'orange',
      desc: 'Career requests'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      emerald: 'bg-emerald-100 text-emerald-600',
      amber: 'bg-amber-100 text-amber-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <DashboardLayout>
      <div ref={pageRef} className="space-y-6">
        {/* Department Warning */}
        {!user?.department && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 text-amber-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Department Not Set!</p>
                <p className="text-sm">
                  You need to set your department in your profile to manage students.
                  <a href="/staff/profile" className="underline font-medium ml-1">Go to Profile →</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-500">
              Welcome back, {user?.name || 'Staff'}
              {user?.department && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {user.department} Department
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {loading ? '...' : (
                    typeof stat.value === 'string' && stat.value.includes('%')
                      ? <AnimatedNumber value={parseInt(stat.value) || 0} suffix="%" />
                      : <AnimatedNumber value={stat.value || 0} />
                  )}
                </p>
                <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                <p className="text-xs text-gray-500">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ineligible Students Alert */}
          <div className="glass-card rounded-xl p-6 tilt-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Students Needing Attention
              </h2>
              <a href="/staff/attendance" className="text-primary-600 hover:underline text-sm">
                View All
              </a>
            </div>

            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : ineligibleList.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                All students are eligible!
              </div>
            ) : (
              <div className="space-y-3">
                {ineligibleList.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                    </div>
                    <div className="text-right">
                      {student.issues?.map((issue, i) => (
                        <p key={i} className="text-xs text-red-600">{issue}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="glass-card rounded-xl p-6 tilt-card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <a href="/staff/attendance" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Manage Attendance</span>
              </a>
              <a href="/staff/fees" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Fee Management</span>
              </a>
              <a href="/staff/career-approvals" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <Award className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Career Approvals</span>
              </a>
              <a href="/staff/eligibility" className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <CheckCircle className="w-8 h-8 text-amber-600 mb-2" />
                <span className="text-sm font-medium text-gray-800">Check Eligibility</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
