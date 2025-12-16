import { Calendar, MessageSquare } from 'lucide-react';

const NoticeBoard = ({ notices = [] }) => {
  return (
    <div className="glass-card tilt-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Notice Board</h3>
      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No notices available</p>
        ) : (
          notices.map((notice, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="text-primary-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{notice.title}</h4>
                <p className="text-xs text-gray-500 mt-1">By - {notice.author || 'Admin'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
