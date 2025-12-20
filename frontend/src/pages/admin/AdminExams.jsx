import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getExams, createExamSchedule, generateBatchHallTickets } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import { FileText, Plus, X, Check, Calendar, Clock, Users, Ticket, Search, Filter, Trash2 } from 'lucide-react';

const AdminExams = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [schedule, setSchedule] = useState({ department: 'CSE', year: '3', examType: 'Final', exams: [] });
  const [currentSubject, setCurrentSubject] = useState({ courseName: '', courseCode: '', date: '', startTime: '', endTime: '', duration: 180 });

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.exam-card', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    }
  }, [loading, exams]);

  const fetchExams = async () => {
    try { const { data } = await getExams(); setExams(data); }
    catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const addSubjectToSchedule = () => {
    if (!currentSubject.courseName || !currentSubject.date) { alert('Fill course name and date'); return; }
    setSchedule({ ...schedule, exams: [...schedule.exams, currentSubject] });
    setCurrentSubject({ courseName: '', courseCode: '', date: '', startTime: '', endTime: '', duration: 180 });
  };

  const removeSubjectFromSchedule = (idx) => setSchedule({ ...schedule, exams: schedule.exams.filter((_, i) => i !== idx) });

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (schedule.exams.length === 0) { alert('Add at least one subject'); return; }
    try {
      await createExamSchedule(schedule);
      setShowCreateForm(false);
      setSchedule({ department: 'CSE', year: '3', examType: 'Final', exams: [] });
      fetchExams();
      alert('Schedule created!');
    } catch (error) { alert('Error creating schedule'); }
  };

  const handleGenerateHallTickets = async (dept, year, examType) => {
    try { const { data } = await generateBatchHallTickets({ department: dept, year, examType }); alert(data.message); fetchExams(); }
    catch (error) { alert('Error generating hall tickets'); }
  };

  const departments = ['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || exam.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const groupedExams = filteredExams.reduce((acc, exam) => {
    const key = `${exam.department}-${exam.batches?.[0]}-${exam.examType}`;
    if (!acc[key]) acc[key] = { department: exam.department, year: exam.batches?.[0], examType: exam.examType, exams: [], allGenerated: true };
    acc[key].exams.push(exam);
    if (!exam.hallTicketsGenerated) acc[key].allGenerated = false;
    return acc;
  }, {});

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto text-zinc-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Exam Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5 font-medium">Create and manage exam schedules</p>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${showCreateForm ? 'text-zinc-600 border border-zinc-200 hover:bg-zinc-50' : 'text-white bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20'}`}>
            {showCreateForm ? <><X className="w-4 h-4" />Cancel</> : <><Plus className="w-4 h-4" />Create Schedule</>}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 mb-6">New Exam Schedule</h2>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm font-bold text-zinc-500">Schedule Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={schedule.department} onChange={e => setSchedule({ ...schedule, department: e.target.value })} className="px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium">
                  {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="text" placeholder="Year" value={schedule.year} onChange={e => setSchedule({ ...schedule, year: e.target.value })} className="px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-zinc-400 font-medium" />
                <select value={schedule.examType} onChange={e => setSchedule({ ...schedule, examType: e.target.value })} className="px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium">
                  <option value="Final">Final</option>
                  <option value="Midterm">Midterm</option>
                </select>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm font-bold text-zinc-500">Add Subjects</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <input placeholder="Course Name" value={currentSubject.courseName} onChange={e => setCurrentSubject({ ...currentSubject, courseName: e.target.value })} className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-zinc-400 font-medium" />
                <input placeholder="Code" value={currentSubject.courseCode} onChange={e => setCurrentSubject({ ...currentSubject, courseCode: e.target.value })} className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-zinc-400 font-medium" />
                <input type="date" value={currentSubject.date} onChange={e => setCurrentSubject({ ...currentSubject, date: e.target.value })} className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium" />
                <input type="time" value={currentSubject.startTime} onChange={e => setCurrentSubject({ ...currentSubject, startTime: e.target.value })} className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium" />
                <input type="time" value={currentSubject.endTime} onChange={e => setCurrentSubject({ ...currentSubject, endTime: e.target.value })} className="px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium" />
              </div>
              <button onClick={addSubjectToSchedule} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors"><Plus className="w-4 h-4" />Add Subject</button>
            </div>

            {/* Subjects List */}
            {schedule.exams.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-zinc-500 mb-2">Subjects ({schedule.exams.length})</p>
                <div className="space-y-2">
                  {schedule.exams.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                      <div className="text-sm">
                        <span className="font-bold text-zinc-900">{ex.courseName}</span>
                        <span className="text-zinc-500 ml-2 font-medium">({ex.courseCode})</span>
                        <span className="text-zinc-400 ml-3 text-xs font-medium">{new Date(ex.date).toLocaleDateString()} • {ex.startTime} - {ex.endTime}</span>
                      </div>
                      <button onClick={() => removeSubjectFromSchedule(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleCreateSchedule} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"><Check className="w-4 h-4" />Save Schedule</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search exams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" />
            </div>
            <div className="flex items-center gap-3">
              {departments.map(d => (
                <button key={d} onClick={() => setFilterDept(d)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterDept === d ? 'bg-zinc-900 text-white shadow-md' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                  {d === 'all' ? 'All' : d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hall Ticket Generation */}
        {Object.keys(groupedExams).length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center"><Ticket className="w-4.5 h-4.5 text-violet-600" /></div>
              <h2 className="font-bold text-zinc-900">Generate Hall Tickets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(groupedExams).map((group, idx) => (
                <div key={idx} className="exam-card p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-zinc-900">{group.department} - Year {group.year}</span>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white text-zinc-600 border border-zinc-200 shadow-sm">{group.examType}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 font-medium">{group.exams.length} exams</p>
                  <button onClick={() => handleGenerateHallTickets(group.department, group.year, group.examType)} disabled={group.allGenerated} className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${group.allGenerated ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'}`}>
                    {group.allGenerated ? <><Check className="w-3 h-3" />Generated</> : <><Ticket className="w-3 h-3" />Generate</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-200">
            <h3 className="font-bold text-zinc-900">All Exams</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">Loading...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Course</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Department</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Time</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Hall Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredExams.map(exam => (
                  <tr key={exam._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100"><FileText className="w-4 h-4 text-zinc-400" /></div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{exam.courseName}</p>
                          <p className="text-xs text-zinc-500 font-medium">{exam.courseCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{exam.department}</td>
                    <td className="px-6 py-4 text-xs text-zinc-600 font-medium">{new Date(exam.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-zinc-600 font-medium">{exam.startTime} - {exam.endTime}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">{exam.examType}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${exam.hallTicketsGenerated ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{exam.hallTicketsGenerated ? 'Generated' : 'Pending'}</span></td>
                  </tr>
                ))}
                {filteredExams.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-zinc-500 font-medium">No exams found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminExams;
