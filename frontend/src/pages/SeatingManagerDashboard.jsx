import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { getExams, allocateSeating } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import AnimatedNumber from '../components/AnimatedNumber';
import gsap from 'gsap';
import {
  Grid, CheckCircle, Clock, Download, Plus, X, Play, FileText,
  Building, Users, CalendarDays, Sparkles
} from 'lucide-react';

const SeatingManagerDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [rooms, setRooms] = useState([{ roomNumber: '', capacity: 30, floor: '1' }]);

  // GSAP Animation Refs
  const pageRef = useRef(null);
  const statsRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (!pageRef.current || loading) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        if (statsRef.current) {
          const cards = statsRef.current.querySelectorAll('.stat-card');
          gsap.fromTo(cards,
            { opacity: 0, y: 25, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
          );
        }
      }, pageRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data } = await getExams();
      setExams(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedExam) return alert('Select an exam');
    try {
      setAllocating(true);
      await allocateSeating({ examId: selectedExam, rooms });
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
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Room,Seat,Student ID\n"
      + "Sample,S-1,Template";

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
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
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
      <div ref={pageRef} className="min-h-screen bg-dark-900 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Seating Dashboard</h1>
            <p className="text-dark-400 mt-1 text-sm">
              Welcome back, {user?.name || 'Manager'}! Manage exam seating allocations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold text-sm">{pendingExams} pending</span>
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm">{allocatedExams} done</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Total Exams</p>
                <p className="text-2xl font-bold text-white mt-1"><AnimatedNumber value={exams.length} /></p>
              </div>
              <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>
          <div className="stat-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Allocated</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1"><AnimatedNumber value={allocatedExams} /></p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="stat-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-amber-400 mt-1"><AnimatedNumber value={pendingExams} /></p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="stat-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 font-bold text-xs uppercase tracking-wide">Capacity</p>
                <p className="text-2xl font-bold text-blue-400 mt-1"><AnimatedNumber value={totalCapacity} /></p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Allocation Control */}
          <div className="xl:col-span-2">
            <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
              <div className="p-5 border-b border-dark-700 flex items-center gap-3 bg-dark-800/30">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Grid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Seating Allocation</h2>
                  <p className="text-sm text-dark-400">Configure rooms and run allocation</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Exam Selection */}
                <div>
                  <label className="block text-sm font-bold text-dark-300 mb-2">Select Exam</label>
                  <select
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-white"
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                  >
                    <option value="">-- Choose an exam to allocate --</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id}>
                        {exam.courseName} ({exam.courseCode}) - {new Date(exam.date).toLocaleDateString()}
                        {exam.seatingPublished ? ' ✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rooms Configuration */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-dark-300">Available Rooms</label>
                    <button
                      onClick={addRoom}
                      className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Room
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {rooms.map((room, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-dark-800 p-4 rounded-xl border border-dark-700 hover:border-dark-600 transition-all">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-dark-500 mb-1.5 uppercase tracking-wide">Room Number</label>
                          <input
                            placeholder="e.g. 101"
                            className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-white placeholder-dark-500"
                            value={room.roomNumber}
                            onChange={(e) => updateRoom(idx, 'roomNumber', e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-bold text-dark-500 mb-1.5 uppercase tracking-wide">Capacity</label>
                          <input
                            placeholder="30"
                            type="number"
                            className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-white placeholder-dark-500"
                            value={room.capacity}
                            onChange={(e) => updateRoom(idx, 'capacity', e.target.value)}
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-xs font-bold text-dark-500 mb-1.5 uppercase tracking-wide">Floor</label>
                          <input
                            placeholder="1"
                            className="w-full px-3 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-white placeholder-dark-500"
                            value={room.floor}
                            onChange={(e) => updateRoom(idx, 'floor', e.target.value)}
                          />
                        </div>
                        {rooms.length > 1 && (
                          <button
                            onClick={() => removeRoom(idx)}
                            className="mt-6 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                    <p className="text-sm text-dark-400">
                      Total: <strong className="text-white">{totalCapacity} seats</strong> across <strong className="text-white">{totalRoomsConfigured} rooms</strong>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAllocate}
                    disabled={allocating || !selectedExam}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:from-dark-700 disabled:to-dark-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all disabled:shadow-none disabled:text-dark-500"
                  >
                    {allocating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Allocating...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run Allocation
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={!selectedExam}
                    className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 disabled:bg-dark-800 disabled:text-dark-500 text-white px-6 py-3.5 rounded-xl font-bold transition-all border border-dark-700"
                  >
                    <Download className="w-5 h-5" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Allocation Status */}
          <div className="xl:col-span-1">
            <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
              <div className="p-5 border-b border-dark-700 flex items-center gap-3 bg-dark-800/30">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Allocation Status</h2>
                  <p className="text-sm text-dark-400">{allocatedExams} of {exams.length} allocated</p>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-dark-400 text-sm">Loading exams...</p>
                  </div>
                ) : exams.length > 0 ? exams.map(exam => (
                  <div
                    key={exam._id}
                    onClick={() => setSelectedExam(exam._id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExam === exam._id
                      ? 'bg-primary-500/10 border-primary-500/30 shadow-lg shadow-primary-500/5'
                      : exam.seatingPublished
                        ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                        : 'bg-dark-800/50 border-dark-700 hover:bg-dark-800 hover:border-dark-600'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-white">{exam.courseName}</p>
                        <p className="text-sm text-dark-400">{exam.courseCode}</p>
                        <p className="text-xs text-dark-500 mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(exam.date).toLocaleDateString()} • {exam.startTime}
                        </p>
                      </div>
                      {exam.seatingPublished ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700">
                      <FileText className="w-8 h-8 text-dark-500" />
                    </div>
                    <p className="font-bold text-white">No exams found</p>
                    <p className="text-sm text-dark-400">Exams will appear here when scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SeatingManagerDashboard;
