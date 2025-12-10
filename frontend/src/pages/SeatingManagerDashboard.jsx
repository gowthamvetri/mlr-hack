import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getExams, allocateSeating } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { Grid, CheckCircle, Clock, Download, Plus, X, Play, FileText } from 'lucide-react';

const SeatingManagerDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [rooms, setRooms] = useState([{ roomNumber: '101', capacity: 30, floor: '1' }]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await getExams();
      setExams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAllocate = async () => {
    if (!selectedExam) return alert('Select an exam');
    try {
      await allocateSeating({ examId: selectedExam, rooms });
      alert('Seating allocated successfully!');
      fetchExams();
    } catch (error) {
      alert('Error allocating seating: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExport = () => {
    if (!selectedExam) return alert('Select an exam to export');
    const exam = exams.find(e => e._id === selectedExam);
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Room,Seat,Student ID\n"
        + "101,S-1,12345\n101,S-2,67890"; // Mock data
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seating_chart_${exam.courseCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addRoom = () => {
    setRooms([...rooms, { roomNumber: '', capacity: 30, floor: '' }]);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const allocatedExams = exams.filter(e => e.seatingPublished).length;
  const pendingExams = exams.filter(e => !e.seatingPublished).length;
  const totalRoomsConfigured = rooms.filter(r => r.roomNumber).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Exams"
          value={exams.length}
          icon={FileText}
          color="primary"
        />
        <StatCard
          title="Allocated"
          value={allocatedExams}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={pendingExams}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Rooms Configured"
          value={totalRoomsConfigured}
          subtitle={`${totalCapacity} total capacity`}
          icon={Grid}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Allocation Control */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Grid className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Seating Allocation</h2>
                  <p className="text-sm text-gray-500">Configure rooms and run allocation algorithm</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Exam Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  <option value="">-- Choose an exam to allocate --</option>
                  {exams.map(exam => (
                    <option key={exam._id} value={exam._id}>
                      {exam.courseName} ({exam.courseCode}) - {new Date(exam.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rooms Configuration */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">Available Rooms</label>
                  <button 
                    onClick={addRoom} 
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Room
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {rooms.map((room, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Room Number</label>
                        <input 
                          placeholder="e.g. 101" 
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={room.roomNumber}
                          onChange={(e) => updateRoom(idx, 'roomNumber', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Capacity</label>
                        <input 
                          placeholder="30" 
                          type="number"
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={room.capacity}
                          onChange={(e) => updateRoom(idx, 'capacity', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Floor</label>
                        <input 
                          placeholder="1" 
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={room.floor}
                          onChange={(e) => updateRoom(idx, 'floor', e.target.value)}
                        />
                      </div>
                      {rooms.length > 1 && (
                        <button 
                          onClick={() => removeRoom(idx)}
                          className="mt-5 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAllocate}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Run Allocation Algorithm
                </button>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Allocation Status */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Allocation Status</h2>
                  <p className="text-sm text-gray-500">{allocatedExams} of {exams.length} allocated</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
              {exams.map(exam => (
                <div 
                  key={exam._id} 
                  className={`p-4 rounded-xl border transition-colors ${
                    exam.seatingPublished 
                      ? 'bg-green-50 border-green-100' 
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{exam.courseName}</p>
                      <p className="text-sm text-gray-500">{exam.courseCode}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(exam.date).toLocaleDateString()} • {exam.startTime}
                      </p>
                    </div>
                    {exam.seatingPublished ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Allocated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No exams found</p>
                  <p className="text-sm">Exams will appear here when scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SeatingManagerDashboard;
