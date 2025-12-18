import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getExams, getSeatingSchedule, assignInvigilators, getUsers } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import { Users, Building, CalendarDays, CheckCircle, UserPlus, Save, AlertCircle } from 'lucide-react';

const AdminInvigilators = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [exams, setExams] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (selectedExam) fetchSchedule(); }, [selectedExam]);

    useEffect(() => {
        if (pageRef.current && exams.length > 0) {
            gsap.fromTo('.exam-item', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
        }
    }, [exams]);

    const fetchData = async () => {
        try {
            const [examsRes, usersRes] = await Promise.all([getExams(), getUsers({ role: 'Staff' })]);
            setExams((examsRes.data || []).filter(e => e.seatingPublished));
            setFaculty(usersRes.data?.users || usersRes.data || []);
        } catch (err) { console.error('Error:', err); }
    };

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const { data } = await getSeatingSchedule(selectedExam);
            setSchedule(data);
            const existingAssignments = {};
            data.schedule?.forEach(room => { if (room.invigilator) existingAssignments[room.roomNumber] = room.invigilator.id; });
            setAssignments(existingAssignments);
        } catch (err) { console.error('Error:', err); }
        finally { setLoading(false); }
    };

    const handleAssign = (roomNumber, invigilatorId) => {
        setAssignments(prev => ({ ...prev, [roomNumber]: invigilatorId }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const assignmentsList = Object.entries(assignments).filter(([_, id]) => id).map(([roomNumber, invigilatorId]) => ({ roomNumber, invigilatorId }));
            await assignInvigilators({ examId: selectedExam, assignments: assignmentsList });
            alert('Invigilators assigned successfully!');
            fetchSchedule();
        } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)); }
        finally { setSaving(false); }
    };

    const selectedExamDetails = exams.find(e => e._id === selectedExam);

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Invigilator Assignment</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">Assign faculty members to exam rooms</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Exam Selection */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                            <div className="p-5 border-b border-zinc-100">
                                <h2 className="font-semibold text-zinc-900 text-sm">Select Exam</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">{exams.length} exams with seating</p>
                            </div>
                            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                                {exams.length > 0 ? exams.map(exam => (
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
                    <div className="xl:col-span-3">
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
                                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all">
                                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}Save
                                    </button>
                                )}
                            </div>

                            <div className="p-5">
                                {loading ? (
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
            </div>
        </DashboardLayout>
    );
};

export default AdminInvigilators;
