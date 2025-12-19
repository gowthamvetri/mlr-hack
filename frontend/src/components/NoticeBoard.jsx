import { Calendar, MessageSquare } from 'lucide-react';

const NoticeBoard = ({ notices = [] }) => {
  return (
    <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4">Notice Board</h3>
      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-4">No notices available</p>
        ) : (
          notices.map((notice, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-dark-700 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                <MessageSquare className="text-primary-500" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate group-hover:text-primary-400 transition-colors">{notice.title}</h4>
                <p className="text-xs text-dark-400 mt-1">By - {notice.author || 'Admin'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
