import { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../utils/api';
import { Bell } from 'lucide-react';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-primary-600">
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b font-bold text-gray-700">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`p-3 border-b hover:bg-gray-50 ${n.read ? 'opacity-60' : 'bg-primary-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xs text-gray-700 mb-1">{n.title || n.type}</p>
                    <p className="text-sm text-gray-800">{n.message}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n._id)} className="text-xs text-primary-600 hover:underline ml-2 whitespace-nowrap">
                      Mark Read
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
