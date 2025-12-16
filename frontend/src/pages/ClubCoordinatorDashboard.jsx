import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { createEvent, getEvents, getClubProfile, updateClubProfile } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import AnimatedNumber from '../components/AnimatedNumber';
import gsap from 'gsap';
import {
  Calendar, CheckCircle, Clock, XCircle, Plus, X, Send, Users, Building, Mail,
  Sparkles, PartyPopper, CalendarDays
} from 'lucide-react';

const ClubCoordinatorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || ''
  });
  const [profile, setProfile] = useState({
    clubName: user?.clubName || '', tagline: '', description: '', contactEmail: ''
  });

  // GSAP Animation Refs
  const pageRef = useRef(null);
  const statsRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        if (statsRef.current) {
          const cards = statsRef.current.children;
          gsap.fromTo(cards,
            { opacity: 0, y: 25, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
          );
        }
      }, pageRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    fetchMyEvents();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await getClubProfile();
      if (data && data.clubName) setProfile(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const { data } = await getEvents();
      setEvents(data.filter(e => e.coordinator?._id === user._id || e.coordinator === user._id));
    } catch (error) {
      console.error(error);
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
      fetchMyEvents();
    } catch (error) {
      alert('Error proposing event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateClubProfile(profile);
      setShowProfile(false);
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const approvedEvents = events.filter(e => e.status === 'Approved').length;
  const pendingEvents = events.filter(e => e.status === 'Pending').length;
  const rejectedEvents = events.filter(e => e.status === 'Rejected').length;

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date() && e.status === 'Approved');

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Club Dashboard</h1>
            <p className="text-gray-500 mt-1 text-lg">
              Welcome back, {user?.name || 'Coordinator'}! Manage your club events.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowForm(false); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              <Building className="w-5 h-5" />
              Club Profile
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowProfile(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg ${showForm
                ? 'bg-gray-200 text-gray-700'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
                }`}
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm ? 'Close' : 'Propose Event'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card rounded-2xl p-6 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Total Events</p>
                <p className="text-3xl font-bold text-gray-800 mt-2"><AnimatedNumber value={events.length} /></p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2"><AnimatedNumber value={approvedEvents} /></p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2"><AnimatedNumber value={pendingEvents} /></p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 tilt-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-500 mt-2"><AnimatedNumber value={rejectedEvents} /></p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Club Profile Section */}
        {showProfile && (
          <div className="glass-card rounded-2xl tilt-card overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Manage Club Profile</h2>
              </div>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Club Name</label>
                  <input
                    placeholder="Enter club name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={profile.clubName}
                    onChange={e => setProfile({ ...profile, clubName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
                  <input
                    placeholder="Short tagline for your club"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={profile.tagline}
                    onChange={e => setProfile({ ...profile, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                  <input
                    placeholder="club@example.com"
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={profile.contactEmail}
                    onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of your club"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    value={profile.description}
                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary-200 active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* Event Proposal Form */}
        {showForm && (
          <div className="glass-card rounded-2xl tilt-card overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Propose New Event</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input
                    placeholder="Enter event title"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.category}
                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    placeholder="Describe your event..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newEvent.startTime}
                      onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newEvent.endTime}
                      onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Venue *</label>
                  <input
                    placeholder="Event venue"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newEvent.venue}
                    onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="xl:col-span-1">
            <div className="glass-card rounded-2xl tilt-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <PartyPopper className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                    <p className="text-sm text-gray-500">{upcomingEvents.length} scheduled</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(event => (
                  <div key={event._id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Proposed Events */}
          <div className="xl:col-span-2">
            <div className="glass-card rounded-2xl tilt-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">My Proposed Events</h2>
                    <p className="text-sm text-gray-500">{events.length} total</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{approvedEvents} Approved</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">{pendingEvents} Pending</span>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading events...</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events.slice(0, 5).map(event => (
                      <div
                        key={event._id}
                        className={`p-5 rounded-xl border transition-all hover:shadow-md ${event.status === 'Approved' ? 'bg-green-50/50 border-green-200' :
                          event.status === 'Rejected' ? 'bg-red-50/50 border-red-200' :
                            'bg-yellow-50/50 border-yellow-200'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${event.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                                event.category === 'Cultural' ? 'bg-purple-100 text-purple-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>{event.category}</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.startTime} - {event.endTime}
                              </span>
                              <span>{event.venue}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${event.status === 'Approved' ? 'bg-green-100 text-green-700' :
                              event.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {event.status === 'Approved' && <CheckCircle className="w-4 h-4" />}
                              {event.status === 'Rejected' && <XCircle className="w-4 h-4" />}
                              {event.status === 'Pending' && <Clock className="w-4 h-4" />}
                              {event.status}
                            </span>
                            {event.adminComments && (
                              <p className="text-xs text-red-600 mt-2 max-w-[200px] bg-red-50 p-2 rounded-lg">
                                {event.adminComments}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold text-lg text-gray-900">No events proposed yet</p>
                    <p className="text-gray-500 mt-1">Click "Propose Event" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClubCoordinatorDashboard;
