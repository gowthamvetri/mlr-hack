import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { createEvent, getEvents, getClubProfile, updateClubProfile } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { Calendar, CheckCircle, Clock, XCircle, Plus, X, Send, Users, Building, Mail } from 'lucide-react';

const ClubCoordinatorDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '', venue: '', clubName: user?.clubName || 'Tech Club'
  });
  const [profile, setProfile] = useState({
    clubName: user?.clubName || '', tagline: '', description: '', contactEmail: ''
  });

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
      const { data } = await getEvents();
      setEvents(data.filter(e => e.coordinator?._id === user._id || e.coordinator === user._id));
    } catch (error) {
      console.error(error);
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
      fetchMyEvents();
      alert('Event proposed successfully!');
    } catch (error) {
      alert('Error proposing event');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateClubProfile(profile);
      alert('Club profile updated!');
      setShowProfile(false);
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const approvedEvents = events.filter(e => e.status === 'Approved').length;
  const pendingEvents = events.filter(e => e.status === 'Pending').length;
  const rejectedEvents = events.filter(e => e.status === 'Rejected').length;

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      {/* Club Profile Section */}
      {showProfile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Manage Club Profile</h2>
            </div>
            <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                <input
                  placeholder="Enter club name"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={profile.clubName}
                  onChange={e => setProfile({ ...profile, clubName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  placeholder="Short tagline for your club"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={profile.tagline}
                  onChange={e => setProfile({ ...profile, tagline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  placeholder="club@example.com"
                  type="email"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={profile.contactEmail}
                  onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of your club"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={profile.description}
                  onChange={e => setProfile({ ...profile, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Save Profile
            </button>
          </form>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Events"
          value={events.length}
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Approved"
          value={approvedEvents}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={pendingEvents}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Rejected"
          value={rejectedEvents}
          icon={XCircle}
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${showForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Close Form' : 'Propose New Event'}
        </button>
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <Building className="w-5 h-5" />
          {showProfile ? 'Hide Profile' : 'Club Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Event Form */}
        {showForm && (
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Event Proposal</h2>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    placeholder="Enter event title"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe your event"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    value={newEvent.category}
                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={newEvent.startTime}
                      onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={newEvent.endTime}
                      onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    placeholder="Event venue"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={newEvent.venue}
                    onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Submit Proposal
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">My Proposed Events</h2>
                    <p className="text-sm text-gray-500">{events.length} total events</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {approvedEvents} Approved
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {pendingEvents} Pending
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {events.map(event => (
                  <div
                    key={event._id}
                    className={`p-5 rounded-xl border transition-colors ${event.status === 'Approved' ? 'bg-green-50 border-green-100' :
                        event.status === 'Rejected' ? 'bg-red-50 border-red-100' :
                          'bg-yellow-50 border-yellow-100'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                              event.category === 'Cultural' ? 'bg-purple-100 text-purple-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                            {event.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
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
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${event.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            event.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {event.status === 'Approved' && <CheckCircle className="w-4 h-4" />}
                          {event.status === 'Rejected' && <XCircle className="w-4 h-4" />}
                          {event.status === 'Pending' && <Clock className="w-4 h-4" />}
                          {event.status}
                        </span>
                        {event.adminComments && (
                          <p className="text-xs text-red-600 mt-2 max-w-[200px] bg-red-50 p-2 rounded">
                            {event.adminComments}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-lg">No events proposed yet</p>
                    <p className="text-sm">Click "Propose New Event" to get started</p>
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
