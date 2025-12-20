import { Calendar, MessageSquare } from 'lucide-react';

const NoticeBoard = ({ notices = [] }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900 mb-4">Notice Board</h3>
      <div className="space-y-4">
        {notices.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No notices available</p>
        ) : (
          notices.map((notice, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group border border-transparent hover:border-zinc-100">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                <MessageSquare className="text-violet-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-zinc-900 text-sm truncate group-hover:text-violet-700 transition-colors">{notice.title}</h4>
                <p className="text-xs text-zinc-500 mt-1">By - {notice.author || 'Admin'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
