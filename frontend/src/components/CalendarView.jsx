import { useState, useEffect } from 'react';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../utils/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const CalendarView = ({ isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', type: 'Event', scope: 'Institute' });
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCalendarEvent(newEvent);
      setNewEvent({ title: '', start: '', type: 'Event', scope: 'Institute' });
      fetchEvents();
    } catch (error) {
      alert('Error creating event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete event?')) return;
    try {
      await deleteCalendarEvent(id);
      fetchEvents();
    } catch (error) {
      alert('Error deleting event');
    }
  };

  // Get color classes based on event type
  const getEventColorClasses = (type) => {
    switch (type) {
      case 'Holiday':
        return 'bg-primary-500';
      case 'Exam':
        return 'bg-accent-500';
      case 'Deadline':
        return 'bg-primary-600';
      default:
        return 'bg-success-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-3">Academic Calendar</h2>

      {isAdmin && (
        <form onSubmit={handleCreate} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Event Title"
              className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              required
            />
            <input
              type="date"
              className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              value={newEvent.start}
              onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
              required
            />
            <select
              className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              value={newEvent.type}
              onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
            >
              <option value="Event">Event</option>
              <option value="Holiday">Holiday</option>
              <option value="Exam">Exam</option>
              <option value="Deadline">Deadline</option>
              <option value="Academic">Academic</option>
            </select>
            <select
              className="p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              value={newEvent.scope}
              onChange={e => setNewEvent({ ...newEvent, scope: e.target.value })}
            >
              <option value="Institute">Institute Wide</option>
              <option value="Department">Department</option>
              <option value="Batch">Batch</option>
            </select>
          </div>
          {newEvent.scope === 'Department' && (
            <input
              placeholder="Department (e.g. CSE)"
              className="p-2.5 border border-gray-200 rounded-lg w-full mb-3 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              onChange={e => setNewEvent({ ...newEvent, department: e.target.value })}
            />
          )}
          {newEvent.scope === 'Batch' && (
            <input
              placeholder="Batch (e.g. 2025)"
              className="p-2.5 border border-gray-200 rounded-lg w-full mb-3 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
              onChange={e => setNewEvent({ ...newEvent, batch: e.target.value })}
            />
          )}
          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg w-full font-medium transition-colors shadow-sm"
          >
            Add Event
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.map(event => (
          <div key={event._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-10 rounded-full ${getEventColorClasses(event.type)}`}></div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{event.title}</p>
                <p className="text-xs text-gray-500">{new Date(event.start).toLocaleDateString()} • {event.type}</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(event._id)}
                className="text-primary-600 text-xs font-medium hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No events scheduled.</p>}
      </div>
    </div>
  );
};

export default CalendarView;
