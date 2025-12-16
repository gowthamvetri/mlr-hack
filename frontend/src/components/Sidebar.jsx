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
  ExternalLink
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
          { to: '/student/career', icon: Target, label: 'Career Roadmap' },
          { to: '/student/exams', icon: ClipboardList, label: 'My Exams' },
          { to: '/student/hall-tickets', icon: Ticket, label: 'Hall Tickets' },
          { to: '/student/study', icon: GraduationCap, label: 'Study Support' },
          { to: '/student/ai-twin', icon: Brain, label: 'AI Twin' },
          { to: '/student/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/student/calculators', icon: Calculator, label: 'Calculators' },
          { to: '/student/profile', icon: UserCircle, label: 'My Profile' },
        ];
      case 'Admin':
        return [
          { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
          { to: '/admin/students', icon: Users, label: 'Students' },
          { to: '/admin/staff', icon: School, label: 'Staff' },
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
          { to: '/admin/registration-requests', icon: UserPlus, label: 'Registration Requests' },
          { to: '/admin/placements', icon: Briefcase, label: 'Placements' },
          { to: '/admin/placement-page', icon: Building, label: 'Placement Page' },
          { to: '/admin/exam-scheduling', icon: Wand2, label: 'Exam Management' },
          { to: '/admin/invigilators', icon: UserCog, label: 'Invigilators' },
          { to: '/admin/events', icon: Calendar, label: 'Events' },
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
          { to: '/staff/courses', icon: BookOpen, label: 'My Courses' },
          { to: '/staff/external-courses', icon: ExternalLink, label: 'External Courses' },
          { to: '/staff/invigilation', icon: ClipboardCheck, label: 'Invigilation' },
          { to: '/staff/attendance', icon: ClipboardList, label: 'Attendance' },
          { to: '/staff/fees', icon: ClipboardCheck, label: 'Fee Management' },
          { to: '/staff/career-approvals', icon: Target, label: 'Career Approvals' },
          { to: '/staff/eligibility', icon: ClipboardList, label: 'Eligibility Check' },
          { to: '/staff/profile', icon: UserCircle, label: 'My Profile' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) onClose();
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-gray-100">
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
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-primary-600 text-white font-semibold shadow-lg shadow-primary-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-600'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-sm" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-primary-50 hover:text-primary-600 rounded-xl text-gray-600 shadow-sm border border-gray-200 transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
