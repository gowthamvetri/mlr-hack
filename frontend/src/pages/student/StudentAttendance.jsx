import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getMySubjectAttendance, getMySubjectHistory } from '../../utils/api';
import gsap from 'gsap';
import {
    Calendar, BookOpen, AlertTriangle, CheckCircle, Clock, TrendingUp,
    ChevronDown, ChevronUp, BarChart3, Target, AlertCircle, Loader
} from 'lucide-react';
import Modal from '../../components/Modal';

// Animated counter
const AnimatedNumber = ({ value, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        const duration = 500;
        const start = displayValue;
        const end = typeof value === 'number' ? value : parseFloat(value) || 0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(suffix === '%' ? parseFloat((start + (end - start) * eased).toFixed(1)) : Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

const StudentAttendance = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState(null);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [subjectHistory, setSubjectHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
            gsap.fromTo('.subject-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
        }
    }, [loading]);

    useEffect(() => { fetchAttendance(); }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const { data } = await getMySubjectAttendance();
            setAttendanceData(data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (subjectId) => {
        try {
            setLoadingHistory(true);
            setShowHistoryModal(true);
            const { data } = await getMySubjectHistory(subjectId);
            setSubjectHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ELIGIBLE': return 'emerald';
            case 'WARNING': return 'amber';
            case 'NOT_ELIGIBLE': return 'red';
            default: return 'zinc';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ELIGIBLE': return 'Eligible';
            case 'WARNING': return 'Shortage Warning';
            case 'NOT_ELIGIBLE': return 'Not Eligible';
            default: return 'Unknown';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ELIGIBLE': return <CheckCircle className="w-4 h-4" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4" />;
            case 'NOT_ELIGIBLE': return <AlertCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <DashboardLayout role="student" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Attendance</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">
                            Subject-wise attendance and eligibility status
                        </p>
                    </div>
                </div>

                {/* Overall Stats */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl p-5 border border-zinc-200 animate-pulse">
                                <div className="w-20 h-3 bg-zinc-200 rounded mb-2" />
                                <div className="w-16 h-8 bg-zinc-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : attendanceData && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Overall Percentage */}
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                                    <BarChart3 className="w-4.5 h-4.5 text-zinc-600" />
                                </div>
                                {attendanceData.overall.percentage >= 75 ? (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Good</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Low</span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Overall</p>
                            <p className="text-2xl font-bold text-zinc-900">
                                <AnimatedNumber value={attendanceData.overall.percentage} suffix="%" />
                            </p>
                            <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${attendanceData.overall.percentage >= 75 ? 'bg-emerald-500' : attendanceData.overall.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${attendanceData.overall.percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Total Classes */}
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Calendar className="w-4.5 h-4.5 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Total Classes</p>
                            <p className="text-2xl font-bold text-zinc-900">
                                <AnimatedNumber value={attendanceData.overall.totalClasses} />
                            </p>
                        </div>

                        {/* Eligible Subjects */}
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Eligible Subjects</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                <AnimatedNumber value={attendanceData.stats.eligibleSubjects} />
                                <span className="text-sm font-normal text-zinc-400">/{attendanceData.stats.totalSubjects}</span>
                            </p>
                        </div>

                        {/* Shortage Subjects */}
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
                                </div>
                                {attendanceData.stats.shortageSubjects > 0 && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Action Needed</span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">Shortage</p>
                            <p className="text-2xl font-bold text-red-600">
                                <AnimatedNumber value={attendanceData.stats.shortageSubjects} />
                            </p>
                        </div>
                    </div>
                )}

                {/* Subject-wise Attendance */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <BookOpen className="w-4.5 h-4.5 text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Subject-wise Attendance</h3>
                                    <p className="text-xs text-zinc-500">Click to view detailed history</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-zinc-100">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-3" />
                                <p className="text-sm text-zinc-500">Loading attendance...</p>
                            </div>
                        ) : !attendanceData?.subjects?.length ? (
                            <div className="p-8 text-center">
                                <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-zinc-900">No attendance records</p>
                                <p className="text-xs text-zinc-500 mt-1">Attendance will appear once classes are marked</p>
                            </div>
                        ) : (
                            attendanceData.subjects.map((subjectData) => {
                                const color = getStatusColor(subjectData.eligibilityStatus);
                                return (
                                    <div
                                        key={subjectData._id}
                                        className="subject-card p-5 hover:bg-zinc-50 transition-colors cursor-pointer"
                                        onClick={() => handleViewHistory(subjectData._id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Subject Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-zinc-900 truncate">{subjectData.subject?.name}</h4>
                                                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                                                        {subjectData.subject?.code}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                    <span>{subjectData.presentClasses}/{subjectData.totalClasses} classes</span>
                                                    {subjectData.classesNeeded > 0 && (
                                                        <span className="text-amber-600 font-medium">
                                                            Need {subjectData.classesNeeded} more to reach 75%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Percentage */}
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end mb-1">
                                                    <span className={`text-2xl font-bold text-${color}-600`}>
                                                        {subjectData.percentage}%
                                                    </span>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-${color}-50 text-${color}-600 border-${color}-200`}>
                                                    {getStatusIcon(subjectData.eligibilityStatus)}
                                                    {getStatusLabel(subjectData.eligibilityStatus)}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-32 hidden sm:block">
                                                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 bg-${color}-500`}
                                                        style={{ width: `${Math.min(subjectData.percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="w-full flex justify-between mt-1">
                                                    <span className="text-[9px] text-zinc-400">0%</span>
                                                    <span className="text-[9px] text-zinc-400">75%</span>
                                                    <span className="text-[9px] text-zinc-400">100%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Eligibility Info */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                    <h4 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-zinc-600" />
                        Eligibility Criteria
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-zinc-700"><span className="font-bold text-emerald-600">≥ 75%</span> — Eligible for exams</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-zinc-700"><span className="font-bold text-amber-600">60-74%</span> — Shortage warning</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-zinc-700"><span className="font-bold text-red-600">&lt; 60%</span> — Not eligible</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            <Modal isOpen={showHistoryModal} onClose={() => { setShowHistoryModal(false); setSubjectHistory(null); }}
                title={subjectHistory?.subject?.name || 'Attendance History'} size="lg">
                {loadingHistory ? (
                    <div className="text-center py-12">
                        <Loader className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-3" />
                        <p className="text-sm text-zinc-500">Loading history...</p>
                    </div>
                ) : subjectHistory && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-zinc-50 rounded-lg text-center border border-zinc-200">
                                <p className="text-2xl font-bold text-zinc-900">{subjectHistory.percentage}%</p>
                                <p className="text-xs text-zinc-500">Attendance</p>
                            </div>
                            <div className="p-3 bg-zinc-50 rounded-lg text-center border border-zinc-200">
                                <p className="text-2xl font-bold text-emerald-600">{subjectHistory.presentClasses}</p>
                                <p className="text-xs text-zinc-500">Present</p>
                            </div>
                            <div className="p-3 bg-zinc-50 rounded-lg text-center border border-zinc-200">
                                <p className="text-2xl font-bold text-red-600">{subjectHistory.absentClasses}</p>
                                <p className="text-xs text-zinc-500">Absent</p>
                            </div>
                        </div>

                        {/* Records */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {subjectHistory.records?.map((record) => (
                                <div key={record._id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-600' :
                                        record.status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {record.status === 'PRESENT' ? <CheckCircle className="w-5 h-5" /> :
                                            record.status === 'LATE' ? <Clock className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-zinc-500">Period {record.period || '-'}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                                        record.status === 'LATE' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                                            'bg-red-100 text-red-600 border border-red-200'
                                        }`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default StudentAttendance;
