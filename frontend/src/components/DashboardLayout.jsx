import { useState } from 'react';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { Search, UserCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, title }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar with mobile toggle */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile menu button + Title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{title}</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              {/* Search Bar - Hidden on small mobile */}
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-40 md:w-56 lg:w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              
              {/* Notifications */}
              <NotificationPanel />
              
              {/* User Avatar */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCircle className="text-primary-600 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-gray-800 text-sm truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.department || user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
