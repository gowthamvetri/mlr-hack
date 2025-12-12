import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getExams, allocateSeating } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Grid, Plus, X, Play, Download, CheckCircle, Clock, Users, Building } from 'lucide-react';

import { useSocket } from '../../context/SocketContext';

const SeatingAllocate = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [rooms, setRooms] = useState([{ roomNumber: '101', capacity: 30, floor: '1' }]);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('seating_allocated', () => {
      fetchExams();
    });

    return () => {
      socket.off('seating_allocated');
    };
  }, [socket]);

  const fetchExams = async () => {
    try {
      const { data } = await getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const addRoom = () => {
    setRooms([...rooms, { roomNumber: '', capacity: 30, floor: '' }]);
  };

  const removeRoom = (index) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const handleAllocate = async () => {
    if (!selectedExam) return alert('Please select an exam');
    if (rooms.some(r => !r.roomNumber)) return alert('Please fill all room numbers');

    setAllocating(true);
    try {
      await allocateSeating({ examId: selectedExam, rooms });
      alert('Seating allocated successfully!');
      fetchExams();
    } catch (error) {
      alert('Error allocating seating: ' + (error.response?.data?.message || error.message));
    } finally {
      setAllocating(false);
    }
  };

  const handleExport = () => {
    if (!selectedExam) return alert('Select an exam to export');
    const exam = exams.find(e => e._id === selectedExam);

    // Generate mock seating data for export
    const headers = ['Room', 'Seat Number', 'Roll Number', 'Student Name'];
    const rows = [
      ['101', 'A-1', '21CS001', 'Student 1'],
      ['101', 'A-2', '21CS002', 'Student 2'],
      ['102', 'B-1', '21CS003', 'Student 3'],
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating_${exam?.courseCode || 'exam'}.csv`;
    a.click();
  };

  const selectedExamDetails = exams.find(e => e._id === selectedExam);
  const pendingExams = exams.filter(e => !e.seatingPublished);
  const allocatedExams = exams.filter(e => e.seatingPublished);
  const totalCapacity = rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Seating Allocation</h1>
        <p className="text-sm sm:text-base text-gray-500">Configure rooms and run the allocation algorithm</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{pendingExams.length}</p>
              <p className="text-sm text-gray-500">Pending Allocation</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{allocatedExams.length}</p>
              <p className="text-sm text-gray-500">Allocated</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rooms.filter(r => r.roomNumber).length}</p>
              <p className="text-sm text-gray-500">Rooms Configured</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalCapacity}</p>
              <p className="text-sm text-gray-500">Total Capacity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Allocation Form */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Grid className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Run Allocation</h2>
                  <p className="text-sm text-gray-500">Select exam and configure rooms</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Exam Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
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

              {/* Selected Exam Details */}
              {selectedExamDetails && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-gray-800 mb-2">{selectedExamDetails.courseName}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedExamDetails.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 font-medium">{selectedExamDetails.startTime} - {selectedExamDetails.endTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <span className="ml-2 font-medium">{selectedExamDetails.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 font-medium ${selectedExamDetails.seatingPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedExamDetails.seatingPublished ? 'Allocated' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rooms Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Room Configuration</label>
                  <button
                    onClick={addRoom}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Room
                  </button>
                </div>
                <div className="space-y-3">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-4 rounded-xl">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Room Number</label>
                        <input
                          placeholder="e.g. 101"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          value={room.roomNumber}
                          onChange={(e) => updateRoom(idx, 'roomNumber', e.target.value)}
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs text-gray-500 mb-1">Capacity</label>
                        <input
                          type="number"
                          placeholder="30"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          value={room.capacity}
                          onChange={(e) => updateRoom(idx, 'capacity', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Floor</label>
                        <input
                          placeholder="1"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          value={room.floor}
                          onChange={(e) => updateRoom(idx, 'floor', e.target.value)}
                        />
                      </div>
                      {rooms.length > 1 && (
                        <button
                          onClick={() => removeRoom(idx)}
                          className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Total capacity: <strong>{totalCapacity} seats</strong> across {rooms.filter(r => r.roomNumber).length} rooms
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAllocate}
                  disabled={allocating || !selectedExam}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  {allocating ? 'Allocating...' : 'Run Allocation Algorithm'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={!selectedExam}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Exams List */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Pending Allocation</h2>
              <p className="text-sm text-gray-500">{pendingExams.length} exams need seating</p>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {pendingExams.map(exam => (
                <button
                  key={exam._id}
                  onClick={() => setSelectedExam(exam._id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedExam === exam._id
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                >
                  <p className="font-medium text-gray-800">{exam.courseName}</p>
                  <p className="text-sm text-gray-500">{exam.courseCode}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(exam.date).toLocaleDateString()} • {exam.startTime}
                  </p>
                </button>
              ))}
              {pendingExams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                  <p className="font-medium">All exams allocated!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SeatingAllocate;
