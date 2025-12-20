import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  getExams,
  allocateSeating,
  getAvailableRoomsForExam,
  getAllSeatingRooms,
  getSeatingSchedule,
  assignInvigilators,
  getAvailableInvigilators
} from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Grid, Play, Download, CheckCircle, Clock, Users, Building,
  Sparkles, CalendarDays, Eye, AlertCircle, RefreshCw, UserCheck, X
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const SeatingAllocate = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allocating, setAllocating] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [examType, setExamType] = useState('Semester');

  // Invigilator state
  const [facultyList, setFacultyList] = useState([]);
  const [invigilatorAssignments, setInvigilatorAssignments] = useState({}); // { roomNumber: invigilatorId }

  // Schedule view state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchAllRooms();
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('seating_allocated', () => fetchExams());
    return () => socket.off('seating_allocated');
  }, [socket]);

  // Fetch available rooms when exam is selected
  useEffect(() => {
    if (selectedExam) {
      fetchAvailableRooms();
      setInvigilatorAssignments({}); // Reset assignments when exam changes
    } else {
      setAvailableRooms([]);
      setSelectedRooms([]);
      setInvigilatorAssignments({});
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data } = await getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const { data } = await getAllSeatingRooms();
      setAllRooms(data);
    } catch (error) {
      console.error('Error fetching all rooms:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data } = await getAvailableInvigilators();
      setFacultyList(data || []);
    } catch (error) {
      console.error('Error fetching invigilators:', error);
      setFacultyList([]);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const selectedExamDetails = exams.find(e => e._id === selectedExam);
      if (!selectedExamDetails) return;

      const { data } = await getAvailableRoomsForExam({
        date: selectedExamDetails.date,
        session: selectedExamDetails.session || 'FN',
        examId: selectedExam
      });

      setAvailableRooms(data.rooms || []);
      // Pre-select all available rooms
      setSelectedRooms(data.rooms?.map(r => r.roomNumber) || []);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const toggleRoom = (roomNumber) => {
    setSelectedRooms(prev =>
      prev.includes(roomNumber)
        ? prev.filter(r => r !== roomNumber)
        : [...prev, roomNumber]
    );
  };

  const setInvigilatorForRoom = (roomNumber, invigilatorId) => {
    setInvigilatorAssignments(prev => ({
      ...prev,
      [roomNumber]: invigilatorId
    }));
  };

  const handleAllocate = async () => {
    if (!selectedExam) return alert('Please select an exam');
    if (selectedRooms.length === 0) return alert('Please select at least one room');

    setAllocating(true);
    try {
      // Step 1: Allocate seating
      await allocateSeating({
        examId: selectedExam,
        roomIds: selectedRooms,
        examType
      });

      // Step 2: Assign invigilators if any are selected
      const assignments = Object.entries(invigilatorAssignments)
        .filter(([roomNumber, invigilatorId]) => invigilatorId && selectedRooms.includes(roomNumber))
        .map(([roomNumber, invigilatorId]) => ({ roomNumber, invigilatorId }));

      if (assignments.length > 0) {
        await assignInvigilators({
          examId: selectedExam,
          assignments
        });
      }

      fetchExams();
      alert(`Seating allocated successfully!${assignments.length > 0 ? ` ${assignments.length} invigilator(s) assigned.` : ''}`);
      setInvigilatorAssignments({});
    } catch (error) {
      alert('Error allocating seating: ' + (error.response?.data?.message || error.message));
    } finally {
      setAllocating(false);
    }
  };

  const handleViewSchedule = async (examId) => {
    try {
      setLoadingSchedule(true);
      const { data } = await getSeatingSchedule(examId);
      setScheduleData(data);
      setShowSchedule(true);
    } catch (error) {
      alert('Error fetching schedule: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleExport = () => {
    if (!scheduleData) return;

    const rows = [['Room', 'Seat Number', 'Roll Number', 'Student Name', 'Department']];
    scheduleData.schedule.forEach(room => {
      room.students.forEach(seat => {
        rows.push([
          room.roomNumber,
          seat.seatNumber,
          seat.student?.rollNumber || 'N/A',
          seat.student?.name || 'N/A',
          seat.student?.department || 'N/A'
        ]);
      });
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating_${scheduleData.exam?.courseCode || 'exam'}.csv`;
    a.click();
  };

  const selectedExamDetails = exams.find(e => e._id === selectedExam);
  const pendingExams = exams.filter(e => !e.seatingPublished);
  const allocatedExams = exams.filter(e => e.seatingPublished);
  const totalCapacity = selectedRooms.reduce((sum, roomNum) => {
    const room = availableRooms.find(r => r.roomNumber === roomNum);
    return sum + (room?.capacity || 0);
  }, 0);

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Seating Allocation</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              MLR-style department mixing allocation with room availability check
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-bold">
              {pendingExams.length} pending
            </span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-bold">
              {allocatedExams.length} done
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-violet-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Total Rooms</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{allRooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Available Now</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{availableRooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Selected</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{selectedRooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                <Grid className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-zinc-200 shadow-sm hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-wide">Total Capacity</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalCapacity}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Allocation Form */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shadow-sm">
                  <Grid className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Run Allocation</h2>
                  <p className="text-sm text-zinc-500">Select exam and rooms from database</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Exam Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Select Exam</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                    >
                      <option value="">-- Choose an exam --</option>
                      {exams.map(exam => (
                        <option key={exam._id} value={exam._id}>
                          {exam.courseName} ({exam.courseCode}) - {new Date(exam.date).toLocaleDateString()}
                          {exam.seatingPublished ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Exam Type</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900"
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                    >
                      <option value="Semester">Semester (1 student/seat)</option>
                      <option value="Internal">Internal (2 students/bench)</option>
                    </select>
                  </div>
                </div>

                {/* Selected Exam Details */}
                {selectedExamDetails && (
                  <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <h3 className="font-bold text-violet-900 mb-3">{selectedExamDetails.courseName}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-violet-500" />
                        <span className="text-violet-700">{new Date(selectedExamDetails.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-500" />
                        <span className="text-violet-700">{selectedExamDetails.session || 'FN'}</span>
                      </div>
                      <div>
                        <span className="text-violet-500">Dept:</span>
                        <span className="ml-2 font-bold text-violet-900">{selectedExamDetails.department}</span>
                      </div>
                      <div>
                        <span className={`font-bold ${selectedExamDetails.seatingPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {selectedExamDetails.seatingPublished ? '✓ Allocated' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Rooms from Database */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-zinc-700">
                      Available Rooms {selectedExam && `(${availableRooms.length} rooms free for this time slot)`}
                    </label>
                    {selectedExam && (
                      <button
                        onClick={fetchAvailableRooms}
                        className="flex items-center gap-1 text-violet-600 text-sm hover:text-violet-700 font-bold"
                      >
                        <RefreshCw className="w-4 h-4" /> Refresh
                      </button>
                    )}
                  </div>

                  {loadingRooms ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">Checking room availability...</p>
                    </div>
                  ) : !selectedExam ? (
                    <div className="text-center py-8 bg-zinc-50 rounded-xl border border-zinc-100">
                      <AlertCircle className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                      <p className="text-zinc-500">Select an exam to see available rooms</p>
                    </div>
                  ) : availableRooms.length === 0 ? (
                    <div className="text-center py-8 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 font-bold">No rooms available for this time slot</p>
                      <p className="text-sm text-red-500/70">Rooms may be booked for another exam</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                      {availableRooms.map((room) => (
                        <div
                          key={room.roomNumber}
                          className={`p-4 rounded-xl border transition-all ${selectedRooms.includes(room.roomNumber)
                            ? 'bg-violet-50 border-violet-200 shadow-md'
                            : 'bg-white border-zinc-200 hover:border-zinc-300'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Room Info & Selection */}
                            <button
                              onClick={() => toggleRoom(room.roomNumber)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-zinc-900">{room.hallNo || room.roomNumber}</span>
                                {selectedRooms.includes(room.roomNumber) && (
                                  <CheckCircle className="w-5 h-5 text-violet-600" />
                                )}
                              </div>
                              <div className="text-xs text-zinc-500">
                                <span>{room.building}</span> • <span>Floor {room.floor}</span>
                              </div>
                              <div className="text-sm font-bold text-violet-600 mt-1">
                                {room.capacity} seats
                              </div>
                            </button>

                            {/* Invigilator Selection */}
                            {selectedRooms.includes(room.roomNumber) && (
                              <div className="flex-shrink-0 min-w-[180px]">
                                <label className="text-xs font-bold text-zinc-500 flex items-center gap-1 mb-1 uppercase tracking-wide">
                                  <UserCheck className="w-3 h-3" /> Invigilator
                                </label>
                                <select
                                  value={invigilatorAssignments[room.roomNumber] || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setInvigilatorForRoom(room.roomNumber, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-zinc-900"
                                >
                                  <option value="">Select Staff</option>
                                  {facultyList.map(faculty => (
                                    <option key={faculty._id} value={faculty._id}>
                                      {faculty.name} {faculty.department ? `(${faculty.department})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-zinc-50 rounded-lg flex items-center justify-between border border-zinc-100">
                    <p className="text-sm text-zinc-500">
                      Selected: <strong className="text-zinc-900">{selectedRooms.length} rooms</strong> with
                      <strong className="text-zinc-900 ml-1">{totalCapacity} total seats</strong>
                    </p>
                    <p className="text-sm text-zinc-500">
                      Invigilators: <strong className="text-emerald-600">{Object.values(invigilatorAssignments).filter(Boolean).length} assigned</strong>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAllocate}
                    disabled={allocating || !selectedExam || selectedRooms.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all disabled:shadow-none"
                  >
                    {allocating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Allocating...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run MLR Allocation
                      </>
                    )}
                  </button>
                  {selectedExamDetails?.seatingPublished && (
                    <button
                      onClick={() => handleViewSchedule(selectedExam)}
                      disabled={loadingSchedule}
                      className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-3.5 rounded-xl font-bold transition-all border border-blue-200"
                    >
                      <Eye className="w-5 h-5" />
                      View Schedule
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Exams List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Exam Status</h2>
                  <p className="text-sm text-zinc-500">{pendingExams.length} pending, {allocatedExams.length} done</p>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Loading exams...</p>
                  </div>
                ) : exams.length > 0 ? (
                  exams.map(exam => (
                    <div
                      key={exam._id}
                      onClick={() => setSelectedExam(exam._id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExam === exam._id
                        ? 'bg-violet-50 border-violet-200 shadow-md'
                        : exam.seatingPublished
                          ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'
                          : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-zinc-900">{exam.courseName}</p>
                          <p className="text-sm text-zinc-500">{exam.courseCode}</p>
                          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(exam.date).toLocaleDateString()} • {exam.session || 'FN'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {exam.seatingPublished ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {exam.seatingPublished && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewSchedule(exam._id); }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="font-bold text-zinc-900">No exams found</p>
                    <p className="text-sm text-zinc-500">Create exams first</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Modal */}
        {showSchedule && scheduleData && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-zinc-200 shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Seating Schedule</h2>
                  <p className="text-sm text-zinc-500">
                    {scheduleData.exam?.courseName} - {scheduleData.totalStudents} students in {scheduleData.roomsUsed} rooms
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="p-2 bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {scheduleData.schedule.map((room, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                        <Building className="w-5 h-5 text-violet-600" />
                        Room {room.roomNumber}
                        <span className="text-sm font-normal text-zinc-500">
                          ({room.studentCount} students)
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        {room.departments.map(dept => (
                          <span key={dept} className="text-xs px-2 py-1 bg-zinc-100 text-zinc-600 rounded border border-zinc-200 font-medium">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    {room.invigilator && (
                      <p className="text-sm text-zinc-500 mb-2">
                        Invigilator: <span className="font-bold text-zinc-900">{room.invigilator.name}</span>
                      </p>
                    )}
                    <div className="bg-white rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="text-left px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-xs">Seat</th>
                            <th className="text-left px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-xs">Roll No</th>
                            <th className="text-left px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-xs">Name</th>
                            <th className="text-left px-4 py-2 font-bold text-zinc-500 uppercase tracking-wider text-xs">Dept</th>
                          </tr>
                        </thead>
                        <tbody>
                          {room.students.slice(0, 10).map((seat, sIdx) => (
                            <tr key={sIdx} className="border-t border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-2 font-bold text-zinc-900">{seat.seatNumber}</td>
                              <td className="px-4 py-2 text-zinc-600 font-medium">{seat.student?.rollNumber || 'N/A'}</td>
                              <td className="px-4 py-2 text-zinc-600">{seat.student?.name || 'N/A'}</td>
                              <td className="px-4 py-2 text-zinc-600">{seat.student?.department || 'N/A'}</td>
                            </tr>
                          ))}
                          {room.students.length > 10 && (
                            <tr className="border-t border-zinc-100">
                              <td colSpan={4} className="px-4 py-2 text-center text-zinc-500 text-xs font-medium">
                                ... and {room.students.length - 10} more students
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SeatingAllocate;
