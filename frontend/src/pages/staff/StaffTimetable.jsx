import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import {
    getTimetables, createTimetable, updateTimetable, deleteTimetable,
    getTimetableSubjects, getSubjectDepartments
} from '../../utils/api';
import {
    Calendar, Plus, Save, Trash2, Edit, Clock, BookOpen, Users,
    Building, X, Check, RefreshCw, ChevronDown
} from 'lucide-react';
import Modal from '../../components/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
    { num: 1, start: '09:00', end: '09:50' },
    { num: 2, start: '09:50', end: '10:40' },
    { num: 3, start: '10:50', end: '11:40' },
    { num: 4, start: '11:40', end: '12:30' },
    { num: 5, start: '13:30', end: '14:20' },
    { num: 6, start: '14:20', end: '15:10' },
    { num: 7, start: '15:20', end: '16:10' },
    { num: 8, start: '16:10', end: '17:00' }
];

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const YEARS = [1, 2, 3, 4];
const SECTIONS = ['A', 'B', 'C', 'D'];

const StaffTimetable = () => {
    const user = useSelector(selectCurrentUser);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timetables, setTimetables] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSection, setSelectedSection] = useState('A');
    const [editingTimetable, setEditingTimetable] = useState(null);
    const [slots, setSlots] = useState([]);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [slotForm, setSlotForm] = useState({ subjectName: '', subjectCode: '', faculty: '', room: '', type: 'Lecture' });

    useEffect(() => { fetchTimetables(); }, []);
    useEffect(() => { if (selectedDept && selectedYear) fetchSubjects(); }, [selectedDept, selectedYear]);

    const fetchTimetables = async () => {
        try {
            setLoading(true);
            const { data } = await getTimetables({ all: true });
            setTimetables(data);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const fetchSubjects = async () => {
        try {
            const { data } = await getTimetableSubjects({ department: selectedDept, year: selectedYear });
            setSubjects(data);
        } catch (error) { setSubjects([]); }
    };

    const handleCreateNew = () => {
        if (!selectedDept || !selectedYear) { alert('Please select department and year first'); return; }
        setEditingTimetable(null);
        setSlots([]);
    };

    const handleEditTimetable = (timetable) => {
        setEditingTimetable(timetable);
        setSelectedDept(timetable.department);
        setSelectedYear(timetable.year);
        setSelectedSection(timetable.section || 'A');
        setSlots(timetable.slots || []);
    };

    const handleCellClick = (day, period) => {
        const existingSlot = slots.find(s => s.day === day && s.period === period.num);
        setCurrentSlot({ day, period });
        setSlotForm(existingSlot ? {
            subjectName: existingSlot.subjectName || '',
            subjectCode: existingSlot.subjectCode || '',
            faculty: existingSlot.faculty || '',
            room: existingSlot.room || '',
            type: existingSlot.type || 'Lecture'
        } : { subjectName: '', subjectCode: '', faculty: '', room: '', type: 'Lecture' });
        setShowSlotModal(true);
    };

    const handleSaveSlot = () => {
        if (!slotForm.subjectName) { alert('Subject name is required'); return; }
        const newSlot = { day: currentSlot.day, period: currentSlot.period.num, startTime: currentSlot.period.start, endTime: currentSlot.period.end, ...slotForm };
        const filteredSlots = slots.filter(s => !(s.day === currentSlot.day && s.period === currentSlot.period.num));
        setSlots([...filteredSlots, newSlot]);
        setShowSlotModal(false);
    };

    const handleDeleteSlot = () => {
        const filteredSlots = slots.filter(s => !(s.day === currentSlot.day && s.period === currentSlot.period.num));
        setSlots(filteredSlots);
        setShowSlotModal(false);
    };

    const handleSubjectSelect = (subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        if (subject) setSlotForm({ ...slotForm, subjectName: subject.name, subjectCode: subject.code });
    };

    const handleSaveTimetable = async () => {
        if (!selectedDept || !selectedYear) { alert('Please select department and year'); return; }
        if (slots.length === 0) { alert('Please add at least one slot'); return; }
        setSaving(true);
        try {
            const timetableData = { department: selectedDept, year: parseInt(selectedYear), section: selectedSection, slots };
            if (editingTimetable) { await updateTimetable(editingTimetable._id, timetableData); alert('Timetable updated!'); }
            else { await createTimetable(timetableData); alert('Timetable created!'); }
            fetchTimetables();
            setEditingTimetable(null);
            setSlots([]);
        } catch (error) { alert(error.response?.data?.message || 'Error saving timetable'); }
        finally { setSaving(false); }
    };

    const handleDeleteTimetable = async (id) => {
        if (!confirm('Delete this timetable?')) return;
        try { await deleteTimetable(id); alert('Deleted!'); fetchTimetables(); }
        catch (error) { alert(error.response?.data?.message || 'Error'); }
    };

    const getSlotForCell = (day, periodNum) => slots.find(s => s.day === day && s.period === periodNum);

    const getSlotColor = (type) => {
        const colors = { Lecture: 'bg-blue-50 border-blue-200 text-blue-600', Lab: 'bg-emerald-50 border-emerald-200 text-emerald-600', Tutorial: 'bg-amber-50 border-amber-200 text-amber-600', Break: 'bg-zinc-100 border-zinc-200 text-zinc-500', Free: 'bg-zinc-50 border-zinc-200 text-zinc-400' };
        return colors[type] || colors.Lecture;
    };

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Timetable Management</h1>
                        <p className="text-zinc-500 mt-1 text-sm">Create and manage class timetables for students</p>
                    </div>
                    <button onClick={fetchTimetables} className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-xl font-medium transition-all">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Timetable Selection */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Department</label>
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Year</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                                <option value="">Select Year</option>
                                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Section</label>
                            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleCreateNew} disabled={!selectedDept || !selectedYear} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white disabled:text-zinc-500 rounded-xl font-medium transition-all">
                                <Plus className="w-4 h-4" /> New Timetable
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timetable Grid Editor */}
                {(selectedDept && selectedYear) && (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">{editingTimetable ? 'Edit Timetable' : 'Create Timetable'}</h2>
                                    <p className="text-sm text-zinc-500">{selectedDept} - Year {selectedYear} - Section {selectedSection}</p>
                                </div>
                            </div>
                            <button onClick={handleSaveTimetable} disabled={saving || slots.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 text-white disabled:text-zinc-500 rounded-xl font-medium transition-all">
                                {saving ? (<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (<Save className="w-4 h-4" />)}
                                Save Timetable
                            </button>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr>
                                        <th className="p-2 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide w-20">Time</th>
                                        {DAYS.map(day => (<th key={day} className="p-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wide">{day.slice(0, 3)}</th>))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PERIODS.map(period => (
                                        <tr key={period.num}>
                                            <td className="p-2 text-xs text-zinc-500 whitespace-nowrap">
                                                <div className="font-bold text-zinc-900">P{period.num}</div>
                                                <div>{period.start}-{period.end}</div>
                                            </td>
                                            {DAYS.map(day => {
                                                const slot = getSlotForCell(day, period.num);
                                                return (
                                                    <td key={day} className="p-1">
                                                        <button onClick={() => handleCellClick(day, period)} className={`w-full min-h-[70px] p-2 rounded-lg border transition-all text-left ${slot ? getSlotColor(slot.type) : 'bg-zinc-50 border-zinc-200 border-dashed hover:bg-zinc-100 hover:border-zinc-300'}`}>
                                                            {slot ? (
                                                                <div className="text-xs">
                                                                    <p className="font-bold truncate">{slot.subjectName}</p>
                                                                    <p className="text-[10px] opacity-70 truncate">{slot.faculty || 'TBA'}</p>
                                                                    <p className="text-[10px] opacity-70">{slot.room || '-'}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full"><Plus className="w-4 h-4 text-zinc-400" /></div>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Existing Timetables List */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                        <h2 className="text-lg font-bold text-zinc-900">Existing Timetables</h2>
                        <p className="text-sm text-zinc-500 mt-1">{timetables.length} timetables created</p>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-600 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-zinc-500 text-sm">Loading timetables...</p>
                            </div>
                        ) : timetables.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                                <p className="font-bold text-zinc-900">No timetables yet</p>
                                <p className="text-sm text-zinc-500">Create your first timetable above</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {timetables.map(tt => (
                                    <div key={tt._id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-zinc-900">{tt.department} - Year {tt.year}</h3>
                                                <p className="text-sm text-zinc-500">Section {tt.section || 'A'}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${tt.isActive ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-zinc-200 text-zinc-600'}`}>
                                                {tt.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tt.slots?.length || 0} slots</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tt.createdBy?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditTimetable(tt)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all">
                                                <Edit className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteTimetable(tt._id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Slot Edit Modal */}
                <Modal isOpen={showSlotModal} onClose={() => setShowSlotModal(false)} title={`${currentSlot?.day} - Period ${currentSlot?.period.num}`} size="md">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Select Subject (Optional)</label>
                            <select onChange={(e) => handleSubjectSelect(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                                <option value="">-- Choose from existing subjects --</option>
                                {subjects.map(s => (<option key={s._id} value={s._id}>{s.name} ({s.code})</option>))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Subject Name *</label>
                                <input type="text" value={slotForm.subjectName} onChange={(e) => setSlotForm({ ...slotForm, subjectName: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="e.g., Data Structures" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Subject Code</label>
                                <input type="text" value={slotForm.subjectCode} onChange={(e) => setSlotForm({ ...slotForm, subjectCode: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="e.g., CS201" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Type</label>
                                <select value={slotForm.type} onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400">
                                    <option value="Lecture">Lecture</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Tutorial">Tutorial</option>
                                    <option value="Break">Break</option>
                                    <option value="Free">Free</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Faculty</label>
                                <input type="text" value={slotForm.faculty} onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="Faculty name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Room</label>
                                <input type="text" value={slotForm.room} onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400" placeholder="e.g., Room 101" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-zinc-200">
                            <button onClick={handleDeleteSlot} className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={() => setShowSlotModal(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-xl font-medium hover:bg-zinc-200 transition-all">Cancel</button>
                            <button onClick={handleSaveSlot} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-all">
                                <Check className="w-4 h-4" /> Save Slot
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default StaffTimetable;
