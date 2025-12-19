import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import {
  Users, BookOpen, CreditCard, Calendar, CheckCircle,
  XCircle, AlertTriangle, TrendingUp, Clock, Award, UserPlus,
  ArrowUpRight, ArrowDownRight, Briefcase
} from 'lucide-react';
import {
  getAttendanceSummary, getFeeSummary,
  getIneligibleStudents, getPendingApprovals
} from '../../utils/api';

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

const StaffDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0, eligibleStudents: 0, ineligibleStudents: 0,
    avgAttendance: 0, feesClearedCount: 0, feesPendingCount: 0, pendingApprovals: 0
  });
  const [ineligibleList, setIneligibleList] = useState([]);

  // Staff can only see students from their department
  const staffDepartment = user?.department || '';

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.section-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.2, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    fetchDashboardData();
  }, [staffDepartment]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = staffDepartment ? { department: staffDepartment } : {};
      const [attendanceRes, feeRes, ineligibleRes, approvalsRes] = await Promise.all([
        getAttendanceSummary(params).catch(() => ({ data: {} })),
        getFeeSummary(params).catch(() => ({ data: {} })),
        getIneligibleStudents(params).catch(() => ({ data: { students: [] } })),
        getPendingApprovals().catch(() => ({ data: [] }))
      ]);

      const attendance = attendanceRes.data || {};
      const fees = feeRes.data || {};
      const ineligible = ineligibleRes.data || {};
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
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'blue', desc: 'Under your management' },
    { title: 'Eligible', value: stats.eligibleStudents, icon: CheckCircle, color: 'emerald', desc: 'Ready for exams' },
    { title: 'Ineligible', value: stats.ineligibleStudents, icon: XCircle, color: 'red', desc: 'Need attention' },
    { title: 'Avg Attendance', value: stats.avgAttendance, suffix: '%', icon: TrendingUp, color: 'violet', desc: 'Class average' },
    { title: 'Fees Cleared', value: stats.feesClearedCount, icon: CreditCard, color: 'teal', desc: 'Fully paid' },
    { title: 'Fees Pending', value: stats.feesPendingCount, icon: AlertTriangle, color: 'amber', desc: 'Dues remaining' },
    { title: 'Approvals', value: stats.pendingApprovals, icon: Clock, color: 'orange', desc: 'Pending requests' }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'text-teal-500' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Staff Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Welcome back, {user?.name}
              {user?.department && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">{user.department}</span>}
            </p>
          </div>
          {!user?.department && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
              <span>Department not set. <a href="/staff/profile" className="underline font-medium hover:text-amber-800">Update Profile</a></span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div key={index} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${colors.icon}`} strokeWidth={1.5} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${colors.text}`}>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.title}</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <p className="text-[10px] text-zinc-400">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ineligible Students */}
          <div className="lg:col-span-2 section-card bg-white rounded-xl border border-zinc-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">Action Required</h3>
                  <p className="text-xs text-zinc-500">Students with eligibility issues</p>
                </div>
              </div>
              <a href="/staff/attendance" className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">View All</a>
            </div>

            <div className="p-5 flex-1">
              {loading ? (
                <div className="text-center py-8 text-zinc-400 text-xs">Loading...</div>
              ) : ineligibleList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-zinc-900 font-medium text-sm">All Clear!</p>
                  <p className="text-zinc-500 text-xs mt-1">No students found with eligibility issues.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ineligibleList.map((student, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-red-600 border border-red-100">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                          <p className="text-xs text-zinc-500">{student.rollNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {student.issues?.slice(0, 1).map((issue, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
                            {issue}
                          </span>
                        ))}
                        {student.issues?.length > 1 && <span className="ml-1 text-[10px] text-zinc-400">+{student.issues.length - 1} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1 section-card bg-white rounded-xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-zinc-900 text-sm">Quick Actions</h3>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Attendance', path: '/staff/attendance', icon: Users, color: 'blue', desc: 'Mark & view attendance' },
                { label: 'Fee Status', path: '/staff/fees', icon: CreditCard, color: 'teal', desc: 'Check student fees' },
                { label: 'Career Requests', path: '/staff/career-approvals', icon: Award, color: 'violet', desc: 'Approve certificates' },
                { label: 'Eligibility Check', path: '/staff/eligibility', icon: CheckCircle, color: 'emerald', desc: 'Exam eligibility' },
                { label: 'Registrations', path: '/staff/registration-requests', icon: UserPlus, color: 'orange', desc: 'New enrollments' },
              ].map((action, i) => (
                <a key={i} href={action.path} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 group transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-${action.color}-50 text-${action.color}-600 group-hover:bg-${action.color}-100`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{action.label}</p>
                    <p className="text-xs text-zinc-500">{action.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
