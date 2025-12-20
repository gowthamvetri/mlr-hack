import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Bell,
  Settings,
  GraduationCap,
  Building,
  Building2,
  UserCircle,
  LogOut,
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  HeadphonesIcon,
  School,
  Target,
  ClipboardCheck,
  UserPlus,
  X,
  Ticket,
  Brain,
  Wand2,
  UserCog,
  ExternalLink,
  MessageSquare,
  UserCheck,
  Trophy
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../store/slices/authSlice';

const Sidebar = ({ isOpen, onClose }) => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    if (onClose) onClose();
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'Student':
        return [
          { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
          { to: '/student/timetable', icon: Calendar, label: 'Timetable' },
          { to: '/student/career', icon: Target, label: 'Career Roadmap' },
          { to: '/student/exams', icon: ClipboardList, label: 'Exams & Tickets' },
          { to: '/student/results', icon: Trophy, label: 'My Results' },
          { to: '/student/attendance', icon: UserCheck, label: 'Attendance' },
          { to: '/student/study', icon: GraduationCap, label: 'Study Support' },
          { to: '/student/ai-twin', icon: Brain, label: 'AI Twin' },
          { to: '/student/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/student/calculators', icon: Calculator, label: 'Calculators' },
          { to: '/student/profile', icon: UserCircle, label: 'My Profile' },
        ];
      case 'Admin':
        return [
          { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
          { to: '/admin/staff', icon: School, label: 'Staff' },
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
          { to: '/admin/departments', icon: Building2, label: 'Departments' },
          { to: '/admin/placements', icon: Briefcase, label: 'Placements' },
          { to: '/admin/results', icon: Trophy, label: 'Result Publication' },
          { to: '/admin/exam-scheduling', icon: Wand2, label: 'Exam Management' },
          { to: '/admin/events', icon: Calendar, label: 'Events' },
          { to: '/admin/chatbot-content', icon: MessageSquare, label: 'Chatbot Content' },
          { to: '/admin/profile', icon: UserCircle, label: 'My Profile' },
        ];
      case 'SeatingManager':
        return [
          { to: '/seating-manager', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/seating-manager/allocate', icon: Building, label: 'Allocate Seats' },
          { to: '/seating-manager/rooms', icon: Building, label: 'Rooms' },
          { to: '/seating-manager/profile', icon: UserCircle, label: 'My Profile' },
        ];
      case 'ClubCoordinator':
        return [
          { to: '/club-coordinator', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/club-coordinator/events', icon: Calendar, label: 'My Events' },
          { to: '/club-coordinator/profile', icon: UserCircle, label: 'Club Profile' },
        ];
      case 'Staff':
      case 'Faculty':
        return [
          { to: '/staff', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/staff/students', icon: Users, label: 'Students' },
          { to: '/staff/subjects', icon: BookOpen, label: 'My Subjects' },
          { to: '/staff/attendance', icon: UserCheck, label: 'Attendance' },
          { to: '/staff/timetable', icon: Calendar, label: 'Timetable' },
          { to: '/staff/external-courses', icon: ExternalLink, label: 'External Courses' },
          { to: '/staff/invigilation', icon: ClipboardCheck, label: 'Invigilation' },
          { to: '/staff/student-management', icon: ClipboardList, label: 'Student Management' },
          { to: '/staff/career-approvals', icon: Target, label: 'Career Approvals' },
          { to: '/staff/profile', icon: UserCircle, label: 'My Profile' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-64 bg-white border-r border-zinc-200 shadow-sm z-50 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <img
            src="/mlrit-logo.png"
            alt="MLRIT Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        {/* Close button - Only on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-zinc-900 text-white font-semibold shadow-lg'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 shadow-sm border border-zinc-200 transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:scale-110 text-red-500 transition-transform" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
