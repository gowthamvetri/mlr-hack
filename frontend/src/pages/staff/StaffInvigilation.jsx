import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyInvigilation } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import {
    Calendar, Building, Clock, CheckCircle, AlertCircle,
    MapPin, ClipboardCheck, Loader
} from 'lucide-react';

// Animated counter
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        const duration = 500;
        const start = displayValue;
        const end = typeof value === 'number' ? value : parseInt(value) || 0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span className="tabular-nums">{displayValue}</span>;
};

const StaffInvigilation = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => { fetchAssignments(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
            gsap.fromTo('.assignment-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.2, ease: 'power2.out' });
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredAssignments = Array.isArray(assignments) ? assignments.filter(a => {
        const assignmentDate = new Date(a.date);
        assignmentDate.setHours(0, 0, 0, 0);
        if (filter === 'upcoming') return assignmentDate >= today;
        if (filter === 'past') return assignmentDate < today;
        return true;
    }) : [];

    const upcomingCount = Array.isArray(assignments) ? assignments.filter(a => { const d = new Date(a.date); d.setHours(0, 0, 0, 0); return d >= today; }).length : 0;
    const pastCount = Array.isArray(assignments) ? assignments.length - upcomingCount : 0;
    const thisWeekCount = Array.isArray(assignments) ? assignments.filter(a => { const d = new Date(a.date); const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7); return d >= today && d <= weekEnd; }).length : 0;

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Invigilation Duties</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">View your assigned exam invigilation schedule</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">{upcomingCount} upcoming</span>
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-medium border border-zinc-200">{pastCount} past</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="metric-card bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div><p className="text-blue-200 text-xs">Total Duties</p><p className="text-2xl font-semibold mt-1"><AnimatedNumber value={assignments.length} /></p></div>
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-white" /></div>
                        </div>
                    </div>
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div><p className="text-zinc-500 text-xs">Upcoming</p><p className="text-2xl font-semibold text-emerald-600 mt-1"><AnimatedNumber value={upcomingCount} /></p></div>
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-emerald-500" /></div>
                        </div>
                    </div>
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div><p className="text-zinc-500 text-xs">Completed</p><p className="text-2xl font-semibold text-zinc-600 mt-1"><AnimatedNumber value={pastCount} /></p></div>
                            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-zinc-500" /></div>
                        </div>
                    </div>
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div><p className="text-zinc-500 text-xs">This Week</p><p className="text-2xl font-semibold text-violet-600 mt-1"><AnimatedNumber value={thisWeekCount} /></p></div>
                            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-violet-500" /></div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {[{ key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }, { key: 'all', label: 'All' }].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48"><Loader className="w-6 h-6 text-violet-500 animate-spin" /></div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="divide-y divide-zinc-50">
                            {filteredAssignments.map((assignment, idx) => {
                                const assignmentDate = new Date(assignment.date);
                                const isToday = assignmentDate.toDateString() === today.toDateString();
                                const isPast = assignmentDate < today;
                                return (
                                    <div key={idx} className={`assignment-item p-5 hover:bg-zinc-50/50 transition-colors ${isToday ? 'bg-amber-50/50 border-l-2 border-l-amber-400' : ''}`}>
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {isToday && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-200">TODAY</span>}
                                                    {isPast && <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold border border-zinc-200">COMPLETED</span>}
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${assignment.session === 'FN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100'}`}>
                                                        {assignment.session === 'FN' ? 'Morning' : 'Afternoon'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-zinc-900">{assignment.exam?.courseName || 'Exam'}</h3>
                                                <p className="text-xs text-zinc-500">{assignment.exam?.courseCode || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-zinc-500 text-xs"><Calendar className="w-3.5 h-3.5" /><span>{assignmentDate.toLocaleDateString()}</span></div>
                                                    <div className="flex items-center gap-1 text-zinc-500 text-xs mt-1"><Clock className="w-3.5 h-3.5" /><span>{assignment.exam?.startTime || '9:00'} - {assignment.exam?.endTime || '12:00'}</span></div>
                                                </div>
                                                <div className="text-center px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
                                                    <div className="flex items-center gap-1 text-violet-700 font-semibold text-xs"><Building className="w-3.5 h-3.5" /><span>Room {assignment.room?.roomNumber || 'TBD'}</span></div>
                                                    <div className="text-[10px] text-zinc-500 mt-0.5"><MapPin className="w-3 h-3 inline" /> {assignment.room?.building || 'Main Block'}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${assignment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : assignment.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                    {assignment.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-zinc-400" /></div>
                            <p className="font-medium text-zinc-900 text-sm">No Invigilation Duties</p>
                            <p className="text-xs text-zinc-500 mt-1">{filter === 'upcoming' ? 'No upcoming duties assigned' : 'No past duties'}</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffInvigilation;
