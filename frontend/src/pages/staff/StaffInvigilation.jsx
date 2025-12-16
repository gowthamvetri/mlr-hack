import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyInvigilation } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
    Calendar, Building, Clock, CheckCircle, AlertCircle,
    MapPin, Users, ClipboardCheck
} from 'lucide-react';

const StaffInvigilation = () => {
    const user = useSelector(selectCurrentUser);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => {
        fetchAssignments();
    }, []);

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

    const filteredAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.date);
        assignmentDate.setHours(0, 0, 0, 0);

        if (filter === 'upcoming') {
            return assignmentDate >= today;
        } else if (filter === 'past') {
            return assignmentDate < today;
        }
        return true;
    });

    const upcomingCount = assignments.filter(a => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d >= today;
    }).length;

    const pastCount = assignments.length - upcomingCount;

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invigilation Duties</h1>
                        <p className="text-gray-500 mt-1 text-lg">
                            View your assigned exam invigilation schedule
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                            {upcomingCount} upcoming
                        </span>
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full font-semibold text-sm">
                            {pastCount} past
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 font-medium text-sm">Total Duties</p>
                                <p className="text-3xl font-bold mt-1"><AnimatedNumber value={assignments.length} /></p>
                            </div>
                            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                                <ClipboardCheck className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 tilt-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Upcoming</p>
                                <p className="text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={upcomingCount} /></p>
                            </div>
                            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 tilt-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Completed</p>
                                <p className="text-3xl font-bold text-gray-600 mt-1"><AnimatedNumber value={pastCount} /></p>
                            </div>
                            <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5 tilt-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">This Week</p>
                                <p className="text-3xl font-bold text-primary-600 mt-1">
                                    {assignments.filter(a => {
                                        const d = new Date(a.date);
                                        const weekEnd = new Date(today);
                                        weekEnd.setDate(weekEnd.getDate() + 7);
                                        return d >= today && d <= weekEnd;
                                    }).length}
                                </p>
                            </div>
                            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-primary-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {[
                        { key: 'upcoming', label: 'Upcoming' },
                        { key: 'past', label: 'Past' },
                        { key: 'all', label: 'All' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === tab.key
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-500">Loading assignments...</p>
                        </div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredAssignments.map((assignment, idx) => {
                                const assignmentDate = new Date(assignment.date);
                                const isToday = assignmentDate.toDateString() === today.toDateString();
                                const isPast = assignmentDate < today;

                                return (
                                    <div
                                        key={idx}
                                        className={`p-6 hover:bg-gray-50 transition-all ${isToday ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {isToday && (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                                                            TODAY
                                                        </span>
                                                    )}
                                                    {isPast && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">
                                                            COMPLETED
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${assignment.session === 'FN'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {assignment.session === 'FN' ? 'Morning' : 'Afternoon'}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {assignment.exam?.courseName || 'Exam'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {assignment.exam?.courseCode || 'N/A'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{assignmentDate.toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{assignment.exam?.startTime || '9:00'} - {assignment.exam?.endTime || '12:00'}</span>
                                                    </div>
                                                </div>

                                                <div className="text-center px-4 py-3 bg-primary-50 rounded-xl">
                                                    <div className="flex items-center gap-1 text-primary-600 font-bold">
                                                        <Building className="w-4 h-4" />
                                                        <span>Room {assignment.room?.roomNumber || 'TBD'}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <MapPin className="w-3 h-3 inline" /> {assignment.room?.building || 'Main Block'}
                                                    </div>
                                                </div>

                                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${assignment.status === 'Completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : assignment.status === 'Confirmed'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {assignment.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="font-semibold text-gray-800">No invigilation duties found</p>
                            <p className="text-sm text-gray-500">
                                {filter === 'upcoming' ? 'No upcoming duties assigned' : 'No past duties'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffInvigilation;
