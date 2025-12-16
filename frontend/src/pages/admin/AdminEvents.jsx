import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getEvents, updateEventStatus } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Check, X, Clock, Search, Filter, Users, MapPin, AlertTriangle } from 'lucide-react';

const AdminEvents = () => {
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateEventStatus(id, { status: 'Approved', adminComments: 'Approved by Admin' });
      fetchEvents();
    } catch (error) {
      alert('Error approving event');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await updateEventStatus(id, { status: 'Rejected', adminComments: reason });
      fetchEvents();
    } catch (error) {
      alert('Error rejecting event');
    }
  };

  const statuses = ['all', 'Pending', 'Approved', 'Rejected'];
  const categories = ['all', 'Technical', 'Cultural', 'Sports'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
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
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Event Management</h1>
        <p className="text-sm sm:text-base text-gray-500">Review and manage club event proposals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="glass-card rounded-xl tilt-card p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{events.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Events</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl tilt-card p-4">
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
        <div className="glass-card rounded-xl tilt-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl tilt-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass-card rounded-xl tilt-card p-6 mb-6">
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
          <div className="flex items-center gap-4">
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
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Events Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            You have <strong>{pendingCount}</strong> event{pendingCount > 1 ? 's' : ''} pending approval.
          </p>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map(event => (
          <div key={event._id} className="glass-card rounded-xl tilt-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString()}
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {event.coordinator?.name || 'Unknown'} • {event.clubName}
                  </span>
                </div>

                {event.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(event._id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(event._id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {event.adminComments && event.status === 'Rejected' && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                    {event.adminComments}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="glass-card rounded-xl tilt-card p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No events found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminEvents;
