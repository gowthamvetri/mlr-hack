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
  HeadphonesIcon,
  School,
  Target,
  ClipboardCheck,
  UserPlus,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getNavItems = () => {
    switch (user?.role) {
      case 'Student':
        return [
          { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
          { to: '/student/career', icon: Target, label: 'Career Roadmap' },
          { to: '/student/exams', icon: ClipboardList, label: 'My Exams' },
          { to: '/student/study', icon: GraduationCap, label: 'Study Support' },
          { to: '/student/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/student/profile', icon: UserCircle, label: 'My Profile' },
        ];
      case 'Admin':
        return [
          { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
          { to: '/admin/students', icon: Users, label: 'Students' },
          { to: '/admin/faculty', icon: School, label: 'Faculty' },
          { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
          { to: '/admin/career-approvals', icon: ClipboardCheck, label: 'Career Approvals' },
          { to: '/admin/registration-requests', icon: UserPlus, label: 'Registration Requests' },
          { to: '/admin/placements', icon: Briefcase, label: 'Placements' },
          { to: '/admin/placement-page', icon: Building, label: 'Placement Page' },
          { to: '/admin/exams', icon: ClipboardList, label: 'Exams' },
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
        return [
          { to: '/staff', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/staff/attendance', icon: Users, label: 'Attendance' },
          { to: '/staff/fees', icon: ClipboardCheck, label: 'Fee Management' },
          { to: '/staff/career-approvals', icon: Target, label: 'Career Approvals' },
          { to: '/staff/eligibility', icon: ClipboardList, label: 'Eligibility Check' },
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
      fixed left-0 top-0 h-screen w-64 bg-white shadow-lg z-50 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="p-4 sm:p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-sm sm:text-base">MLRIT</h1>
            <p className="text-xs text-gray-500">Academic Portal</p>
          </div>
        </div>
        {/* Close button - Only on mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 sm:p-4 border-t">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircle className="text-primary-600 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-600 transition-all text-sm"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
