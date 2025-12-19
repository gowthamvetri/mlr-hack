import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { autoScheduleExam, getSubjects, getExams, generateConsolidatedHallTickets, authorizeConsolidatedHallTickets, createSubject, getSeatingSchedule, assignInvigilators, getUsers } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import { Calendar, Wand2, CheckCircle, AlertTriangle, AlertCircle, Ticket, FileText, Plus, BookOpen, RefreshCw, Users, Building, CalendarDays, UserPlus, Save } from 'lucide-react';

const AdminExamScheduling = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [activeTab, setActiveTab] = useState('schedule');

    // Scheduling state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [addingSubject, setAddingSubject] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ year: '1', examType: 'Semester', startDate: '', endDate: '', holidays: '', departments: [] });
    const [newSubject, setNewSubject] = useState({ name: '', code: '', department: 'CSE', year: 1, semester: 1, subjectType: 'HEAVY', credits: 3 });

    // Invigilator state
    const [faculty, setFaculty] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [saving, setSaving] = useState(false);

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSM'];

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (selectedExam && activeTab === 'invigilators') fetchExamSchedule(); }, [selectedExam]);

    useEffect(() => {
        if (pageRef.current && !loadingData) {
            gsap.fromTo('.section-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
        }
    }, [loadingData, activeTab]);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [examsRes, subjectsRes, usersRes] = await Promise.all([
                getExams(),
                getSubjects(),
                getUsers({ role: 'Staff' })
            ]);
            const examsData = examsRes.data;
            const subjectsData = subjectsRes.data;
            const usersData = usersRes.data;
            setExams(Array.isArray(examsData) ? examsData : (examsData?.exams || []));
            setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []));
            setFaculty(Array.isArray(usersData) ? usersData : (usersData?.users || []));
        } catch (err) { console.error('Error:', err); setExams([]); setSubjects([]); setFaculty([]); }
        finally { setLoadingData(false); }
    };

    // ===== SCHEDULING FUNCTIONS =====
    const handleAutoSchedule = async (e) => {
        e.preventDefault();
        const yearSubjects = subjects.filter(s => s.year === parseInt(scheduleForm.year));
        const deptSubjects = scheduleForm.departments.length > 0 ? yearSubjects.filter(s => scheduleForm.departments.includes(s.department)) : yearSubjects;
        if (deptSubjects.length === 0) {
            setError(`No subjects found. Add subjects for Year ${scheduleForm.year} first.`);
            return;
        }

        setLoading(true); setError(null); setResult(null);
        try {
            const holidays = scheduleForm.holidays.split(',').map(d => d.trim()).filter(d => d);
            const { data } = await autoScheduleExam({
                year: parseInt(scheduleForm.year), examType: scheduleForm.examType,
                startDate: scheduleForm.startDate, endDate: scheduleForm.endDate, holidays,
                departments: scheduleForm.departments.length > 0 ? scheduleForm.departments : undefined
            });
            setResult(data);
            fetchData();
        } catch (err) { setError(err.response?.data?.message || err.message); }
        finally { setLoading(false); }
    };

    const handleToggleDept = (dept) => {
        setScheduleForm(prev => ({ ...prev, departments: prev.departments.includes(dept) ? prev.departments.filter(d => d !== dept) : [...prev.departments, dept] }));
    };

    const handleGenerateConsolidatedHallTickets = async () => {
        try {
            const { data } = await generateConsolidatedHallTickets({
                year: parseInt(scheduleForm.year), examType: scheduleForm.examType,
                department: scheduleForm.departments.length === 1 ? scheduleForm.departments[0] : undefined
            });
            alert(`Hall tickets generated! ${data.generated} students processed.`);
            fetchData();
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
    };

    const handleAuthorizeConsolidatedHallTickets = async () => {
        try {
            const { data } = await authorizeConsolidatedHallTickets({ year: parseInt(scheduleForm.year), examType: scheduleForm.examType });
            alert(`Authorized! ${data.authorized} tickets ready.`);
            fetchData();
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
    };

    const handleAddSubject = async () => {
        if (!newSubject.name || !newSubject.code) { alert('Name and code required'); return; }
        setAddingSubject(true);
        try {
            await createSubject(newSubject);
            alert('Subject added!');
            setShowAddSubject(false);
            setNewSubject({ name: '', code: '', department: 'CSE', year: 1, semester: 1, subjectType: 'HEAVY', credits: 3 });
            fetchData();
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setAddingSubject(false); }
    };

    // ===== INVIGILATOR FUNCTIONS =====
    const fetchExamSchedule = async () => {
        setLoadingSchedule(true);
        try {
            const { data } = await getSeatingSchedule(selectedExam);
            setSchedule(data);
            const existingAssignments = {};
            data.schedule?.forEach(room => { if (room.invigilator) existingAssignments[room.roomNumber] = room.invigilator.id; });
            setAssignments(existingAssignments);
        } catch (err) { console.error('Error:', err); }
        finally { setLoadingSchedule(false); }
    };

    const handleAssign = (roomNumber, invigilatorId) => {
        setAssignments(prev => ({ ...prev, [roomNumber]: invigilatorId }));
    };

    const handleSaveInvigilators = async () => {
        setSaving(true);
        try {
            const assignmentsList = Object.entries(assignments).filter(([_, id]) => id).map(([roomNumber, invigilatorId]) => ({ roomNumber, invigilatorId }));
            await assignInvigilators({ examId: selectedExam, assignments: assignmentsList });
            alert('Invigilators assigned successfully!');
            fetchExamSchedule();
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setSaving(false); }
    };

    const subjectsForYear = subjects.filter(s => s.year === parseInt(scheduleForm.year));
    const filteredSubjects = scheduleForm.departments.length > 0 ? subjectsForYear.filter(s => scheduleForm.departments.includes(s.department)) : subjectsForYear;
    const groupedExams = exams.reduce((acc, exam) => {
        if (exam.timetable && exam.timetable.length > 0) acc.schedules = [...(acc.schedules || []), exam];
        else acc.individual = [...(acc.individual || []), exam];
        return acc;
    }, { schedules: [], individual: [] });
    const examsWithSeating = exams.filter(e => e.seatingPublished);
    const selectedExamDetails = exams.find(e => e._id === selectedExam);

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Exam Management</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Schedule exams, generate hall tickets, and assign invigilators</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
                            <RefreshCw className="w-4 h-4" />Refresh
                        </button>
                        {activeTab === 'schedule' && (
                            <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
                                <Plus className="w-4 h-4" />Add Subject
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'schedule' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                        <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" />Schedule & Hall Tickets</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('invigilators')}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'invigilators' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                    >
                        <span className="flex items-center gap-2"><Users className="w-4 h-4" />Invigilators</span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'schedule' ? (
                    <>
                        {/* Subject Stats */}
                        <div className="section-card bg-white rounded-xl border border-zinc-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><BookOpen className="w-4.5 h-4.5 text-blue-500" /></div>
                                    <div>
                                        <p className="font-semibold text-zinc-900 text-sm">Subjects</p>
                                        <p className="text-xs text-zinc-500">{loadingData ? 'Loading...' : `${subjects.length} total, ${subjectsForYear.length} for Year ${scheduleForm.year}`}</p>
                                    </div>
                                </div>
                                {filteredSubjects.length > 0 && (
                                    <div className="text-right">
                                        <p className="text-xl font-semibold text-emerald-600">{filteredSubjects.length}</p>
                                        <p className="text-[10px] text-zinc-500">available</p>
                                    </div>
                                )}
                            </div>
                            {subjectsForYear.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {subjectsForYear.slice(0, 8).map(sub => (
                                        <span key={sub._id} className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">{sub.code}</span>
                                    ))}
                                    {subjectsForYear.length > 8 && <span className="px-2 py-1 bg-zinc-100 text-zinc-400 rounded text-[10px]">+{subjectsForYear.length - 8} more</span>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Schedule Form */}
                            <div className="xl:col-span-2 section-card">
                                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                    <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
                                        <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center"><Wand2 className="w-4.5 h-4.5 text-violet-500" /></div>
                                        <div>
                                            <h2 className="font-semibold text-zinc-900 text-sm">Auto-Schedule Exams</h2>
                                            <p className="text-xs text-zinc-500">Configure parameters and generate timetable</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleAutoSchedule} className="p-5 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Year</label>
                                                <select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={scheduleForm.year} onChange={(e) => setScheduleForm({ ...scheduleForm, year: e.target.value })}>
                                                    <option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Exam Type</label>
                                                <select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={scheduleForm.examType} onChange={(e) => setScheduleForm({ ...scheduleForm, examType: e.target.value })}>
                                                    <option value="Semester">Semester (3h)</option><option value="Internal">Internal (1.5h)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Date</label>
                                                <input type="date" required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={scheduleForm.startDate} onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">End Date</label>
                                                <input type="date" required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={scheduleForm.endDate} onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-2">Departments (optional)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {departments.map(d => (
                                                    <button key={d} type="button" onClick={() => handleToggleDept(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${scheduleForm.departments.includes(d) ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>{d}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Holidays (comma-separated)</label>
                                            <input type="text" placeholder="2024-12-25, 2024-12-31" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={scheduleForm.holidays} onChange={(e) => setScheduleForm({ ...scheduleForm, holidays: e.target.value })} />
                                        </div>

                                        {filteredSubjects.length === 0 && !loadingData && (
                                            <div className="p-4 bg-amber-50 text-amber-700 rounded-xl flex items-start gap-3">
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-medium">No subjects found</p>
                                                    <p>Add subjects for Year {scheduleForm.year} to enable scheduling.</p>
                                                    <button type="button" onClick={() => setShowAddSubject(true)} className="mt-1 font-medium underline">Add Subject</button>
                                                </div>
                                            </div>
                                        )}

                                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

                                        <button type="submit" disabled={loading || filteredSubjects.length === 0} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-zinc-300 transition-all">
                                            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4" />Generate Schedule</>}
                                        </button>
                                    </form>
                                </div>

                                {/* Result */}
                                {result && (
                                    <div className="mt-6 bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                        <div className="p-5 border-b border-zinc-100 bg-emerald-50">
                                            <div className="flex items-center gap-2 text-emerald-700">
                                                <CheckCircle className="w-4 h-4" />
                                                <h3 className="font-semibold text-sm">Schedule Generated!</h3>
                                            </div>
                                            <p className="text-xs text-emerald-600 mt-1">{result.summary?.totalExams || result.timetable?.length} exams across {result.summary?.datesUsed} days</p>
                                        </div>
                                        <div className="p-5">
                                            <table className="w-full text-sm">
                                                <thead><tr className="border-b border-zinc-100">
                                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-400 uppercase">Date</th>
                                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-400 uppercase">Session</th>
                                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-400 uppercase">Subject</th>
                                                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-400 uppercase">Dept</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-zinc-50">
                                                    {result.timetable?.map((entry, idx) => (
                                                        <tr key={idx} className="hover:bg-zinc-50">
                                                            <td className="px-4 py-2 text-zinc-600">{new Date(entry.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 text-zinc-600">{entry.session}</td>
                                                            <td className="px-4 py-2 font-medium text-zinc-900">{entry.subjectName} <span className="text-zinc-400">({entry.subjectCode})</span></td>
                                                            <td className="px-4 py-2 text-zinc-600">{entry.department}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Hall Tickets */}
                            <div className="xl:col-span-1 section-card">
                                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                    <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
                                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center"><Ticket className="w-4.5 h-4.5 text-amber-500" /></div>
                                        <div>
                                            <h2 className="font-semibold text-zinc-900 text-sm">Hall Tickets</h2>
                                            <p className="text-xs text-zinc-500">Generate & authorize</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                                            <p className="text-xs text-zinc-600">Generate <strong>ONE consolidated hall ticket</strong> per student for <strong>Year {scheduleForm.year}</strong>.</p>
                                            <button onClick={handleGenerateConsolidatedHallTickets} disabled={!groupedExams.individual || groupedExams.individual.length === 0} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all">
                                                <FileText className="w-4 h-4" />Generate
                                            </button>
                                            <button onClick={handleAuthorizeConsolidatedHallTickets} disabled={!groupedExams.individual || groupedExams.individual.length === 0} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all">
                                                <CheckCircle className="w-4 h-4" />Authorize All
                                            </button>
                                        </div>

                                        <div className="border-t border-zinc-100 pt-4">
                                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-3">Scheduled Exams ({groupedExams.individual?.length || 0})</p>
                                            <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                                {groupedExams.individual?.map(exam => (
                                                    <div key={exam._id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-zinc-900 text-xs">{exam.courseName}</p>
                                                            <p className="text-[10px] text-zinc-500">{exam.courseCode}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-zinc-600">{new Date(exam.date).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-zinc-400">{exam.session || 'FN'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {(!groupedExams.individual || groupedExams.individual.length === 0) && (
                                            <div className="text-center py-6">
                                                <Calendar className="w-10 h-10 mx-auto mb-2 text-zinc-200" />
                                                <p className="text-xs text-zinc-500">No exams scheduled</p>
                                                <p className="text-[10px] text-zinc-400">Generate a schedule first</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Invigilators Tab */
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Exam Selection */}
                        <div className="xl:col-span-1 section-card">
                            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                <div className="p-5 border-b border-zinc-100">
                                    <h2 className="font-semibold text-zinc-900 text-sm">Select Exam</h2>
                                    <p className="text-xs text-zinc-500 mt-0.5">{examsWithSeating.length} exams with seating</p>
                                </div>
                                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                                    {examsWithSeating.length > 0 ? examsWithSeating.map(exam => (
                                        <button
                                            key={exam._id}
                                            onClick={() => setSelectedExam(exam._id)}
                                            className={`exam-item w-full text-left p-4 rounded-lg border transition-all ${selectedExam === exam._id
                                                ? 'bg-violet-50 border-violet-200'
                                                : 'bg-zinc-50 border-transparent hover:bg-zinc-100'}`}
                                        >
                                            <p className="font-medium text-zinc-900 text-sm truncate">{exam.courseName}</p>
                                            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                                                <CalendarDays className="w-3 h-3" />{new Date(exam.date).toLocaleDateString()}
                                            </p>
                                        </button>
                                    )) : (
                                        <div className="text-center py-8 text-zinc-500">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                                            <p className="text-xs">No exams with seating</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Assignment Area */}
                        <div className="xl:col-span-3 section-card">
                            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <UserPlus className="w-4.5 h-4.5 text-blue-500" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-zinc-900 text-sm">Room Assignments</h2>
                                            <p className="text-xs text-zinc-500">{selectedExamDetails ? selectedExamDetails.courseName : 'Select an exam'}</p>
                                        </div>
                                    </div>
                                    {schedule && (
                                        <button onClick={handleSaveInvigilators} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all">
                                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}Save
                                        </button>
                                    )}
                                </div>

                                <div className="p-5">
                                    {loadingSchedule ? (
                                        <div className="text-center py-12">
                                            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-sm text-zinc-500">Loading...</p>
                                        </div>
                                    ) : !selectedExam ? (
                                        <div className="text-center py-12">
                                            <Users className="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                                            <p className="text-sm text-zinc-500">Select an exam to assign invigilators</p>
                                        </div>
                                    ) : schedule ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {schedule.schedule?.map((room, idx) => (
                                                <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Building className="w-4 h-4 text-violet-500" />
                                                        <span className="font-semibold text-zinc-900 text-sm">Room {room.roomNumber}</span>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mb-3">
                                                        <p>{room.studentCount} students</p>
                                                        <p className="text-[10px]">{room.departments?.join(', ')}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Invigilator</label>
                                                        <select
                                                            value={assignments[room.roomNumber] || ''}
                                                            onChange={(e) => handleAssign(room.roomNumber, e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department || 'No dept'})</option>)}
                                                        </select>
                                                    </div>
                                                    {room.invigilator && (
                                                        <div className="mt-2 flex items-center gap-1 text-emerald-600 text-[10px]">
                                                            <CheckCircle className="w-3 h-3" />Currently: {room.invigilator.name}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Subject Modal */}
            <Modal isOpen={showAddSubject} onClose={() => setShowAddSubject(false)} title="Add Subject" size="md">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Code *</label><input type="text" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={newSubject.code} onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })} placeholder="CS301" /></div>
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label><select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={newSubject.subjectType} onChange={(e) => setNewSubject({ ...newSubject, subjectType: e.target.value })}><option value="HEAVY">HEAVY</option><option value="NONMAJOR">NONMAJOR</option></select></div>
                    </div>
                    <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Name *</label><input type="text" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="Data Structures" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Dept *</label><select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={newSubject.department} onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Year *</label><select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={newSubject.year} onChange={(e) => setNewSubject({ ...newSubject, year: parseInt(e.target.value) })}><option value={1}>1st</option><option value={2}>2nd</option><option value={3}>3rd</option><option value={4}>4th</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Semester</label><select className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white" value={newSubject.semester} onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}>{[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Credits</label><input type="number" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" value={newSubject.credits} onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })} min="1" max="6" /></div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 flex gap-2">
                    <button onClick={() => setShowAddSubject(false)} className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                    <button onClick={handleAddSubject} disabled={addingSubject} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        {addingSubject ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}Add
                    </button>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminExamScheduling;
