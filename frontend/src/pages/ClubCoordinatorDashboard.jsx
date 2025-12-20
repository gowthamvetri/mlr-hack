import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { createEvent, getEvents, getClubProfile, updateClubProfile } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import AnimatedNumber from '../components/AnimatedNumber';
import gsap from 'gsap';
import {
  Calendar, CheckCircle, Clock, XCircle, Plus, X, Send, Users, Building, Mail,
  Sparkles, PartyPopper, CalendarDays, Edit
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
      <div ref={pageRef} className="space-y-6 sm:space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Club Dashboard</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Welcome back, {user?.name || 'Coordinator'}! Manage your club events.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowForm(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 transition-all shadow-sm"
            >
              <Building className="w-4 h-4" />
              Club Profile
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowProfile(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${showForm
                ? 'bg-zinc-100 text-zinc-700'
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
                }`}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Close' : 'Propose Event'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Events</p>
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
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Approved</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1"><AnimatedNumber value={approvedEvents} /></p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1"><AnimatedNumber value={pendingEvents} /></p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1"><AnimatedNumber value={rejectedEvents} /></p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Club Profile Section */}
        {showProfile && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
                  <Building className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Manage Club Profile</h2>
              </div>
              <button onClick={() => setShowProfile(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Club Name</label>
                  <input
                    placeholder="Enter club name"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={profile.clubName}
                    onChange={e => setProfile({ ...profile, clubName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tagline</label>
                  <input
                    placeholder="Short tagline for your club"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={profile.tagline}
                    onChange={e => setProfile({ ...profile, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Contact Email</label>
                  <input
                    placeholder="club@example.com"
                    type="email"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={profile.contactEmail}
                    onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                  <textarea
                    placeholder="Brief description of your club"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm resize-none"
                    value={profile.description}
                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-violet-200 active:scale-95 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Save Profile
              </button>
            </form>
          </div>
        )}

        {/* Event Proposal Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Propose New Event</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Event Title *</label>
                  <input
                    placeholder="Enter event title"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label>
                  <select
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.category}
                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description *</label>
                  <textarea
                    placeholder="Describe your event..."
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm resize-none"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Time *</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      value={newEvent.startTime}
                      onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">End Time *</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      value={newEvent.endTime}
                      onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Venue *</label>
                  <input
                    placeholder="Event venue"
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                    value={newEvent.venue}
                    onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50 text-sm"
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
              <div className="p-5 border-b border-zinc-100 bg-zinc-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <PartyPopper className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">Upcoming Events</h2>
                    <p className="text-xs text-zinc-500">{upcomingEvents.length} scheduled</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(event => (
                  <div key={event._id} className="p-3 bg-white hover:bg-zinc-50 rounded-lg border border-zinc-100 transition-colors">
                    <h4 className="font-semibold text-zinc-900 text-sm">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-zinc-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Proposed Events */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
                    <Calendar className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">My Proposed Events</h2>
                    <p className="text-xs text-zinc-500">{events.length} total</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">{approvedEvents} Approved</span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">{pendingEvents} Pending</span>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Loading events...</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events.slice(0, 5).map(event => (
                      <div
                        key={event._id}
                        className={`p-4 rounded-xl border transition-all hover:bg-white hover:shadow-sm ${event.status === 'Approved' ? 'bg-emerald-50/30 border-emerald-100' :
                          event.status === 'Rejected' ? 'bg-red-50/30 border-red-100' :
                            'bg-amber-50/30 border-amber-100'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="font-semibold text-base text-zinc-900">{event.title}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${event.category === 'Technical' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                event.category === 'Cultural' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                  'bg-orange-50 text-orange-700 border border-orange-100'
                                }`}>{event.category}</span>
                            </div>
                            <p className="text-zinc-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {event.startTime} - {event.endTime}
                              </span>
                              <span>{event.venue}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${event.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              event.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                              {event.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
                              {event.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                              {event.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                              {event.status}
                            </span>
                            {event.adminComments && (
                              <p className="text-[10px] text-red-600 mt-2 max-w-[200px] bg-red-50 p-2 rounded border border-red-100">
                                <span className="font-semibold">Admin:</span> {event.adminComments}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    <p className="font-medium text-zinc-900">No events proposed yet</p>
                    <p className="text-zinc-500 text-sm mt-0.5">Click "Propose Event" to get started</p>
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
