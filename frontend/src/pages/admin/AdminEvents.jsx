import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getEvents, updateEventStatus } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Calendar, Check, X, Clock, Search, Users, MapPin, AlertTriangle,
  ArrowUpRight, Laptop, Music, Trophy, PartyPopper, Sparkles, RefreshCw, Filter
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

// Radial Progress
const RadialProgress = ({ value, size = 44, thickness = 4, color = '#8b5cf6' }) => {
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-dark-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

// Skeleton
const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 rounded ${className}`} />
);

const AdminEvents = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  // Premium GSAP Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-section', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo('.insight-panel', { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.15 });
      gsap.fromTo('.filter-bar', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.3 });
      gsap.fromTo('.event-item', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.4 });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  const fetchEvents = async () => {
    try {
      const { data } = await getEvents();
      // Ensure events is always an array
      setEvents(Array.isArray(data) ? data : (data?.events || []));
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchEvents(); setTimeout(() => setRefreshing(false), 400); };

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

  // Category distribution
  const categoryDist = categories.slice(1).map(cat => ({
    name: cat, count: events.filter(e => e.category === cat).length
  }));

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
          <SkeletonPulse className="h-24 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonPulse key={i} className="h-32 rounded-xl" />)}
          </div>
          <SkeletonPulse className="h-16 rounded-xl" />
          {[1, 2, 3].map(i => <SkeletonPulse key={i} className="h-24 rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

        {/* ================================================================
            HERO SECTION - Primary insight with pending alert
            ================================================================ */}
        <div className="hero-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-medium animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {pendingCount} pending
                  </span>
                )}
              </div>

              <h1 className="text-xl lg:text-2xl font-semibold text-white mb-1.5 tracking-tight">
                {events.length} Club Events
              </h1>
              <p className="text-white/50 text-sm">
                {approvedCount} approved • {pendingCount} pending review • {rejectedCount} rejected
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button onClick={handleRefresh} disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white/80 bg-white/10 hover:bg-white/15 rounded-lg transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {pendingCount > 0 && (
                <button onClick={() => setFilterStatus('Pending')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-lg shadow-amber-500/20">
                  <Clock className="w-4 h-4" />
                  Review {pendingCount} Pending
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================
            INSIGHTS ROW - Status & Category overview
            ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="insight-panel glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-dark-300" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>+5</span>
              </div>
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Events</p>
            <p className="text-2xl font-semibold text-white"><AnimatedNumber value={events.length} /></p>
            <div className="mt-3 pt-3 border-t border-dark-700 flex gap-1.5">
              {categoryDist.map((cat, i) => (
                <span key={cat.name} className="text-[9px] text-dark-400 bg-dark-700 px-1.5 py-0.5 rounded">
                  {cat.name}: {cat.count}
                </span>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div className="insight-panel glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-amber-500/30 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <RadialProgress value={events.length > 0 ? Math.round((pendingCount / events.length) * 100) : 0} color="#f59e0b" />
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-semibold text-amber-400"><AnimatedNumber value={pendingCount} /></p>
            <div className="mt-3 pt-3 border-t border-dark-700">
              {pendingCount > 0 ? (
                <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded animate-pulse border border-amber-500/20">Needs Review</span>
              ) : (
                <span className="text-xs text-dark-400">All caught up!</span>
              )}
            </div>
          </div>

          {/* Approved */}
          <div className="insight-panel glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-emerald-500/30 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <RadialProgress value={events.length > 0 ? Math.round((approvedCount / events.length) * 100) : 0} color="#10b981" />
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Approved</p>
            <p className="text-2xl font-semibold text-emerald-400"><AnimatedNumber value={approvedCount} /></p>
            <div className="mt-3 pt-3 border-t border-dark-700 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs text-dark-400">Live events</span>
            </div>
          </div>

          {/* Rejected */}
          <div className="insight-panel glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-red-500/30 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X className="w-4.5 h-4.5 text-red-400" />
              </div>
              <RadialProgress value={events.length > 0 ? Math.round((rejectedCount / events.length) * 100) : 0} color="#ef4444" />
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Rejected</p>
            <p className="text-2xl font-semibold text-red-400"><AnimatedNumber value={rejectedCount} /></p>
            <div className="mt-3 pt-3 border-t border-dark-700">
              <span className="text-xs text-dark-400">Not approved</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar glass-card-dark rounded-xl border border-dark-700 p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" strokeWidth={1.5} />
              <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-white placeholder-dark-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-dark-700 rounded transition-colors">
                  <X className="w-3.5 h-3.5 text-dark-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-dark-700">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wide mr-1">Status</span>
            {statuses.map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'}`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
            <div className="w-px h-5 bg-dark-700 mx-1" />
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wide mr-1">Category</span>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterCategory === c ? 'bg-violet-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'}`}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 rounded-full transition-colors ml-auto border border-violet-500/20">
                <X className="w-3 h-3" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Events List */}
        {
          loading ? (
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
          )
        }

        {/* Results Count */}
        {
          filteredEvents.length > 0 && (
            <div className="text-center">
              <p className="text-xs text-zinc-500">
                Showing <span className="font-medium text-zinc-700">{filteredEvents.length}</span> of <span className="font-medium text-zinc-700">{events.length}</span> events
              </p>
            </div>
          )
        }
      </div >
    </DashboardLayout >
  );
};

export default AdminEvents;
