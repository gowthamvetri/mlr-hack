import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { Search, UserCircle, Menu, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';

const DashboardLayout = ({ children, title }) => {
  /* REMOVED: const { user } = useAuth(); */
  const user = useSelector(selectCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      // Show toast
      toast.info(data.message || 'New notification');

      // Optional: Play sound or update notification count in redux
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  // GSAP page content animation
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const timer = setTimeout(() => {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen mesh-gradient-bg">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 backdrop-blur-md border-b border-dark-700/50 bg-dark-900/80">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile menu button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-dark-800 transition-colors"
                id="mobile-menu-btn"
              >
                <Menu className="w-6 h-6 text-dark-200" />
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent truncate tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              {/* Search Bar - Hidden on small mobile */}
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-40 md:w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-dark-800/50 hover:bg-dark-800 focus:bg-dark-800 rounded-2xl border border-dark-700/50 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm outline-none text-dark-100 placeholder-dark-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-4 border-l border-dark-700/50">
                <div className="hidden md:block text-right">
                  <p className="font-semibold text-dark-100 text-sm truncate max-w-[150px]">{user?.name}</p>
                  <p className="text-xs text-dark-400 font-medium truncate max-w-[150px]">{user?.department || user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/20 ring-2 ring-dark-700 cursor-pointer hover:scale-105 transition-transform duration-200">
                  <UserCircle className="w-6 h-6 opacity-90" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main ref={contentRef} className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
