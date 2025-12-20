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

    const todaysAssignment = assignments.find(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    const completionRate = assignments.length > 0 ? Math.round((pastCount / assignments.length) * 100) : 0;


    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6 text-zinc-900">
                {/* Hero Section */}
                <div className="hero-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 lg:p-8 border border-zinc-200 shadow-sm">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                {todaysAssignment && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100 animate-pulse">
                                        <AlertCircle className="w-3 h-3" />
                                        Duty Today
                                    </span>
                                )}
                                {upcomingCount > 0 && !todaysAssignment && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold border border-blue-100">
                                        <Calendar className="w-3 h-3" />
                                        {upcomingCount} upcoming
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 mb-1.5 tracking-tight">
                                Invigilation Duties
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                View your assigned exam schedule • {assignments.length} total assignments
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button onClick={handleRefresh} disabled={refreshing}
                                className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-all disabled:opacity-50 shadow-sm">
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <ClipboardCheck className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                                <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Total Duties</p>
                        <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={assignments.length} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">All time assignments</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <Calendar className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
                            </div>
                            <RadialProgress value={assignments.length > 0 ? Math.round((upcomingCount / assignments.length) * 100) : 0} color="#10b981" />
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Upcoming</p>
                        <p className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={upcomingCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Scheduled duties</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                <CheckCircle className="w-4.5 h-4.5 text-zinc-500" strokeWidth={2} />
                            </div>
                            <RadialProgress value={completionRate} color="#71717a" />
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Completed</p>
                        <p className="text-2xl font-bold text-zinc-600"><AnimatedNumber value={pastCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Past duties</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                <Clock className="w-4.5 h-4.5 text-violet-600" strokeWidth={2} />
                            </div>
                            {thisWeekCount > 0 && (
                                <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-bold border border-violet-100">This Week</span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">This Week</p>
                        <p className="text-2xl font-bold text-violet-600"><AnimatedNumber value={thisWeekCount} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Next 7 days</p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-bar flex gap-2 bg-zinc-100 border border-zinc-200 p-1 rounded-xl w-fit">
                    {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Completed' }, { key: 'all', label: 'All' }].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                        </div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="divide-y divide-zinc-100">
                            {filteredAssignments.map((assignment, idx) => {
                                const assignmentDate = new Date(assignment.date);
                                const isToday = assignmentDate.toDateString() === today.toDateString();
                                const isPast = assignmentDate < today;
                                return (
                                    <div key={idx} className={`assignment-item p-5 hover:bg-zinc-50 transition-colors ${isToday ? 'bg-gradient-to-r from-amber-50 to-transparent border-l-4 border-l-amber-500' : ''}`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    {isToday && (
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-100 animate-pulse">
                                                            TODAY
                                                        </span>
                                                    )}
                                                    {isPast && (
                                                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold border border-zinc-200">
                                                            COMPLETED
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${assignment.session === 'FN' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>
                                                        {assignment.session === 'FN' ? 'Morning' : 'Afternoon'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-zinc-900">{assignment.exam?.courseName || 'Exam'}</h3>
                                                <p className="text-xs text-zinc-500 font-medium">{assignment.exam?.courseCode || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div className="text-right min-w-[100px]">
                                                    <div className="flex items-center gap-1.5 text-zinc-600 text-xs justify-end font-bold">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        <span>{assignmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-1 justify-end font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{assignment.exam?.startTime || '9:00'} - {assignment.exam?.endTime || '12:00'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                                                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
                                                        <Building className="w-4 h-4" />
                                                        <span>Room {assignment.room?.roomNumber || 'TBD'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                                                        <MapPin className="w-3 h-3" />{assignment.room?.building || 'Main Block'}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${assignment.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : assignment.status === 'Confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
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
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                <Calendar className="w-7 h-7 text-zinc-300" />
                            </div>
                            <h3 className="font-bold text-zinc-900 text-sm mb-1">No Invigilation Duties</h3>
                            <p className="text-xs text-zinc-500 font-medium">{filter === 'upcoming' ? 'No upcoming duties assigned' : filter === 'past' ? 'No completed duties' : 'No duties found'}</p>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                {filteredAssignments.length > 0 && (
                    <div className="text-center">
                        <p className="text-xs text-zinc-400 font-bold">
                            Showing <span className="text-zinc-600">{filteredAssignments.length}</span> of <span className="text-zinc-600">{assignments.length}</span> assignments
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StaffInvigilation;
