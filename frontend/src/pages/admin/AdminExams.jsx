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
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Exam Management</h1>
            <p className="text-dark-400 text-sm mt-0.5">Create and manage exam schedules</p>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${showCreateForm ? 'text-dark-300 border border-dark-600 hover:bg-dark-700 hover:text-white' : 'text-white bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20'}`}>
            {showCreateForm ? <><X className="w-4 h-4" />Cancel</> : <><Plus className="w-4 h-4" />Create Schedule</>}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="glass-card-dark rounded-xl border border-dark-700 p-6">
            <h2 className="font-semibold text-white mb-6">New Exam Schedule</h2>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span className="text-sm font-medium text-dark-300">Schedule Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={schedule.department} onChange={e => setSchedule({ ...schedule, department: e.target.value })} className="px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                  {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'].map(d => <option key={d} value={d} className="bg-dark-900">{d}</option>)}
                </select>
                <input type="text" placeholder="Year" value={schedule.year} onChange={e => setSchedule({ ...schedule, year: e.target.value })} className="px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-dark-500" />
                <select value={schedule.examType} onChange={e => setSchedule({ ...schedule, examType: e.target.value })} className="px-3 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                  <option value="Final" className="bg-dark-900">Final</option>
                  <option value="Midterm" className="bg-dark-900">Midterm</option>
                </select>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span className="text-sm font-medium text-dark-300">Add Subjects</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                <input placeholder="Course Name" value={currentSubject.courseName} onChange={e => setCurrentSubject({ ...currentSubject, courseName: e.target.value })} className="px-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-dark-500" />
                <input placeholder="Code" value={currentSubject.courseCode} onChange={e => setCurrentSubject({ ...currentSubject, courseCode: e.target.value })} className="px-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-dark-500" />
                <input type="date" value={currentSubject.date} onChange={e => setCurrentSubject({ ...currentSubject, date: e.target.value })} className="px-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                <input type="time" value={currentSubject.startTime} onChange={e => setCurrentSubject({ ...currentSubject, startTime: e.target.value })} className="px-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                <input type="time" value={currentSubject.endTime} onChange={e => setCurrentSubject({ ...currentSubject, endTime: e.target.value })} className="px-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <button onClick={addSubjectToSchedule} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-dark-300 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors"><Plus className="w-4 h-4" />Add Subject</button>
            </div>

            {/* Subjects List */}
            {schedule.exams.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-dark-400 mb-2">Subjects ({schedule.exams.length})</p>
                <div className="space-y-2">
                  {schedule.exams.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-dark-800 p-3 rounded-lg border border-dark-700">
                      <div className="text-sm">
                        <span className="font-medium text-white">{ex.courseName}</span>
                        <span className="text-dark-400 ml-2">({ex.courseCode})</span>
                        <span className="text-dark-500 ml-3 text-xs">{new Date(ex.date).toLocaleDateString()} • {ex.startTime} - {ex.endTime}</span>
                      </div>
                      <button onClick={() => removeSubjectFromSchedule(idx)} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleCreateSchedule} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"><Check className="w-4 h-4" />Save Schedule</button>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card-dark rounded-xl border border-dark-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input type="text" placeholder="Search exams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder-dark-500" />
            </div>
            <div className="flex items-center gap-3">
              {departments.map(d => (
                <button key={d} onClick={() => setFilterDept(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterDept === d ? 'bg-violet-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'}`}>
                  {d === 'all' ? 'All' : d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hall Ticket Generation */}
        {Object.keys(groupedExams).length > 0 && (
          <div className="glass-card-dark rounded-xl border border-dark-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center"><Ticket className="w-4.5 h-4.5 text-violet-400" /></div>
              <h2 className="font-semibold text-white">Generate Hall Tickets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(groupedExams).map((group, idx) => (
                <div key={idx} className="exam-card p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">{group.department} - Year {group.year}</span>
                    <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-dark-700 text-dark-300 border border-dark-600">{group.examType}</span>
                  </div>
                  <p className="text-xs text-dark-400 mb-3">{group.exams.length} exams</p>
                  <button onClick={() => handleGenerateHallTickets(group.department, group.year, group.examType)} disabled={group.allGenerated} className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${group.allGenerated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                    {group.allGenerated ? <><Check className="w-3 h-3" />Generated</> : <><Ticket className="w-3 h-3" />Generate</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams Table */}
        <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
          <div className="p-5 border-b border-dark-700">
            <h3 className="font-semibold text-white">All Exams</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-dark-400">Loading...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Course</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Department</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Time</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-dark-400 uppercase tracking-wide">Hall Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredExams.map(exam => (
                  <tr key={exam._id} className="hover:bg-dark-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-dark-700 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-dark-400" /></div>
                        <div>
                          <p className="font-medium text-white text-sm">{exam.courseName}</p>
                          <p className="text-xs text-dark-400">{exam.courseCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">{exam.department}</td>
                    <td className="px-6 py-4 text-xs text-dark-400">{new Date(exam.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-xs text-dark-400">{exam.startTime} - {exam.endTime}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-[10px] font-medium bg-dark-700 text-dark-300 border border-dark-600">{exam.examType}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${exam.hallTicketsGenerated ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{exam.hallTicketsGenerated ? 'Generated' : 'Pending'}</span></td>
                  </tr>
                ))}
                {filteredExams.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-dark-400">No exams found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminExams;
