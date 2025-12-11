import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Users, BookOpen, CreditCard, Calendar, CheckCircle, 
  XCircle, AlertTriangle, TrendingUp, Clock, Award
} from 'lucide-react';
import { 
  getStudentsForStaff, getAttendanceSummary, getFeeSummary, 
  getIneligibleStudents, getPendingApprovals 
} from '../../utils/api';

const StaffDashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [attendanceRes, feeRes, ineligibleRes, approvalsRes] = await Promise.all([
        getAttendanceSummary().catch(() => ({ data: {} })),
        getFeeSummary().catch(() => ({ data: {} })),
        getIneligibleStudents().catch(() => ({ data: { students: [] } })),
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
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name || 'Staff'}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stat.value}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ineligible Students Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Students Needing Attention
              </h2>
              <a href="/staff/attendance" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                View All
              </a>
            </div>
            
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : ineligibleList.length === 0 ? (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                All students are eligible!
              </div>
            ) : (
              <div className="space-y-3">
                {ineligibleList.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.rollNumber}</p>
                    </div>
                    <div className="text-right">
                      {student.issues?.map((issue, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400">{issue}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <a href="/staff/attendance" className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Attendance</span>
              </a>
              <a href="/staff/fees" className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Fee Management</span>
              </a>
              <a href="/staff/career-approvals" className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <Award className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Career Approvals</span>
              </a>
              <a href="/staff/eligibility" className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Check Eligibility</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
