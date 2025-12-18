import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { autoScheduleExam, getSubjects, getExams, generateConsolidatedHallTickets, authorizeConsolidatedHallTickets, createSubject } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import { Calendar, Wand2, CheckCircle, AlertTriangle, AlertCircle, Ticket, FileText, Plus, BookOpen, RefreshCw } from 'lucide-react';

const AdminExamScheduling = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
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

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSM'];

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (pageRef.current && !loadingData) {
            gsap.fromTo('.section-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
        }
    }, [loadingData]);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [examsRes, subjectsRes] = await Promise.all([getExams(), getSubjects()]);
            setExams(examsRes.data || []);
            setSubjects(subjectsRes.data || []);
        } catch (err) { console.error('Error:', err); }
        finally { setLoadingData(false); }
    };

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

    const subjectsForYear = subjects.filter(s => s.year === parseInt(scheduleForm.year));
    const filteredSubjects = scheduleForm.departments.length > 0 ? subjectsForYear.filter(s => scheduleForm.departments.includes(s.department)) : subjectsForYear;

    const groupedExams = exams.reduce((acc, exam) => {
        if (exam.timetable && exam.timetable.length > 0) acc.schedules = [...(acc.schedules || []), exam];
        else acc.individual = [...(acc.individual || []), exam];
        return acc;
    }, { schedules: [], individual: [] });

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Exam Scheduling</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Auto-generate exam schedules using MLR algorithm</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
                            <RefreshCw className="w-4 h-4" />Refresh
                        </button>
                        <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">
                            <Plus className="w-4 h-4" />Add Subject
                        </button>
                    </div>
                </div>

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

                                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-xs">
                                    <p className="font-medium mb-1.5">Algorithm Features:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                                        <li>Heavy subjects: 1 full day gap</li><li>Non-major: Half-day gap</li><li>Max 1 exam per dept per day</li><li>Weekends/holidays excluded</li>
                                    </ul>
                                </div>

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
                                    {result.violations?.length > 0 && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                                            <p className="text-xs font-medium text-amber-700 mb-2">Warnings:</p>
                                            {result.violations.map((v, i) => <p key={i} className="text-xs text-amber-600">• {v.message}</p>)}
                                        </div>
                                    )}
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
