import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getExams, createExamSchedule, generateBatchHallTickets } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Plus, X, Check, Calendar, Clock, Users, Ticket, Search, Filter, Trash2 } from 'lucide-react';

const AdminExams = () => {
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  // Schedule State
  const [schedule, setSchedule] = useState({
    department: 'CSE', year: '3', examType: 'Final', exams: []
  });
  const [currentSubject, setCurrentSubject] = useState({
    courseName: '', courseCode: '', date: '', startTime: '', endTime: '', duration: 180
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubjectToSchedule = () => {
    if (!currentSubject.courseName || !currentSubject.date) {
      return alert('Please fill in course name and date');
    }
    setSchedule({ ...schedule, exams: [...schedule.exams, currentSubject] });
    setCurrentSubject({ courseName: '', courseCode: '', date: '', startTime: '', endTime: '', duration: 180 });
  };

  const removeSubjectFromSchedule = (idx) => {
    setSchedule({ ...schedule, exams: schedule.exams.filter((_, i) => i !== idx) });
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (schedule.exams.length === 0) {
      return alert('Add at least one subject');
    }
    try {
      await createExamSchedule(schedule);
      setShowCreateForm(false);
      setSchedule({ department: 'CSE', year: '3', examType: 'Final', exams: [] });
      fetchExams();
      alert('Exam Schedule Created Successfully!');
    } catch (error) {
      alert('Error creating schedule');
    }
  };

  const handleGenerateHallTickets = async (dept, year, examType) => {
    try {
      const { data } = await generateBatchHallTickets({ department: dept, year, examType });
      alert(data.message);
      fetchExams();
    } catch (error) {
      alert('Error generating hall tickets');
    }
  };

  const departments = ['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || exam.department === filterDept;
    return matchesSearch && matchesDept;
  });

  // Group exams by department and year for hall ticket generation
  const groupedExams = filteredExams.reduce((acc, exam) => {
    const key = `${exam.department}-${exam.batches?.[0]}-${exam.examType}`;
    if (!acc[key]) {
      acc[key] = {
        department: exam.department,
        year: exam.batches?.[0],
        examType: exam.examType,
        exams: [],
        allGenerated: true
      };
    }
    acc[key].exams.push(exam);
    if (!exam.hallTicketsGenerated) {
      acc[key].allGenerated = false;
    }
    return acc;
  }, {});

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
          <p className="text-gray-500">Create and manage exam schedules</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${showCreateForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
          {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showCreateForm ? 'Cancel' : 'Create Exam Schedule'}
        </button>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Create New Exam Schedule</h2>

          {/* Step 1: Schedule Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              Schedule Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  value={schedule.department}
                  onChange={e => setSchedule({ ...schedule, department: e.target.value })}
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="IT">IT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Year/Semester</label>
                <input
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. 3"
                  value={schedule.year}
                  onChange={e => setSchedule({ ...schedule, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Exam Type</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  value={schedule.examType}
                  onChange={e => setSchedule({ ...schedule, examType: e.target.value })}
                >
                  <option value="Final">Final Exam</option>
                  <option value="Midterm">Midterm Exam</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Add Subjects */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Add Subjects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <input
                placeholder="Course Name"
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={currentSubject.courseName}
                onChange={e => setCurrentSubject({ ...currentSubject, courseName: e.target.value })}
              />
              <input
                placeholder="Course Code"
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={currentSubject.courseCode}
                onChange={e => setCurrentSubject({ ...currentSubject, courseCode: e.target.value })}
              />
              <input
                type="date"
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={currentSubject.date}
                onChange={e => setCurrentSubject({ ...currentSubject, date: e.target.value })}
              />
              <input
                type="time"
                placeholder="Start Time"
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={currentSubject.startTime}
                onChange={e => setCurrentSubject({ ...currentSubject, startTime: e.target.value })}
              />
              <input
                type="time"
                placeholder="End Time"
                className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={currentSubject.endTime}
                onChange={e => setCurrentSubject({ ...currentSubject, endTime: e.target.value })}
              />
            </div>
            <button
              onClick={addSubjectToSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          {/* Subjects List */}
          {schedule.exams.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Subjects to Schedule ({schedule.exams.length})
              </h4>
              <div className="space-y-2">
                {schedule.exams.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{ex.courseName}</span>
                      <span className="text-gray-500 ml-2">({ex.courseCode})</span>
                      <span className="text-gray-400 ml-3 text-sm">
                        {new Date(ex.date).toLocaleDateString()} • {ex.startTime} - {ex.endTime}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSubjectFromSchedule(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateSchedule}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
          >
            <Check className="w-5 h-5" />
            Save Exam Schedule
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hall Ticket Generation by Group */}
      {Object.keys(groupedExams).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Generate Hall Tickets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(groupedExams).map((group, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{group.department} - Year {group.year}</p>
                    <p className="text-sm text-gray-500">{group.examType} • {group.exams.length} exams</p>
                  </div>
                  {group.allGenerated ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Generated
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGenerateHallTickets(group.department, group.year, group.examType)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">All Exams ({filteredExams.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hall Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExams.map(exam => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{exam.courseName}</p>
                    <p className="text-sm text-gray-500">{exam.courseCode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-800">{new Date(exam.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{exam.startTime} - {exam.endTime}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {exam.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${exam.examType === 'Final' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {exam.examType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {exam.hallTicketsGenerated ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        Generated
                      </span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExams.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No exams found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminExams;
