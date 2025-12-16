import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
    autoScheduleExam,
    getSubjects,
    getExams,
    generateConsolidatedHallTickets,
    authorizeConsolidatedHallTickets,
    createSubject
} from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
    Calendar, Wand2, Clock, CheckCircle, AlertTriangle, AlertCircle,
    Ticket, Download, FileText, ChevronDown, ChevronUp, Plus, BookOpen, RefreshCw
} from 'lucide-react';

const AdminExamScheduling = () => {
    const user = useSelector(selectCurrentUser);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [expandedExam, setExpandedExam] = useState(null);
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [addingSubject, setAddingSubject] = useState(false);

    // GSAP Animation Refs
    const pageRef = useRef(null);
    const examsGridRef = useRef(null);

    // GSAP Entry Animations
    useEffect(() => {
        if (!pageRef.current || loadingData) return;

        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                if (examsGridRef.current) {
                    const items = examsGridRef.current.children;
                    gsap.fromTo(items,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
                    );
                }
            }, pageRef);

            return () => ctx.revert();
        }, 100);

        return () => clearTimeout(timer);
    }, [loadingData, exams]);

    // Scheduling form state
    const [scheduleForm, setScheduleForm] = useState({
        year: '1',
        examType: 'Semester',
        startDate: '',
        endDate: '',
        holidays: '',
        departments: []
    });

    // New subject form
    const [newSubject, setNewSubject] = useState({
        name: '',
        code: '',
        department: 'CSE',
        year: 1,
        semester: 1,
        subjectType: 'HEAVY',
        credits: 3
    });

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSM'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [examsRes, subjectsRes] = await Promise.all([
                getExams(),
                getSubjects()
            ]);
            setExams(examsRes.data || []);
            setSubjects(subjectsRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAutoSchedule = async (e) => {
        e.preventDefault();

        // Check if there are subjects for the selected year
        const yearSubjects = subjects.filter(s => s.year === parseInt(scheduleForm.year));
        const deptSubjects = scheduleForm.departments.length > 0
            ? yearSubjects.filter(s => scheduleForm.departments.includes(s.department))
            : yearSubjects;

        if (deptSubjects.length === 0) {
            setError(`No subjects found for Year ${scheduleForm.year}${scheduleForm.departments.length > 0 ? ` in selected departments` : ''}. Please add subjects first.`);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const holidays = scheduleForm.holidays
                .split(',')
                .map(d => d.trim())
                .filter(d => d);

            const { data } = await autoScheduleExam({
                year: parseInt(scheduleForm.year),
                examType: scheduleForm.examType,
                startDate: scheduleForm.startDate,
                endDate: scheduleForm.endDate,
                holidays,
                departments: scheduleForm.departments.length > 0 ? scheduleForm.departments : undefined
            });

            setResult(data);
            fetchData(); // Refresh exams list
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDept = (dept) => {
        setScheduleForm(prev => ({
            ...prev,
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleGenerateConsolidatedHallTickets = async () => {
        try {
            const { data } = await generateConsolidatedHallTickets({
                year: parseInt(scheduleForm.year),
                examType: scheduleForm.examType,
                department: scheduleForm.departments.length === 1 ? scheduleForm.departments[0] : undefined
            });
            alert(`Hall tickets generated! ${data.generated} students processed.`);
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAuthorizeConsolidatedHallTickets = async () => {
        try {
            const { data } = await authorizeConsolidatedHallTickets({
                year: parseInt(scheduleForm.year),
                examType: scheduleForm.examType
            });
            alert(`Hall tickets authorized! ${data.authorized} tickets ready for download.`);
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.name || !newSubject.code) {
            alert('Subject name and code are required');
            return;
        }

        setAddingSubject(true);
        try {
            await createSubject(newSubject);
            alert('Subject added successfully!');
            setShowAddSubject(false);
            setNewSubject({
                name: '',
                code: '',
                department: 'CSE',
                year: 1,
                semester: 1,
                subjectType: 'HEAVY',
                credits: 3
            });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally {
            setAddingSubject(false);
        }
    };

    // Filter subjects for selected year
    const subjectsForYear = subjects.filter(s => s.year === parseInt(scheduleForm.year));
    const filteredSubjects = scheduleForm.departments.length > 0
        ? subjectsForYear.filter(s => scheduleForm.departments.includes(s.department))
        : subjectsForYear;

    // Group exams by schedule
    const groupedExams = exams.reduce((acc, exam) => {
        if (exam.timetable && exam.timetable.length > 0) {
            acc.schedules = acc.schedules || [];
            acc.schedules.push(exam);
        } else {
            acc.individual = acc.individual || [];
            acc.individual.push(exam);
        }
        return acc;
    }, { schedules: [], individual: [] });

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Exam Management</h1>
                        <p className="text-gray-500 mt-1 text-lg">
                            Auto-generate exam schedules using the MLR algorithm
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowAddSubject(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-lg shadow-green-200 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add Subject
                        </button>
                    </div>
                </div>

                {/* Subject Stats */}
                <div className="glass-card rounded-2xl p-5 tilt-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Subjects in Database</p>
                                <p className="text-sm text-gray-500">
                                    {loadingData ? 'Loading...' : `${subjects.length} total, ${subjectsForYear.length} for Year ${scheduleForm.year}`}
                                </p>
                            </div>
                        </div>
                        {filteredSubjects.length > 0 && (
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">{filteredSubjects.length}</p>
                                <p className="text-xs text-gray-500">subjects available</p>
                            </div>
                        )}
                    </div>
                    {subjectsForYear.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {subjectsForYear.slice(0, 8).map(sub => (
                                <span key={sub._id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                                    {sub.code} - {sub.name}
                                </span>
                            ))}
                            {subjectsForYear.length > 8 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
                                    +{subjectsForYear.length - 8} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Scheduling Form */}
                    <div className="xl:col-span-2">
                        <div className="glass-card rounded-2xl tilt-card overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <Wand2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Auto-Schedule Exams</h2>
                                    <p className="text-sm text-gray-500">Configure parameters and generate timetable</p>
                                </div>
                            </div>

                            <form onSubmit={handleAutoSchedule} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={scheduleForm.year}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, year: e.target.value })}
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={scheduleForm.examType}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, examType: e.target.value })}
                                        >
                                            <option value="Semester">Semester (3 hours)</option>
                                            <option value="Internal">Internal (1.5 hours)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={scheduleForm.startDate}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={scheduleForm.endDate}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Departments (optional - select specific or leave empty for all)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {departments.map(dept => (
                                            <button
                                                key={dept}
                                                type="button"
                                                onClick={() => handleToggleDept(dept)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${scheduleForm.departments.includes(dept)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {dept}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Holidays (comma-separated dates, e.g., 2024-12-25, 2024-12-26)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="2024-12-25, 2024-12-31"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={scheduleForm.holidays}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, holidays: e.target.value })}
                                    />
                                </div>

                                {/* Subject availability warning */}
                                {filteredSubjects.length === 0 && !loadingData && (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">No subjects found for the given criteria</p>
                                            <p className="text-sm mt-1">
                                                Add subjects for Year {scheduleForm.year}
                                                {scheduleForm.departments.length > 0 && ` in ${scheduleForm.departments.join(', ')}`} to enable auto-scheduling.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowAddSubject(true)}
                                                className="mt-2 text-sm font-semibold text-yellow-700 hover:text-yellow-900 underline"
                                            >
                                                + Add Subject Now
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                                    <p className="font-semibold mb-2">Algorithm Features:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Heavy subjects: 1 full day gap between exams</li>
                                        <li>Non-major subjects: Half-day gap</li>
                                        <li>Max 1 exam per department per day</li>
                                        <li>Weekends and holidays excluded automatically</li>
                                    </ul>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || filteredSubjects.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-xl font-semibold shadow-lg shadow-purple-200 transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generating Schedule...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            Generate Exam Schedule
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Result */}
                        {result && (
                            <div className="mt-6 glass-card rounded-2xl tilt-card overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-green-50">
                                    <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Schedule Generated Successfully!
                                    </h2>
                                    <p className="text-sm text-green-700 mt-1">
                                        {result.summary?.totalExams || result.timetable?.length} exams scheduled across {result.summary?.datesUsed} days
                                    </p>
                                </div>
                                <div className="p-6">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Session</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Dept</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.timetable?.map((entry, idx) => (
                                                <tr key={idx} className="border-t border-gray-100">
                                                    <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">{entry.session}</td>
                                                    <td className="px-4 py-3 font-medium">{entry.subjectName} ({entry.subjectCode})</td>
                                                    <td className="px-4 py-3">{entry.department}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {result.violations?.length > 0 && (
                                        <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                                            <p className="font-semibold text-yellow-800 mb-2">Constraint Violations:</p>
                                            {result.violations.map((v, i) => (
                                                <p key={i} className="text-sm text-yellow-700">• {v.message}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Existing Exams / Hall Tickets */}
                    <div className="xl:col-span-1">
                        <div className="glass-card rounded-2xl tilt-card overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Ticket className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Hall Tickets</h2>
                                    <p className="text-sm text-gray-500">Generate and authorize</p>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Consolidated Actions */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <p className="text-sm text-gray-600">
                                        Generate <strong>ONE consolidated hall ticket</strong> per student for <strong>Year {scheduleForm.year}</strong> with all their subjects listed.
                                    </p>
                                    <button
                                        onClick={handleGenerateConsolidatedHallTickets}
                                        disabled={!groupedExams.individual || groupedExams.individual.length === 0}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Generate Consolidated Hall Tickets
                                    </button>
                                    <button
                                        onClick={handleAuthorizeConsolidatedHallTickets}
                                        disabled={!groupedExams.individual || groupedExams.individual.length === 0}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Authorize All for Download
                                    </button>
                                </div>

                                {/* Exams List (Read-only) */}
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Scheduled Exams ({groupedExams.individual?.length || 0})</p>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {groupedExams.individual?.map(exam => (
                                            <div key={exam._id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{exam.courseName}</p>
                                                    <p className="text-xs text-gray-500">{exam.courseCode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600">{new Date(exam.date).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400">{exam.session || 'FN'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {(!groupedExams.individual || groupedExams.individual.length === 0) && (
                                    <div className="text-center py-6 text-gray-500">
                                        <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No scheduled exams yet</p>
                                        <p className="text-xs">Generate a schedule first</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Subject Modal */}
            <Modal
                isOpen={showAddSubject}
                onClose={() => setShowAddSubject(false)}
                title="Add New Subject"
                size="md"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Code *</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.code}
                                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. CS301"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Type *</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.subjectType}
                                onChange={(e) => setNewSubject({ ...newSubject, subjectType: e.target.value })}
                            >
                                <option value="HEAVY">HEAVY (Core Subject)</option>
                                <option value="NONMAJOR">NONMAJOR (Elective)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name *</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={newSubject.name}
                            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                            placeholder="e.g. Data Structures"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.department}
                                onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                            >
                                {departments.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.year}
                                onChange={(e) => setNewSubject({ ...newSubject, year: parseInt(e.target.value) })}
                            >
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Semester</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.semester}
                                onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Credits</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={newSubject.credits}
                                onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })}
                                min="1"
                                max="6"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => setShowAddSubject(false)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddSubject}
                        disabled={addingSubject}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all"
                    >
                        {addingSubject ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5" />
                        )}
                        Add Subject
                    </button>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminExamScheduling;
