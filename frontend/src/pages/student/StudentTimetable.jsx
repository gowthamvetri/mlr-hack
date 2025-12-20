import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyTimetable } from '../../utils/api';
import { Calendar, Clock, BookOpen, Users, Building, RefreshCw, Download, MapPin } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const StudentTimetable = () => {
    const user = useSelector(selectCurrentUser);
    const [loading, setLoading] = useState(true);
    const [timetable, setTimetable] = useState(null);
    const [selectedDay, setSelectedDay] = useState(getCurrentDay());

    function getCurrentDay() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        return DAYS.includes(today) ? today : 'Monday';
    }

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const { data } = await getMyTimetable();
            setTimetable(data);
        } catch (error) {
            console.error('Error fetching timetable:', error);
            setTimetable(null);
        } finally {
            setLoading(false);
        }
    };

    const getSlotColor = (type) => {
        const colors = {
            Lecture: 'bg-blue-50 border-blue-200',
            Lab: 'bg-emerald-50 border-emerald-200',
            Tutorial: 'bg-amber-50 border-amber-200',
            Break: 'bg-zinc-100 border-zinc-200',
            Free: 'bg-zinc-50 border-zinc-200 border-dashed'
        };
        return colors[type] || colors.Lecture;
    };

    const getSlotTextColor = (type) => {
        const colors = {
            Lecture: 'text-blue-600',
            Lab: 'text-emerald-600',
            Tutorial: 'text-amber-600',
            Break: 'text-zinc-500',
            Free: 'text-zinc-400'
        };
        return colors[type] || colors.Lecture;
    };

    const getTypeIcon = (type) => {
        const icons = {
            Lecture: '📚',
            Lab: '🔬',
            Tutorial: '✏️',
            Break: '☕',
            Free: '🕐'
        };
        return icons[type] || '📚';
    };

    const getSlotsForDay = (day) => {
        if (!timetable?.slots) return [];
        return timetable.slots
            .filter(s => s.day === day)
            .sort((a, b) => a.period - b.period);
    };

    const getAllPeriods = () => {
        if (!timetable?.slots) return [];
        const periods = [...new Set(timetable.slots.map(s => s.period))].sort((a, b) => a - b);
        return periods.map(p => {
            const slot = timetable.slots.find(s => s.period === p);
            return {
                num: p,
                start: slot?.startTime || '',
                end: slot?.endTime || ''
            };
        });
    };

    const getTodaysClasses = () => {
        const today = getCurrentDay();
        return getSlotsForDay(today).filter(s => s.type !== 'Free' && s.type !== 'Break');
    };

    const isToday = (day) => day === getCurrentDay();

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Timetable</h1>
                        <p className="text-zinc-500 mt-1 text-sm">
                            {timetable ? `${timetable.department} - Year ${timetable.year} - Section ${timetable.section || 'A'}` : 'View your class schedule'}
                        </p>
                    </div>
                    <button
                        onClick={fetchTimetable}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-xl font-medium transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500">Loading your timetable...</p>
                    </div>
                ) : !timetable ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">No Timetable Available</h2>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Your department hasn't published a timetable for your year yet. Please check back later or contact your department.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Today's Quick View */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">Today's Classes</h2>
                                    <p className="text-sm text-zinc-500">{getCurrentDay()}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>

                            {getTodaysClasses().length === 0 ? (
                                <div className="bg-zinc-50 rounded-xl p-6 text-center">
                                    <p className="text-zinc-500">No classes scheduled for today 🎉</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {getTodaysClasses().map((slot, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border ${getSlotColor(slot.type)}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`text-xs font-bold ${getSlotTextColor(slot.type)}`}>
                                                    {slot.startTime} - {slot.endTime}
                                                </span>
                                                <span className="text-lg">{getTypeIcon(slot.type)}</span>
                                            </div>
                                            <h3 className="font-bold text-zinc-900 text-sm mb-1 line-clamp-1">{slot.subjectName}</h3>
                                            <p className="text-xs text-zinc-500 line-clamp-1">{slot.faculty || 'TBA'}</p>
                                            {slot.room && (
                                                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" /> {slot.room}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Day Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${selectedDay === day
                                        ? 'bg-zinc-900 text-white shadow-lg'
                                        : isToday(day)
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                            : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                                        }`}
                                >
                                    {DAY_SHORT[day]}
                                    {isToday(day) && <span className="ml-1 text-xs">(Today)</span>}
                                </button>
                            ))}
                        </div>

                        {/* Day Schedule */}
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                                <h2 className="text-lg font-bold text-zinc-900">{selectedDay}'s Schedule</h2>
                                <p className="text-sm text-zinc-500">{getSlotsForDay(selectedDay).length} periods</p>
                            </div>

                            <div className="p-4">
                                {getSlotsForDay(selectedDay).length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                                        <p className="text-zinc-500">No classes on {selectedDay}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {getSlotsForDay(selectedDay).map((slot, idx) => (
                                            <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border ${getSlotColor(slot.type)}`}>
                                                <div className="w-16 text-center">
                                                    <div className="text-xl">{getTypeIcon(slot.type)}</div>
                                                    <div className="text-xs text-zinc-500 font-bold mt-1">P{slot.period}</div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-zinc-900">{slot.subjectName}</h3>
                                                        {slot.subjectCode && (
                                                            <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{slot.subjectCode}</span>
                                                        )}
                                                        <span className={`text-xs px-2 py-0.5 rounded ${getSlotTextColor(slot.type)} bg-white/50`}>
                                                            {slot.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {slot.startTime} - {slot.endTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {slot.faculty || 'TBA'}
                                                        </span>
                                                        {slot.room && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {slot.room}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Full Week Grid View */}
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                                <h2 className="text-lg font-bold text-zinc-900">Full Week View</h2>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide w-20">Time</th>
                                            {DAYS.map(day => (
                                                <th key={day} className={`p-2 text-center text-xs font-bold uppercase tracking-wide ${isToday(day) ? 'text-blue-600' : 'text-zinc-500'
                                                    }`}>
                                                    {DAY_SHORT[day]}
                                                    {isToday(day) && <span className="block text-[10px] text-blue-500">TODAY</span>}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getAllPeriods().map(period => (
                                            <tr key={period.num}>
                                                <td className="p-2 text-xs text-zinc-500 whitespace-nowrap">
                                                    <div className="font-bold text-zinc-900">P{period.num}</div>
                                                    <div>{period.start}-{period.end}</div>
                                                </td>
                                                {DAYS.map(day => {
                                                    const slot = timetable.slots.find(s => s.day === day && s.period === period.num);
                                                    return (
                                                        <td key={day} className="p-1">
                                                            <div className={`min-h-[60px] p-2 rounded-lg border ${isToday(day) ? 'ring-1 ring-blue-300' : ''} ${slot ? getSlotColor(slot.type) : 'bg-zinc-50 border-zinc-100'
                                                                }`}>
                                                                {slot ? (
                                                                    <div className="text-xs">
                                                                        <p className="font-bold text-zinc-900 truncate">{slot.subjectName}</p>
                                                                        <p className="text-zinc-500 truncate">{slot.faculty || 'TBA'}</p>
                                                                        {slot.room && <p className="text-zinc-400 truncate">{slot.room}</p>}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-full flex items-center justify-center text-zinc-300 text-xs">-</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentTimetable;
