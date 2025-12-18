import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getEvents, updateEventStatus } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Calendar, Check, X, Clock, Search, Users, MapPin, AlertTriangle,
  ArrowUpRight, Laptop, Music, Trophy, PartyPopper
} from 'lucide-react';
import gsap from 'gsap';

// Premium Animated Counter
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const duration = 600;
    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newVal = start + (end - start) * eased;
      setDisplayValue(Math.round(newVal));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums tracking-tight">{displayValue}{suffix}</span>;
};

// Minimal Progress Ring
const ProgressRing = ({ percentage, size = 40, strokeWidth = 3, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold text-zinc-600">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton Components
const SkeletonCard = () => (
  <div className="rounded-xl p-5 bg-white border border-zinc-100">
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="w-9 h-9 bg-zinc-100 rounded-lg" />
        <div className="w-16 h-5 bg-zinc-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-zinc-100 rounded" />
        <div className="h-8 w-14 bg-zinc-100 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonEventCard = () => (
  <div className="rounded-xl p-5 bg-white border border-zinc-100">
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-zinc-100 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-zinc-100 rounded" />
          <div className="h-3 w-24 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-100 rounded" />
        <div className="h-3 w-2/3 bg-zinc-100 rounded" />
      </div>
    </div>
  </div>
);

const AdminEvents = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => { fetchEvents(); }, []);

  // Refined GSAP Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        gsap.fromTo('.filter-bar', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.2, ease: 'power2.out' });
        gsap.fromTo('.event-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.25, ease: 'power2.out' });
      }, pageRef);
      return () => ctx.revert();
    }, 50);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchEvents = async () => {
    try {
      const { data } = await getEvents();
      setEvents(data || []);
    } catch (error) {
      setEvents([]);
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
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingCount = events.filter(e => e.status === 'Pending').length;
  const approvedCount = events.filter(e => e.status === 'Approved').length;
  const rejectedCount = events.filter(e => e.status === 'Rejected').length;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Technical': return Laptop;
      case 'Cultural': return Music;
      case 'Sports': return Trophy;
      default: return PartyPopper;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'from-blue-500 to-blue-600';
      case 'Cultural': return 'from-purple-500 to-purple-600';
      case 'Sports': return 'from-orange-500 to-orange-600';
      default: return 'from-zinc-500 to-zinc-600';
    }
  };

  const clearFilters = () => { setSearchQuery(''); setFilterStatus('all'); setFilterCategory('all'); };
  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterCategory !== 'all';

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* Premium Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Event Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Review and manage club event proposals</p>
          </div>
        </div>

        {/* Pending Alert Banner */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800 text-sm">Action Required</p>
              <p className="text-amber-700 text-xs">{pendingCount} event{pendingCount > 1 ? 's' : ''} awaiting your approval</p>
            </div>
            <button onClick={() => setFilterStatus('Pending')} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
              Review Now
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              {/* Total Events */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5 text-zinc-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>5</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Events</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={events.length} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex gap-2">
                    {categories.slice(1).map((cat) => {
                      const count = events.filter(e => e.category === cat).length;
                      return (
                        <span key={cat} className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {cat}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="w-4.5 h-4.5 text-amber-500" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={events.length > 0 ? Math.round((pendingCount / events.length) * 100) : 0} color="#f59e0b" />
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Pending Review</p>
                <p className="text-2xl font-semibold text-amber-600"><AnimatedNumber value={pendingCount} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Awaiting action</span>
                    {pendingCount > 0 && (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded animate-pulse">
                        ACTION
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Approved */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Check className="w-4.5 h-4.5 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={events.length > 0 ? Math.round((approvedCount / events.length) * 100) : 0} color="#10b981" />
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Approved</p>
                <p className="text-2xl font-semibold text-emerald-600"><AnimatedNumber value={approvedCount} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-zinc-500">Live events</span>
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <X className="w-4.5 h-4.5 text-red-500" strokeWidth={1.5} />
                  </div>
                  <ProgressRing percentage={events.length > 0 ? Math.round((rejectedCount / events.length) * 100) : 0} color="#ef4444" />
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Rejected</p>
                <p className="text-2xl font-semibold text-red-600"><AnimatedNumber value={rejectedCount} /></p>
                <div className="mt-4 pt-3 border-t border-zinc-50">
                  <span className="text-xs text-zinc-500">Not approved</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Bar */}
        <div className="filter-bar bg-white rounded-xl border border-zinc-100 p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" strokeWidth={1.5} />
              <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all text-zinc-700 placeholder-zinc-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-200 rounded transition-colors">
                  <X className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-50">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mr-1">Status</span>
            {statuses.map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterStatus === s ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
            <div className="w-px h-5 bg-zinc-200 mx-1" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mr-1">Category</span>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterCategory === c ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full transition-colors ml-auto">
                <X className="w-3 h-3" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonEventCard key={i} />)}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.length > 0 ? filteredEvents.map((event) => {
              const CategoryIcon = getCategoryIcon(event.category);
              const categoryColor = getCategoryColor(event.category);

              return (
                <div key={event._id} className="event-item group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Event Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 bg-gradient-to-br ${categoryColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-zinc-900 text-sm group-hover:text-violet-600 transition-colors truncate">{event.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${event.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                              event.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                                'bg-red-50 text-red-700'
                            }`}>
                            <span className={`w-1 h-1 rounded-full ${event.status === 'Pending' ? 'bg-amber-500' :
                                event.status === 'Approved' ? 'bg-emerald-500' :
                                  'bg-red-500'
                              }`} />
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                              {event.time}
                            </span>
                          )}
                          {event.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                              {event.venue}
                            </span>
                          )}
                          {event.expectedParticipants > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                              {event.expectedParticipants} expected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {event.status === 'Pending' && (
                      <div className="flex items-center gap-2 lg:ml-4">
                        <button onClick={() => handleApprove(event._id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button onClick={() => handleReject(event._id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    {event.status !== 'Pending' && event.adminComments && (
                      <div className="lg:ml-4 px-3 py-2 bg-zinc-50 rounded-lg max-w-xs">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Admin Note</p>
                        <p className="text-xs text-zinc-600">{event.adminComments}</p>
                      </div>
                    )}
                  </div>

                  {/* Coordinator */}
                  {event.coordinator && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-medium">
                            {event.coordinator.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-700">{event.coordinator.name}</p>
                          <p className="text-[10px] text-zinc-400">{event.coordinator.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-16 bg-white rounded-xl border border-zinc-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-zinc-700 mb-1">No events found</h3>
                <p className="text-xs text-zinc-500 mb-4">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                    <X className="w-3 h-3" />Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {filteredEvents.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-700">{filteredEvents.length}</span> of <span className="font-medium text-zinc-700">{events.length}</span> events
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminEvents;
