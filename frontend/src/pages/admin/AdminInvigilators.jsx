import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
    getExams,
    getSeatingSchedule,
    assignInvigilators,
    getUsers
} from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
    Users, Building, CalendarDays, Clock, CheckCircle,
    UserPlus, Save, AlertCircle
} from 'lucide-react';

const AdminInvigilators = () => {
    const user = useSelector(selectCurrentUser);
    const [exams, setExams] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [assignments, setAssignments] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            fetchSchedule();
        }
    }, [selectedExam]);

    const fetchData = async () => {
        try {
            const [examsRes, usersRes] = await Promise.all([
                getExams(),
                getUsers({ role: 'Staff' })
            ]);
            // Only show exams with seating allocated
            setExams((examsRes.data || []).filter(e => e.seatingPublished));
            setFaculty(usersRes.data?.users || usersRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const { data } = await getSeatingSchedule(selectedExam);
            setSchedule(data);

            // Initialize assignments from existing data
            const existingAssignments = {};
            data.schedule?.forEach(room => {
                if (room.invigilator) {
                    existingAssignments[room.roomNumber] = room.invigilator.id;
                }
            });
            setAssignments(existingAssignments);
        } catch (err) {
            console.error('Error fetching schedule:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = (roomNumber, invigilatorId) => {
        setAssignments(prev => ({
            ...prev,
            [roomNumber]: invigilatorId
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const assignmentsList = Object.entries(assignments)
                .filter(([_, invigilatorId]) => invigilatorId)
                .map(([roomNumber, invigilatorId]) => ({
                    roomNumber,
                    invigilatorId
                }));

            await assignInvigilators({
                examId: selectedExam,
                assignments: assignmentsList
            });

            alert('Invigilators assigned successfully!');
            fetchSchedule();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const selectedExamDetails = exams.find(e => e._id === selectedExam);

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invigilator Assignment</h1>
                    <p className="text-gray-500 mt-1 text-lg">
                        Assign faculty members to exam rooms for invigilation duties
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Exam Selection */}
                    <div className="xl:col-span-1">
                        <div className="glass-card rounded-2xl tilt-card overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Select Exam</h2>
                                <p className="text-sm text-gray-500">{exams.length} exams with seating</p>
                            </div>
                            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                                {exams.length > 0 ? exams.map(exam => (
                                    <button
                                        key={exam._id}
                                        onClick={() => setSelectedExam(exam._id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedExam === exam._id
                                            ? 'bg-primary-50 border-primary-300 shadow-md'
                                            : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <p className="font-semibold text-gray-800 truncate">{exam.courseName}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(exam.date).toLocaleDateString()}
                                        </p>
                                    </button>
                                )) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p>No exams with seating</p>
                                        <p className="text-xs">Allocate seating first</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assignment Area */}
                    <div className="xl:col-span-3">
                        <div className="glass-card rounded-2xl tilt-card overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Room Assignments</h2>
                                        <p className="text-sm text-gray-500">
                                            {selectedExamDetails ? selectedExamDetails.courseName : 'Select an exam'}
                                        </p>
                                    </div>
                                </div>
                                {schedule && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        Save Assignments
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="text-center py-12">
                                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-gray-500">Loading schedule...</p>
                                    </div>
                                ) : !selectedExam ? (
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-500">Select an exam to assign invigilators</p>
                                    </div>
                                ) : schedule ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {schedule.schedule?.map((room, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Building className="w-5 h-5 text-primary-600" />
                                                    <span className="font-bold text-gray-800">Room {room.roomNumber}</span>
                                                </div>
                                                <div className="text-sm text-gray-500 mb-3">
                                                    <p>{room.studentCount} students</p>
                                                    <p className="text-xs">{room.departments?.join(', ')}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Invigilator</label>
                                                    <select
                                                        value={assignments[room.roomNumber] || ''}
                                                        onChange={(e) => handleAssign(room.roomNumber, e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    >
                                                        <option value="">-- Select Faculty --</option>
                                                        {faculty.map(f => (
                                                            <option key={f._id} value={f._id}>
                                                                {f.name} ({f.department || 'No dept'})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {room.invigilator && (
                                                    <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Currently: {room.invigilator.name}
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
