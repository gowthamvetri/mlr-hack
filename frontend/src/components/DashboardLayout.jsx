import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { Search, UserCircle, Menu, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

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

  return (
    <div className="min-h-screen bg-gray-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-gray-50 to-gray-50">
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
        <header className="sticky top-0 z-30 glass border-b border-gray-200/90 bg-gray-50/95">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile menu button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100/80 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              {/* Search Bar - Hidden on small mobile */}
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-40 md:w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-gray-100/50 hover:bg-gray-100 focus:bg-white rounded-2xl border border-transparent focus:border-primary-200 focus:ring-4 focus:ring-primary-100/50 transition-all duration-300 text-sm outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="hidden md:block text-right">
                  <p className="font-semibold text-gray-800 text-sm truncate max-w-[150px]">{user?.name}</p>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">{user?.department || user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30 ring-2 ring-white cursor-pointer hover:scale-105 transition-transform duration-200">
                  <UserCircle className="w-6 h-6 opacity-90" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
