import { useState, useEffect } from 'react';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CalendarView = ({ isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', type: 'Event', scope: 'Institute' });
  const { user } = useAuth();

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Academic Calendar</h2>
      
      {isAdmin && (
        <form onSubmit={handleCreate} className="mb-6 bg-gray-50 p-4 rounded border text-sm">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input placeholder="Event Title" className="p-2 border rounded" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required />
            <input type="date" className="p-2 border rounded" value={newEvent.start} onChange={e => setNewEvent({...newEvent, start: e.target.value})} required />
            <select className="p-2 border rounded" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
              <option value="Event">Event</option>
              <option value="Holiday">Holiday</option>
              <option value="Exam">Exam</option>
              <option value="Deadline">Deadline</option>
              <option value="Academic">Academic</option>
            </select>
            <select className="p-2 border rounded" value={newEvent.scope} onChange={e => setNewEvent({...newEvent, scope: e.target.value})}>
              <option value="Institute">Institute Wide</option>
              <option value="Department">Department</option>
              <option value="Batch">Batch</option>
            </select>
          </div>
          {newEvent.scope === 'Department' && (
             <input placeholder="Department (e.g. CSE)" className="p-2 border rounded w-full mb-2" onChange={e => setNewEvent({...newEvent, department: e.target.value})} />
          )}
          {newEvent.scope === 'Batch' && (
             <input placeholder="Batch (e.g. 2025)" className="p-2 border rounded w-full mb-2" onChange={e => setNewEvent({...newEvent, batch: e.target.value})} />
          )}
          <button type="submit" className="bg-primary-600 text-white px-3 py-1 rounded w-full">Add Event</button>
        </form>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.map(event => (
          <div key={event._id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-10 rounded ${
                event.type === 'Holiday' ? 'bg-red-500' : 
                event.type === 'Exam' ? 'bg-purple-500' : 
                'bg-primary-500'
              }`}></div>
              <div>
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-gray-500">{new Date(event.start).toLocaleDateString()} • {event.type}</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => handleDelete(event._id)} className="text-red-500 text-xs hover:underline">Delete</button>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-500 text-sm text-center">No events scheduled.</p>}
      </div>
    </div>
  );
};

export default CalendarView;
