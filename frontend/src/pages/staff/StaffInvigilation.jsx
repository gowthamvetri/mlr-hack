import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyInvigilation } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import {
    Calendar, Building, Clock, CheckCircle, AlertCircle,
    MapPin, ClipboardCheck, RefreshCw, ArrowUpRight, CalendarDays, Users
} from 'lucide-react';

// Premium Animated Counter
const AnimatedNumber = ({ value, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);
    useEffect(() => {
        const duration = 600;
        const start = prevValue.current;
        const end = typeof value === 'number' ? value : parseInt(value) || 0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(start + (end - start) * eased));
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
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-zinc-100" />
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

const StaffInvigilation = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => { fetchAssignments(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.hero-section', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
            gsap.fromTo('.metric-card', { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, delay: 0.15, ease: 'power2.out' });
            gsap.fromTo('.filter-bar', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.25, ease: 'power2.out' });
            gsap.fromTo('.assignment-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.35, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const { data } = await getMyInvigilation();
            setAssignments(data || []);
        } catch (err) {
            console.error('Error fetching invigilation duties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAssignments();
        setTimeout(() => setRefreshing(false), 400);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredAssignments = Array.isArray(assignments) ? assignments.filter(a => {
        const assignmentDate = new Date(a.date);
        assignmentDate.setHours(0, 0, 0, 0);
        if (filter === 'upcoming') return assignmentDate >= today;
        if (filter === 'past') return assignmentDate < today;
        return true;
    }) : [];

    const upcomingCount = assignments.filter(a => { const d = new Date(a.date); d.setHours(0, 0, 0, 0); return d >= today; }).length;
    const pastCount = assignments.length - upcomingCount;
    const thisWeekCount = assignments.filter(a => { const d = new Date(a.date); const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7); return d >= today && d <= weekEnd; }).length;

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Hero Section */}
                <div className="hero-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 lg:p-8">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                {todaysAssignment && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[11px] font-medium animate-pulse">
                                        <AlertCircle className="w-3 h-3" />
                                        Duty Today
                                    </span>
                                )}
                                {upcomingCount > 0 && !todaysAssignment && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-medium">
                                        <Calendar className="w-3 h-3" />
                                        {upcomingCount} upcoming
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl lg:text-2xl font-semibold text-white mb-1.5 tracking-tight">
                                Invigilation Duties
                            </h1>
                            <p className="text-white/50 text-sm">
                                View your assigned exam schedule • {assignments.length} total assignments
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button onClick={handleRefresh} disabled={refreshing}
                                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white/80 bg-white/10 hover:bg-white/15 rounded-lg transition-all disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                <ClipboardCheck className="w-4.5 h-4.5 text-blue-500" strokeWidth={1.5} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Duties</p>
                        <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={assignments.length} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-50">
                            <p className="text-[10px] text-zinc-400">All time assignments</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-emerald-200 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Calendar className="w-4.5 h-4.5 text-emerald-500" strokeWidth={1.5} />
                            </div>
                            <RadialProgress value={assignments.length > 0 ? Math.round((upcomingCount / assignments.length) * 100) : 0} color="#10b981" />
                        </div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Upcoming</p>
                        <p className="text-2xl font-semibold text-emerald-600"><AnimatedNumber value={upcomingCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-50">
                            <p className="text-[10px] text-zinc-400">Scheduled duties</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                                <CheckCircle className="w-4.5 h-4.5 text-zinc-500" strokeWidth={1.5} />
                            </div>
                            <RadialProgress value={completionRate} color="#71717a" />
                        </div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Completed</p>
                        <p className="text-2xl font-semibold text-zinc-600"><AnimatedNumber value={pastCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-50">
                            <p className="text-[10px] text-zinc-400">Past duties</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-violet-200 hover:shadow-sm transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                                <Clock className="w-4.5 h-4.5 text-violet-500" strokeWidth={1.5} />
                            </div>
                            {thisWeekCount > 0 && (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-bold">This Week</span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">This Week</p>
                        <p className="text-2xl font-semibold text-violet-600"><AnimatedNumber value={thisWeekCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-50">
                            <p className="text-[10px] text-zinc-400">Next 7 days</p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-bar flex gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
                    {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Completed' }, { key: 'all', label: 'All' }].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filter === tab.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="divide-y divide-zinc-50">
                            {filteredAssignments.map((assignment, idx) => {
                                const assignmentDate = new Date(assignment.date);
                                const isToday = assignmentDate.toDateString() === today.toDateString();
                                const isPast = assignmentDate < today;
                                return (
                                    <div key={idx} className={`assignment-item p-5 hover:bg-zinc-50/50 transition-colors ${isToday ? 'bg-gradient-to-r from-amber-50/80 to-white border-l-4 border-l-amber-400' : ''}`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    {isToday && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-200 animate-pulse">
                                                            TODAY
                                                        </span>
                                                    )}
                                                    {isPast && (
                                                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold border border-zinc-200">
                                                            COMPLETED
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${assignment.session === 'FN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100'}`}>
                                                        {assignment.session === 'FN' ? 'Morning' : 'Afternoon'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-zinc-900">{assignment.exam?.courseName || 'Exam'}</h3>
                                                <p className="text-xs text-zinc-500">{assignment.exam?.courseCode || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div className="text-right min-w-[100px]">
                                                    <div className="flex items-center gap-1.5 text-zinc-600 text-xs justify-end">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        <span className="font-medium">{assignmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-1 justify-end">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{assignment.exam?.startTime || '9:00'} - {assignment.exam?.endTime || '12:00'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center px-4 py-2.5 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl border border-violet-100">
                                                    <div className="flex items-center gap-1.5 text-violet-700 font-bold text-xs">
                                                        <Building className="w-4 h-4" />
                                                        <span>Room {assignment.room?.roomNumber || 'TBD'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />{assignment.room?.building || 'Main Block'}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${assignment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : assignment.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    {assignment.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-7 h-7 text-zinc-400" />
                            </div>
                            <h3 className="font-medium text-zinc-900 text-sm mb-1">No Invigilation Duties</h3>
                            <p className="text-xs text-zinc-500">{filter === 'upcoming' ? 'No upcoming duties assigned' : filter === 'past' ? 'No completed duties' : 'No duties found'}</p>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                {filteredAssignments.length > 0 && (
                    <div className="text-center">
                        <p className="text-xs text-zinc-500">
                            Showing <span className="font-medium text-zinc-700">{filteredAssignments.length}</span> of <span className="font-medium text-zinc-700">{assignments.length}</span> assignments
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StaffInvigilation;
