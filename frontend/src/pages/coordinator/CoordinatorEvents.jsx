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
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Cultural': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Sports': return 'bg-orange-50 text-orange-700 border border-orange-100';
      default: return 'bg-zinc-50 text-zinc-700 border border-zinc-100';
    }
  };

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Events</h1>
            <p className="text-zinc-500 mt-1 text-sm">Manage your club event proposals</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${showForm
              ? 'bg-zinc-100 text-zinc-700'
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
              }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Propose Event'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-up">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-medium text-xs uppercase tracking-wide">Total Events</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1"><AnimatedNumber value={events.length} /></p>
              </div>
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-medium text-xs uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1"><AnimatedNumber value={pendingCount} /></p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-medium text-xs uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1"><AnimatedNumber value={approvedCount} /></p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-medium text-xs uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1"><AnimatedNumber value={rejectedCount} /></p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Propose New Event</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Event Title *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option>Technical</option>
                    <option>Cultural</option>
                    <option>Sports</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description *</label>
                  <textarea
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm resize-none"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Describe your event"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start *</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">End *</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Venue *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
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
                className="mt-6 flex items-center justify-center gap-2 w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all text-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Proposal
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm font-medium text-zinc-700"
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
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Loading your events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div
                key={event._id}
                className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all ${event.status === 'Approved' ? 'border-emerald-200' :
                  event.status === 'Rejected' ? 'border-red-200' :
                    'border-amber-200'
                  }`}
              >
                <div className={`h-1 ${event.status === 'Approved' ? 'bg-emerald-500' :
                  event.status === 'Rejected' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-zinc-900">{event.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-bold ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </div>
                      <p className="text-zinc-600 line-clamp-2 text-sm">{event.description}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(event.status)}`}>
                      {event.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
                      {event.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {event.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                      {event.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-zinc-400" />
                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      {event.startTime} - {event.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      {event.venue}
                    </span>
                  </div>

                  {event.adminComments && event.status === 'Rejected' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm text-red-700">
                        <span className="font-semibold">Admin Feedback:</span> {event.adminComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center border-dashed">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <Calendar className="w-8 h-8 text-zinc-300" />
            </div>
            <p className="text-lg font-bold text-zinc-900">No events found</p>
            <p className="text-zinc-500 mt-1 text-sm">Click "Propose Event" to create your first event</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorEvents;
