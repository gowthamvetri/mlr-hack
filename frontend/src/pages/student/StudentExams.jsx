import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getStudentExams, getHallTicket, getSemesterHallTicket, getMySeating, getMyHallTickets, downloadHallTicket } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
  FileText, Download, Calendar, Clock, MapPin, CheckCircle, AlertCircle,
  XCircle, AlertTriangle, List, Building, BookOpen, ClipboardList, Ticket, QrCode, Eye
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

// Animated Counter
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const end = typeof value === 'number' ? value : 0;
    const start = prevValue.current;
    const duration = 400;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
};

const StudentExams = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('schedule');

  // Exam Schedule State
  const [exams, setExams] = useState([]);
  const [seatingData, setSeatingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [hallTicket, setHallTicket] = useState(null);
  const [semesterHallTicket, setSemesterHallTicket] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);

  // Hall Tickets State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // GSAP Animations
  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.exam-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
    }
  }, [loading, exams, activeTab]);

  useEffect(() => { fetchExams(); fetchTickets(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('exam_schedule_released', () => { fetchExams(); fetchTickets(); });
    socket.on('hall_tickets_generated', () => { fetchExams(); fetchTickets(); });
    return () => { socket.off('exam_schedule_released'); socket.off('hall_tickets_generated'); };
  }, [socket]);

  const fetchExams = async () => {
    try {
      const [examsRes, seatingRes] = await Promise.all([
        getStudentExams(),
        getMySeating().catch(() => ({ data: [] }))
      ]);
      setExams(examsRes.data || []);
      setSeatingData(Array.isArray(seatingRes.data) ? seatingRes.data : [seatingRes.data].filter(Boolean));
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const { data } = await getMyHallTickets();
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching hall tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const getSeatForExam = (examId) => seatingData.find(s => s?.exam?._id === examId || s?.exam === examId);

  const handleViewHallTicket = async (examId) => {
    try {
      setEligibilityError(null);
      const { data } = await getHallTicket(examId);
      if (!data.eligible && data.issues) {
        setEligibilityError({ issues: data.issues, attendance: data.attendance, feesPaid: data.feesPaid });
        return;
      }
      setHallTicket(data);
      setSelectedExam(examId);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.issues) {
        setEligibilityError({ issues: error.response.data.issues, attendance: error.response.data.attendance, feesPaid: error.response.data.feesPaid });
      } else {
        alert('Hall ticket not available yet');
      }
    }
  };

  const handleViewSemesterHallTicket = async () => {
    try {
      setEligibilityError(null);
      const { data } = await getSemesterHallTicket({});
      setSemesterHallTicket(data);
      setShowSemesterModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Semester hall ticket not available');
    }
  };

  const handleDownloadHallTicket = () => {
    if (!hallTicket) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hall Ticket - ${hallTicket.exam?.courseName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #8b5cf6; margin: 0; }
            .details { margin: 20px 0; }
            .row { display: flex; margin: 10px 0; }
            .label { font-weight: bold; width: 150px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MLRIT - Hall Ticket</h1>
            <p>Integrated Academic Management System</p>
          </div>
          <div class="details">
            <div class="row"><span class="label">Student Name:</span> ${user?.name}</div>
            <div class="row"><span class="label">Roll Number:</span> ${user?.rollNumber || 'N/A'}</div>
            <div class="row"><span class="label">Course:</span> ${hallTicket.exam?.courseName} (${hallTicket.exam?.courseCode})</div>
            <div class="row"><span class="label">Date:</span> ${new Date(hallTicket.exam?.date).toLocaleDateString()}</div>
            <div class="row"><span class="label">Time:</span> ${hallTicket.exam?.startTime} - ${hallTicket.exam?.endTime}</div>
            <div class="row"><span class="label">Room:</span> ${hallTicket.seating?.roomNumber || 'TBA'}</div>
            <div class="row"><span class="label">Seat:</span> ${hallTicket.seating?.seatNumber || 'TBA'}</div>
          </div>
          <div class="footer">
            <p>This is a computer-generated hall ticket. Please carry a valid ID card.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      setDownloading(ticketId);
      const response = await downloadHallTicket(ticketId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hall_ticket_${ticketId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading hall ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(null);
    }
  };

  const upcomingExams = exams.filter(e => new Date(e.date) >= new Date());
  const pastExams = exams.filter(e => new Date(e.date) < new Date());
  const readyExams = exams.filter(e => e.hallTicketsGenerated);
  const authorizedTickets = tickets.filter(t => t.authorized);
  const pendingTickets = tickets.filter(t => !t.authorized);

  return (
    <DashboardLayout>
      <div ref={pageRef} className="min-h-screen bg-dark-900 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Exams & Hall Tickets</h1>
            <p className="text-sm text-dark-400 mt-1">View schedule, download hall tickets, and manage your exams</p>
          </div>
          <button
            onClick={handleViewSemesterHallTicket}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20"
          >
            <List className="w-4 h-4" />
            Semester Hall Ticket
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 glass-card-dark border border-dark-700 p-1.5 rounded-xl w-fit shadow-lg">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'schedule'
              ? 'bg-dark-700 text-white shadow-md border border-dark-600'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
          >
            <Calendar className="w-4 h-4" />
            Exam Schedule
            {upcomingExams.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs font-bold rounded-full border border-primary-500/20">
                {upcomingExams.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'tickets'
              ? 'bg-dark-700 text-white shadow-md border border-dark-600'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
          >
            <Ticket className="w-4 h-4" />
            Hall Tickets
            {authorizedTickets.length > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/20">
                {authorizedTickets.length} ready
              </span>
            )}
          </button>
        </div>

        {/* Exam Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {loading ? (
                <>{[1, 2, 3, 4].map(i => (
                  <div key={i} className="glass-card-dark rounded-xl p-5 border border-dark-700 animate-pulse">
                    <div className="h-4 bg-dark-700 rounded w-20 mb-3"></div>
                    <div className="h-8 bg-dark-700 rounded w-16"></div>
                  </div>
                ))}</>
              ) : (
                <>
                  <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <ClipboardList className="w-4.5 h-4.5 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-dark-400 uppercase tracking-wide mb-1">Total Exams</p>
                    <p className="text-2xl font-bold text-white"><AnimatedNumber value={exams.length} /></p>
                  </div>

                  <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                        <Calendar className="w-4.5 h-4.5 text-primary-400" />
                      </div>
                      {upcomingExams.length > 0 && (
                        <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded shadow-sm">Active</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-dark-400 uppercase tracking-wide mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-white"><AnimatedNumber value={upcomingExams.length} /></p>
                  </div>

                  <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <FileText className="w-4.5 h-4.5 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-dark-400 uppercase tracking-wide mb-1">Tickets Ready</p>
                    <p className="text-2xl font-bold text-white"><AnimatedNumber value={readyExams.length} /></p>
                  </div>

                  <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-primary-500/30 hover:shadow-lg transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center group-hover:bg-dark-700 transition-colors">
                        <CheckCircle className="w-4.5 h-4.5 text-dark-400 group-hover:text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-dark-400 uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-2xl font-bold text-white"><AnimatedNumber value={pastExams.length} /></p>
                  </div>
                </>
              )}
            </div>

            {/* Eligibility Warning */}
            {eligibilityError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-5 shadow-lg shadow-red-500/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-red-500/30">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-2">Not Eligible for Hall Ticket</h3>
                    <ul className="space-y-1.5">
                      {eligibilityError.issues?.map((issue, i) => (
                        <li key={i} className="text-sm text-red-400 flex items-center gap-2 font-medium">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setEligibilityError(null)} className="mt-3 text-xs text-red-400 hover:text-red-300 hover:underline font-bold uppercase tracking-wide">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Exams */}
            <div className="glass-card-dark rounded-xl border border-dark-700 mb-6 overflow-hidden">
              <div className="p-5 border-b border-dark-700 flex items-center gap-3 bg-dark-800/30">
                <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-primary-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Upcoming Exams</h2>
                  <p className="text-xs text-dark-400 font-medium">{upcomingExams.length} scheduled</p>
                </div>
              </div>
              <div className="divide-y divide-dark-700">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-dark-400">Loading exams...</p>
                  </div>
                ) : upcomingExams.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-dark-700">
                      <Calendar className="w-5 h-5 text-dark-500" />
                    </div>
                    <p className="text-sm font-medium text-white">No upcoming exams</p>
                    <p className="text-xs text-dark-400 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  upcomingExams.map(exam => {
                    const seat = getSeatForExam(exam._id);
                    return (
                      <div key={exam._id} className="exam-card p-4 hover:bg-dark-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white text-sm">{exam.courseName}</h3>
                              <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-1.5 py-0.5 rounded">
                                {exam.courseCode}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-dark-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exam.startTime}
                              </span>
                              {seat && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <MapPin className="w-3 h-3" />
                                  Room {seat.roomNumber}, Seat {seat.seatNumber}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {exam.hallTicketsGenerated ? (
                              <button
                                onClick={() => handleViewHallTicket(exam._id)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View Ticket
                              </button>
                            ) : (
                              <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Past Exams */}
            <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
              <div className="p-5 border-b border-dark-700 flex items-center gap-3 bg-dark-800/30">
                <div className="w-9 h-9 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5 text-dark-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Past Exams</h2>
                  <p className="text-xs text-dark-400 font-medium">{pastExams.length} completed</p>
                </div>
              </div>
              <div className="divide-y divide-dark-700">
                {pastExams.length === 0 ? (
                  <div className="p-8 text-center text-sm text-dark-500">No past exams</div>
                ) : (
                  pastExams.map(exam => (
                    <div key={exam._id} className="p-4 hover:bg-dark-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{exam.courseName}</p>
                            <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(exam.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Hall Tickets Tab */}
        {activeTab === 'tickets' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-lg shadow-primary-900/20 border border-primary-500/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-primary-100 font-bold text-sm uppercase tracking-wide">Total Tickets</p>
                    <p className="text-3xl font-bold mt-1 text-white drop-shadow-sm"><AnimatedNumber value={tickets.length} /></p>
                  </div>
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="glass-card-dark rounded-2xl p-5 border border-dark-700 shadow-lg hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 font-bold text-sm uppercase tracking-wide">Ready to Download</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1 drop-shadow-sm"><AnimatedNumber value={authorizedTickets.length} /></p>
                  </div>
                  <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="glass-card-dark rounded-2xl p-5 border border-dark-700 shadow-lg hover:border-amber-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 font-bold text-sm uppercase tracking-wide">Pending Authorization</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1 drop-shadow-sm"><AnimatedNumber value={pendingTickets.length} /></p>
                  </div>
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hall Tickets List */}
            <div className="glass-card-dark rounded-2xl tilt-card overflow-hidden border border-dark-700 shadow-xl">
              <div className="p-6 border-b border-dark-700 flex items-center gap-3 bg-dark-800/30">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Hall Tickets</h2>
                  <p className="text-sm text-dark-400 font-medium">Each ticket has a unique QR code for attendance</p>
                </div>
              </div>

              <div className="p-6">
                {loadingTickets ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-dark-400 font-medium">Loading hall tickets...</p>
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tickets.map(ticket => (
                      <div
                        key={ticket._id}
                        className={`p-5 rounded-xl border-2 transition-all group ${ticket.authorized
                          ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5'
                          : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">
                              {ticket.examDetails?.courseName || ticket.exam?.courseName || 'Exam'}
                            </h3>
                            <p className="text-sm text-dark-400 font-medium mt-1">
                              {ticket.examDetails?.courseCode || ticket.exam?.courseCode || 'N/A'}
                            </p>
                          </div>
                          {ticket.authorized ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold shadow-sm">
                              <CheckCircle className="w-3 h-3" />
                              Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold shadow-sm">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-dark-300 mb-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-dark-500" />
                            <span>
                              {ticket.subjects?.length > 0
                                ? `${ticket.subjects.length} subjects`
                                : 'TBD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-dark-500" />
                            <span>{ticket.examType || 'Semester'}</span>
                          </div>
                        </div>

                        {/* Subjects List */}
                        {ticket.subjects && ticket.subjects.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold text-dark-500 uppercase tracking-wide mb-2">Subjects:</p>
                            <div className="flex flex-wrap gap-1">
                              {ticket.subjects.slice(0, 3).map((subj, idx) => (
                                <span key={idx} className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-300 border border-dark-700 font-medium">
                                  {subj.subjectCode || subj.courseName}
                                </span>
                              ))}
                              {ticket.subjects.length > 3 && (
                                <span className="px-2 py-1 text-xs text-dark-500 font-medium">
                                  +{ticket.subjects.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {ticket.authorized ? (
                            <button
                              onClick={() => handleDownloadTicket(ticket._id)}
                              disabled={downloading === ticket._id}
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-dark-700 disabled:text-dark-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/20"
                            >
                              {downloading === ticket._id ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                              Download PDF
                            </button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 bg-dark-800 border border-dark-700 text-dark-500 py-2.5 rounded-lg font-bold cursor-not-allowed">
                              <AlertCircle className="w-5 h-5" />
                              Awaiting Authorization
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 rounded-lg transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-2xl flex items-center justify-center border border-dark-700">
                      <Ticket className="w-8 h-8 text-dark-500" />
                    </div>
                    <p className="font-bold text-white text-lg">No Hall Tickets Yet</p>
                    <p className="text-sm text-dark-400 mt-1">Hall tickets will appear here when generated for your exams</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Hall Ticket Modal (Exam Schedule) */}
        <Modal isOpen={!!hallTicket} onClose={() => { setHallTicket(null); setSelectedExam(null); }} title="Hall Ticket" size="md">
          {hallTicket && (
            <div className="space-y-6">
              <div className="text-center bg-dark-800 rounded-lg p-4 border border-dark-700">
                <h3 className="font-bold text-white">{hallTicket.exam?.courseName}</h3>
                <p className="text-xs text-primary-400 mt-1 font-medium">MLRIT Academic Portal</p>
              </div>

              {hallTicket.eligible === false && hallTicket.eligibilityIssues?.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-bold text-red-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Eligibility Issues
                  </p>
                  <ul className="space-y-1">
                    {hallTicket.eligibilityIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-300 flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Student Name</label>
                  <p className="text-sm font-bold text-white mt-1">{hallTicket.student?.name || user?.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Roll Number</label>
                  <p className="text-sm font-bold text-white mt-1">{hallTicket.student?.rollNumber || user?.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Date</label>
                  <p className="text-sm font-bold text-white mt-1">{new Date(hallTicket.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Time</label>
                  <p className="text-sm font-bold text-white mt-1">{hallTicket.startTime} - {hallTicket.endTime}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Attendance</label>
                  <p className={`text-sm font-bold mt-1 ${(hallTicket.student?.attendance || 0) >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {hallTicket.student?.attendance || 0}%
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Fees Status</label>
                  <p className={`text-sm font-bold mt-1 ${hallTicket.student?.feesPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {hallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-700">
                <button
                  onClick={handleDownloadHallTicket}
                  disabled={hallTicket.eligible === false}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => { setHallTicket(null); setSelectedExam(null); }}
                  className="flex-1 py-2.5 border border-dark-700 text-dark-300 rounded-lg text-sm font-bold hover:bg-dark-800 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Semester Hall Ticket Modal */}
        <Modal
          isOpen={showSemesterModal && !!semesterHallTicket}
          onClose={() => { setShowSemesterModal(false); setSemesterHallTicket(null); }}
          title="Semester Hall Ticket"
          size="lg"
        >
          {semesterHallTicket && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
                <div>
                  <h2 className="font-bold text-white">{semesterHallTicket.semester}</h2>
                  <p className="text-xs text-primary-400 font-medium">{semesterHallTicket.examType}</p>
                </div>
                <List className="w-5 h-5 text-primary-400" />
              </div>

              {!semesterHallTicket.eligible && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-bold text-red-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Not Eligible
                  </p>
                  <ul className="space-y-1">
                    {semesterHallTicket.eligibilityIssues?.map((issue, i) => (
                      <li key={i} className="text-sm text-red-300 font-medium">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {semesterHallTicket.eligible && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Eligible for All Exams
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-4 bg-dark-800 rounded-lg text-sm border border-dark-700">
                <div><span className="text-dark-400">Name:</span> <span className="font-bold text-white ml-2">{semesterHallTicket.student?.name}</span></div>
                <div><span className="text-dark-400">Roll:</span> <span className="font-bold text-white ml-2">{semesterHallTicket.student?.rollNumber}</span></div>
                <div><span className="text-dark-400">Dept:</span> <span className="font-bold text-white ml-2">{semesterHallTicket.student?.department}</span></div>
                <div><span className="text-dark-400">Year:</span> <span className="font-bold text-white ml-2">{semesterHallTicket.student?.year}</span></div>
              </div>

              <div>
                <h3 className="font-bold text-white mb-3 text-sm">Scheduled Exams ({semesterHallTicket.totalExams})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {semesterHallTicket.exams?.map((exam, index) => (
                    <div key={exam.examId || index} className="p-3 bg-dark-900 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors">
                      <p className="font-bold text-white text-sm">{exam.courseName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-dark-400 font-medium">
                        <span className="text-primary-400 font-bold">{exam.courseCode}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exam.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.startTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-700">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`<html><head><title>Semester Hall Ticket</title></head><body><h1>Semester Hall Ticket</h1><p>Student: ${semesterHallTicket.student?.name}</p></body></html>`);
                    printWindow.print();
                  }}
                  disabled={!semesterHallTicket.eligible}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => { setShowSemesterModal(false); setSemesterHallTicket(null); }}
                  className="flex-1 py-2.5 border border-dark-700 text-dark-300 rounded-lg text-sm font-bold hover:bg-dark-800 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-dark rounded-2xl max-w-lg w-full overflow-hidden border border-dark-600 shadow-2xl">
              <div className="p-6 border-b border-dark-700 flex items-center justify-between bg-dark-800/50">
                <h2 className="text-xl font-bold text-white">Hall Ticket Details</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-dark-800 text-dark-300 border border-dark-700 rounded-lg font-bold hover:bg-dark-700 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center pb-4 border-b border-dark-700">
                  <h3 className="text-lg font-bold text-white">
                    {selectedTicket.studentDetails?.name || user?.name}
                  </h3>
                  <p className="text-primary-400 font-medium mt-1">{selectedTicket.studentDetails?.rollNumber || user?.rollNumber}</p>
                  <p className="text-sm text-dark-400 mt-1">{selectedTicket.studentDetails?.department || user?.department}</p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">Exam Information</h4>
                  <div className="bg-dark-800/50 rounded-lg p-4 space-y-2 text-sm border border-dark-700">
                    <p><span className="text-dark-400 font-medium">Exam Type:</span> <span className="font-bold text-white ml-2">{selectedTicket.examType || 'Semester'}</span></p>
                    <p><span className="text-dark-400 font-medium">Total Subjects:</span> <span className="font-bold text-white ml-2">{selectedTicket.subjects?.length || 0}</span></p>
                    <p><span className="text-dark-400 font-medium">Year:</span> <span className="font-bold text-white ml-2">{selectedTicket.year || user?.year || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-400">
                  <p className="font-bold mb-1">📍 Room & Seat information varies per exam.</p>
                  <p className="text-blue-300 opacity-90">Check the <strong className="text-blue-200">Exam Schedule</strong> tab for specific room/seat assignments.</p>
                </div>

                {selectedTicket.qrCodeImage && (
                  <div className="text-center bg-white p-4 rounded-xl border border-dark-200 mx-auto w-fit">
                    <h4 className="font-bold text-black mb-2 text-sm">QR Code for Attendance</h4>
                    <img
                      src={selectedTicket.qrCodeImage}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">Scan at exam hall</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentExams;
