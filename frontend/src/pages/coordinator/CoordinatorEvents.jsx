import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getEvents, createEvent } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
  Calendar, Plus, X, Clock, MapPin, Send, Filter, Search, CheckCircle, XCircle,
  CalendarDays, Sparkles
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const CoordinatorEvents = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('event_status_updated', () => fetchEvents());
    return () => socket.off('event_status_updated');
  }, [socket]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await getEvents();
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
      setSubmitting(true);
      await createEvent(newEvent);
      setShowForm(false);
      setNewEvent({
        title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || ''
      });
      fetchEvents();
    } catch (error) {
      alert('Error proposing event');
    } finally {
      setSubmitting(false);
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-gray-500 mt-1 text-lg">Manage your club event proposals</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${showForm
              ? 'bg-gray-200 text-gray-700 shadow-none'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
              }`}
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Propose Event'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-up">
          <div className="glass-card rounded-2xl p-5 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm">Total Events</p>
                <p className="text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={events.length} /></p>
              </div>
              <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1"><AnimatedNumber value={pendingCount} /></p>
              </div>
              <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={approvedCount} /></p>
              </div>
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-500 mt-1"><AnimatedNumber value={rejectedCount} /></p>
              </div>
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Form */}
        {showForm && (
          <div className="glass-card rounded-2xl tilt-card overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Propose New Event</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option>Technical</option>
                    <option>Cultural</option>
                    <option>Sports</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Describe your event"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Venue *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    placeholder="Event venue"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Proposal
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="glass-card rounded-2xl p-5 tilt-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 transition-all font-medium"
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
        {loading ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading your events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div
                key={event._id}
                className={`glass-card rounded-2xl overflow-hidden hover:shadow-md transition-all ${event.status === 'Approved' ? 'border-green-200' :
                  event.status === 'Rejected' ? 'border-red-200' :
                    'border-yellow-200'
                  }`}
              >
                <div className={`h-1 ${event.status === 'Approved' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  event.status === 'Rejected' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  }`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl text-gray-900">{event.title}</h3>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{event.description}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(event.status)}`}>
                      {event.status === 'Approved' && <CheckCircle className="w-4 h-4" />}
                      {event.status === 'Rejected' && <XCircle className="w-4 h-4" />}
                      {event.status === 'Pending' && <Clock className="w-4 h-4" />}
                      {event.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {event.startTime} - {event.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {event.venue}
                    </span>
                  </div>

                  {event.adminComments && event.status === 'Rejected' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-700">
                        <strong>Admin Feedback:</strong> {event.adminComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-16 text-center tilt-card">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-xl font-bold text-gray-900">No events found</p>
            <p className="text-gray-500 mt-1">Click "Propose Event" to create your first event</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorEvents;
