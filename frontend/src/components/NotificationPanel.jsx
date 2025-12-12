import { useState } from 'react';
import { 
  useGetNotificationsQuery, 
  useMarkNotificationReadMutation, 
  useMarkAllNotificationsReadMutation, 
  useDeleteNotificationMutation 
} from '../services/api';
import { Bell, X, CheckCheck, Trash2, Loader2 } from 'lucide-react';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // RTK Query hooks - automatically handles caching, loading states, and refetching
  const { 
    data: notifications = [], 
    isLoading, 
    isError 
  } = useGetNotificationsQuery(undefined, {
    // Poll every minute for new notifications
    pollingInterval: 60000,
  });
  
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      await markRead(id).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
    } catch (error) {
      console.error('Failed to delete notification:', error);
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
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 hover:bg-primary-50 rounded"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
                <p className="text-gray-500 text-sm mt-2">Loading notifications...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-red-500 text-sm">Failed to load notifications</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No new notifications</p>
                <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n._id} 
                  className="p-4 border-b hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Icon based on type */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.type === 'Exam' ? 'bg-red-100' :
                      n.type === 'Event' ? 'bg-purple-100' :
                      n.type === 'Seating' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <Bell className={`w-5 h-5 ${
                        n.type === 'Exam' ? 'text-red-600' :
                        n.type === 'Event' ? 'text-purple-600' :
                        n.type === 'Seating' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-800 leading-tight">
                          {n.title || n.type}
                        </p>
                        {/* Unread indicator */}
                        {!n.read && !n.readBy?.includes(n._id) && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-snug mb-2">{n.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleMarkRead(n._id)}
                            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 hover:bg-primary-50 rounded"
                            title="Mark as read"
                          >
                            Dismiss
                          </button>
                          <button 
                            onClick={(e) => handleDelete(n._id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
