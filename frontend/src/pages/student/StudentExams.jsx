import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getStudentExams, getHallTicket, getSemesterHallTicket, getMySeating } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
  FileText, Download, Calendar, Clock, MapPin, CheckCircle, AlertCircle,
  XCircle, AlertTriangle, List, Building, BookOpen, ClipboardList
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
  const [exams, setExams] = useState([]);
  const [seatingData, setSeatingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [hallTicket, setHallTicket] = useState(null);
  const [semesterHallTicket, setSemesterHallTicket] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);

  // GSAP Animations
  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.exam-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
    }
  }, [loading, exams]);

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('exam_schedule_released', () => fetchExams());
    socket.on('hall_tickets_generated', () => fetchExams());
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

  const upcomingExams = exams.filter(e => new Date(e.date) >= new Date());
  const pastExams = exams.filter(e => new Date(e.date) < new Date());
  const readyExams = exams.filter(e => e.hallTicketsGenerated);

  return (
    <DashboardLayout>
      <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Exams</h1>
            <p className="text-sm text-zinc-500 mt-1">View schedule and download hall tickets</p>
          </div>
          <button
            onClick={handleViewSemesterHallTicket}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <List className="w-4 h-4" />
            Semester Hall Ticket
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>{[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-zinc-100 animate-pulse">
                <div className="h-4 bg-zinc-200 rounded w-20 mb-3"></div>
                <div className="h-8 bg-zinc-200 rounded w-16"></div>
              </div>
            ))}</>
          ) : (
            <>
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ClipboardList className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Exams</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={exams.length} /></p>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5 text-violet-500" />
                  </div>
                  {upcomingExams.length > 0 && (
                    <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Upcoming</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={upcomingExams.length} /></p>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Hall Tickets Ready</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={readyExams.length} /></p>
              </div>

              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <CheckCircle className="w-4.5 h-4.5 text-zinc-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Completed</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={pastExams.length} /></p>
              </div>
            </>
          )}
        </div>

        {/* Eligibility Warning */}
        {eligibilityError && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Not Eligible for Hall Ticket</h3>
                <ul className="space-y-1.5">
                  {eligibilityError.issues?.map((issue, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setEligibilityError(null)} className="mt-3 text-xs text-red-600 hover:underline">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl border border-zinc-100 mb-6 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-violet-500" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Upcoming Exams</h2>
              <p className="text-xs text-zinc-500">{upcomingExams.length} scheduled</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-50">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Loading exams...</p>
              </div>
            ) : upcomingExams.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700">No upcoming exams</p>
                <p className="text-xs text-zinc-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              upcomingExams.map(exam => {
                const seat = getSeatForExam(exam._id);
                return (
                  <div key={exam._id} className="exam-card p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-zinc-900 text-sm">{exam.courseName}</h3>
                          <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                            {exam.courseCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exam.startTime}
                          </span>
                          {seat && (
                            <span className="flex items-center gap-1 text-emerald-600">
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
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Ticket
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
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
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5 text-zinc-500" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Past Exams</h2>
              <p className="text-xs text-zinc-500">{pastExams.length} completed</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-50">
            {pastExams.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No past exams</div>
            ) : (
              pastExams.map(exam => (
                <div key={exam._id} className="p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{exam.courseName}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(exam.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Completed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hall Ticket Modal */}
        <Modal isOpen={!!hallTicket} onClose={() => { setHallTicket(null); setSelectedExam(null); }} title="Hall Ticket" size="md">
          {hallTicket && (
            <div className="space-y-6">
              <div className="text-center bg-zinc-50 rounded-lg p-4">
                <h3 className="font-semibold text-zinc-900">{hallTicket.exam?.courseName}</h3>
                <p className="text-xs text-violet-600 mt-1">MLRIT Academic Portal</p>
              </div>

              {hallTicket.eligible === false && hallTicket.eligibilityIssues?.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="font-medium text-red-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Eligibility Issues
                  </p>
                  <ul className="space-y-1">
                    {hallTicket.eligibilityIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Student Name</label>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{hallTicket.student?.name || user?.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Roll Number</label>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{hallTicket.student?.rollNumber || user?.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Date</label>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{new Date(hallTicket.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Time</label>
                  <p className="text-sm font-medium text-zinc-900 mt-1">{hallTicket.startTime} - {hallTicket.endTime}</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Attendance</label>
                  <p className={`text-sm font-medium mt-1 ${(hallTicket.student?.attendance || 0) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {hallTicket.student?.attendance || 0}%
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 uppercase">Fees Status</label>
                  <p className={`text-sm font-medium mt-1 ${hallTicket.student?.feesPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                    {hallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  onClick={handleDownloadHallTicket}
                  disabled={hallTicket.eligible === false}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => { setHallTicket(null); setSelectedExam(null); }}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50"
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
              <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg border border-violet-100">
                <div>
                  <h2 className="font-semibold text-zinc-900">{semesterHallTicket.semester}</h2>
                  <p className="text-xs text-violet-600">{semesterHallTicket.examType}</p>
                </div>
                <List className="w-5 h-5 text-violet-500" />
              </div>

              {!semesterHallTicket.eligible && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="font-medium text-red-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Not Eligible
                  </p>
                  <ul className="space-y-1">
                    {semesterHallTicket.eligibilityIssues?.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {semesterHallTicket.eligible && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="font-medium text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Eligible for All Exams
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-lg text-sm">
                <div><span className="text-zinc-500">Name:</span> <span className="font-medium text-zinc-900">{semesterHallTicket.student?.name}</span></div>
                <div><span className="text-zinc-500">Roll:</span> <span className="font-medium text-zinc-900">{semesterHallTicket.student?.rollNumber}</span></div>
                <div><span className="text-zinc-500">Dept:</span> <span className="font-medium text-zinc-900">{semesterHallTicket.student?.department}</span></div>
                <div><span className="text-zinc-500">Year:</span> <span className="font-medium text-zinc-900">{semesterHallTicket.student?.year}</span></div>
              </div>

              <div>
                <h3 className="font-medium text-zinc-900 mb-3 text-sm">Scheduled Exams ({semesterHallTicket.totalExams})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {semesterHallTicket.exams?.map((exam, index) => (
                    <div key={exam.examId || index} className="p-3 bg-white border border-zinc-100 rounded-lg">
                      <p className="font-medium text-zinc-900 text-sm">{exam.courseName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="text-violet-600 font-medium">{exam.courseCode}</span>
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

              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`<html><head><title>Semester Hall Ticket</title></head><body><h1>Semester Hall Ticket</h1><p>Student: ${semesterHallTicket.student?.name}</p></body></html>`);
                    printWindow.print();
                  }}
                  disabled={!semesterHallTicket.eligible}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => { setShowSemesterModal(false); setSemesterHallTicket(null); }}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StudentExams;
