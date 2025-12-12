import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getEvents, createEvent } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Plus, X, Check, Clock, MapPin, Send, Filter, Search, CheckCircle, XCircle } from 'lucide-react';

import { useSocket } from '../../context/SocketContext';

const CoordinatorEvents = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || 'Tech Club'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('event_status_updated', () => {
      fetchEvents();
    });

    return () => {
      socket.off('event_status_updated');
    };
  }, [socket]);

  const fetchEvents = async () => {
    try {
      const { data } = await getEvents();
      // Filter to show only this coordinator's events
      setEvents(data.filter(e => e.coordinator?._id === user._id || e.coordinator === user._id));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvent(newEvent);
      setShowForm(false);
      setNewEvent({
        title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || 'Tech Club'
      });
      fetchEvents();
      alert('Event proposed successfully!');
    } catch (error) {
      alert('Error proposing event');
    }
  };

  const statuses = ['all', 'Pending', 'Approved', 'Rejected'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = events.filter(e => e.status === 'Pending').length;
  const approvedCount = events.filter(e => e.status === 'Approved').length;
  const rejectedCount = events.filter(e => e.status === 'Rejected').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-700';
      case 'Cultural': return 'bg-purple-100 text-purple-700';
      case 'Sports': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Events</h1>
          <p className="text-gray-500">Manage your club event proposals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${showForm
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Propose Event'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{events.length}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Propose New Event</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              >
                <option>Technical</option>
                <option>Cultural</option>
                <option>Sports</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Describe your event"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                placeholder="Event venue"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                <Send className="w-5 h-5" />
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map(event => (
          <div key={event._id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${event.status === 'Approved' ? 'border-green-200' :
            event.status === 'Rejected' ? 'border-red-200' :
              'border-yellow-200'
            }`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-xl text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  <p className="text-gray-600">{event.description}</p>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {event.status === 'Approved' && <CheckCircle className="w-4 h-4" />}
                  {event.status === 'Rejected' && <XCircle className="w-4 h-4" />}
                  {event.status === 'Pending' && <Clock className="w-4 h-4" />}
                  {event.status}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.startTime} - {event.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue}
                </span>
              </div>

              {event.adminComments && event.status === 'Rejected' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Admin Comment:</strong> {event.adminComments}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No events found</p>
          <p className="text-gray-400 text-sm">Click "Propose Event" to create your first event</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CoordinatorEvents;
