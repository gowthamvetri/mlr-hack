import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getStudentExams, getHallTicket, getSemesterHallTicket } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { FileText, Download, Calendar, Clock, MapPin, CheckCircle, AlertCircle, XCircle, AlertTriangle, List } from 'lucide-react';

import { useSocket } from '../../context/SocketContext';

const StudentExams = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [hallTicket, setHallTicket] = useState(null);
  const [semesterHallTicket, setSemesterHallTicket] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('exam_schedule_released', () => {
      fetchExams();
    });

    socket.on('hall_tickets_generated', () => {
      fetchExams();
    });

    return () => {
      socket.off('exam_schedule_released');
      socket.off('hall_tickets_generated');
    };
  }, [socket]);

  const fetchExams = async () => {
    try {
      const { data } = await getStudentExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHallTicket = async (examId) => {
    try {
      setEligibilityError(null);
      const { data } = await getHallTicket(examId);

      if (!data.eligible && data.issues) {
        setEligibilityError({
          issues: data.issues,
          attendance: data.attendance,
          feesPaid: data.feesPaid
        });
        return;
      }

      setHallTicket(data);
      setSelectedExam(examId);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.issues) {
        setEligibilityError({
          issues: error.response.data.issues,
          attendance: error.response.data.attendance,
          feesPaid: error.response.data.feesPaid
        });
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
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Semester hall ticket not available');
      }
    }
  };

  const handleDownloadHallTicket = () => {
    if (!hallTicket) return;
    // Create a simple printable version
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hall Ticket - ${hallTicket.exam?.courseName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #D50000; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #D50000; margin: 0; }
            .details { margin: 20px 0; }
            .row { display: flex; margin: 10px 0; }
            .label { font-weight: bold; width: 150px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MLRIT - Hall Ticket</h1>
            <p>Integrated Academic and Examination Management System</p>
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

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Exams</h1>
          <p className="text-gray-500 mt-1 text-lg">View your exam schedule and download hall tickets</p>
        </div>
        <button
          onClick={handleViewSemesterHallTicket}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all shadow-lg shadow-gray-200 hover:shadow-xl active:scale-95"
        >
          <List className="w-5 h-5" />
          Semester Hall Ticket
        </button>
      </div>

      {/* Eligibility Warning */}
      {eligibilityError && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6 animate-slide-in-up shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Not Eligible for Hall Ticket</h3>
              <p className="text-red-700 mt-1">Please address the following issues to generate your hall ticket:</p>
              <ul className="mt-4 space-y-3">
                {eligibilityError.issues?.map((issue, i) => (
                  <li key={i} className="text-sm font-medium text-red-800 flex items-center gap-2 bg-white/50 px-3 py-2 rounded-lg border border-red-100">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-red-600">
                Please contact the staff office to resolve these issues before downloading your hall ticket.
              </p>
              <button
                onClick={() => setEligibilityError(null)}
                className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Exams */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in hover-card">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upcoming Exams</h2>
              <p className="text-gray-500 mt-1">{upcomingExams.length} exams scheduled</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {loading ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p>Loading exams...</p>
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-semibold text-gray-900 text-lg">No upcoming exams</p>
              <p className="text-gray-500">You're all caught up for now!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingExams.map(exam => (
                <div key={exam._id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-primary-200 hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{exam.courseName}</h3>
                        <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100">
                          {exam.courseCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {exam.startTime} - {exam.endTime}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {exam.venue || 'TBA'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {exam.hallTicketsGenerated ? (
                        <button
                          onClick={() => handleViewHallTicket(exam._id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-200"
                        >
                          <FileText className="w-4 h-4" />
                          View Hall Ticket
                        </button>
                      ) : (
                        <span className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold border border-amber-100">
                          <Clock className="w-4 h-4" />
                          Hall Ticket Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past Exams */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in hover-card">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Past Exams</h2>
              <p className="text-gray-500 mt-1">{pastExams.length} completed</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {pastExams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No past exams</div>
          ) : (
            <div className="space-y-3">
              {pastExams.map(exam => (
                <div key={exam._id} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                  <div>
                    <p className="font-bold text-gray-900 text-lg mb-1">{exam.courseName} <span className="text-gray-400 font-normal text-sm ml-2">{exam.courseCode}</span></p>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(exam.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hall Ticket Modal */}
      <Modal
        isOpen={!!hallTicket}
        onClose={() => { setHallTicket(null); setSelectedExam(null); }}
        title="Hall Ticket"
        size="md"
      >
        {hallTicket && (
          <div className="space-y-6">
            <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{hallTicket.exam?.courseName}</h3>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">MLRIT Academic Portal</p>
            </div>

            {hallTicket.eligible === false && hallTicket.eligibilityIssues?.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
                <p className="text-red-800 font-bold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Eligibility Issues
                </p>
                <ul className="space-y-1">
                  {hallTicket.eligibilityIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{hallTicket.student?.name || user?.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{hallTicket.student?.rollNumber || user?.rollNumber || 'N/A'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{hallTicket.courseName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course Code</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{hallTicket.courseCode}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{new Date(hallTicket.date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</label>
                <p className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{hallTicket.startTime} - {hallTicket.endTime}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance</label>
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className={`w-2 h-2 rounded-full ${(hallTicket.student?.attendance || 0) >= 75 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className={`font-bold ${(hallTicket.student?.attendance || 0) >= 75 ? 'text-green-700' : 'text-red-700'}`}>
                    {hallTicket.student?.attendance || 0}%
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fees Status</label>
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className={`w-2 h-2 rounded-full ${hallTicket.student?.feesPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className={`font-bold ${hallTicket.student?.feesPaid ? 'text-green-700' : 'text-red-700'}`}>
                    {hallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleDownloadHallTicket}
                disabled={hallTicket.eligible === false}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download / Print
              </button>
              <button
                onClick={() => { setHallTicket(null); setSelectedExam(null); }}
                className="flex-1 px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
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
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{semesterHallTicket.semester}</h2>
                <p className="text-primary-700 dark:text-primary-400 text-sm font-medium">{semesterHallTicket.examType}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                <List className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            {/* Eligibility Status */}
            {!semesterHallTicket.eligible && (
              <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-8">
                <div className="flex items-center gap-3 text-red-900 dark:text-red-200 font-bold mb-3 text-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  Not Eligible for Hall Ticket
                </div>
                <ul className="text-red-800 dark:text-red-300 space-y-2 ml-1">
                  {semesterHallTicket.eligibilityIssues?.map((issue, i) => (
                    <li key={i} className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {semesterHallTicket.eligible && (
              <div className="p-5 bg-green-50 border border-green-200 rounded-2xl mb-8">
                <div className="flex items-center gap-3 text-green-900 font-bold text-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Eligible for All Exams
                </div>
              </div>
            )}

            {/* Student Details */}
            <div className="grid grid-cols-2 text-sm gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</label>
                <p className="font-semibold text-gray-900 dark:text-white">{semesterHallTicket.student?.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll Number</label>
                <p className="font-semibold text-gray-900 dark:text-white">{semesterHallTicket.student?.rollNumber}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</label>
                <p className="font-semibold text-gray-900 dark:text-white">{semesterHallTicket.student?.department}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Year</label>
                <p className="font-semibold text-gray-900 dark:text-white">{semesterHallTicket.student?.year}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(semesterHallTicket.student?.attendance || 0) >= 75 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                  {semesterHallTicket.student?.attendance || 0}%
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fees Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${semesterHallTicket.student?.feesPaid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                  {semesterHallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Exam List */}
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-base border-b dark:border-gray-700 pb-2">Scheduled Exams <span className="text-gray-400 font-medium ml-2">({semesterHallTicket.totalExams})</span></h3>
            <div className="space-y-3">
              {semesterHallTicket.exams?.map((exam, index) => (
                <div key={exam.examId || index} className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{exam.courseName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">{exam.courseCode}</span>
                        <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-bold border border-primary-100 dark:border-primary-800">
                          {exam.examType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      {new Date(exam.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      {exam.startTime} - {exam.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <h4 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2 text-base">Instructions</h4>
              <ul className="text-yellow-800 dark:text-yellow-300 space-y-1.5 ml-1 text-sm">
                {semesterHallTicket.instructions?.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-2 font-medium">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Semester Hall Ticket</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 40px; }
                          .header { text-align: center; border-bottom: 2px solid #D50000; padding-bottom: 20px; margin-bottom: 20px; }
                          .header h1 { color: #D50000; margin: 0; }
                          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                          .exam-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                          .exam-table th, .exam-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                          .exam-table th { background: #f5f5f5; }
                          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                          .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
                          .eligible { background: #d4edda; color: #155724; }
                          .not-eligible { background: #f8d7da; color: #721c24; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>MLRIT - Semester Hall Ticket</h1>
                          <p>${semesterHallTicket.semester} | ${semesterHallTicket.examType}</p>
                        </div>
                        <div class="student-info">
                          <div><strong>Name:</strong> ${semesterHallTicket.student?.name}</div>
                          <div><strong>Roll Number:</strong> ${semesterHallTicket.student?.rollNumber}</div>
                          <div><strong>Department:</strong> ${semesterHallTicket.student?.department}</div>
                          <div><strong>Year:</strong> ${semesterHallTicket.student?.year}</div>
                          <div><strong>Attendance:</strong> ${semesterHallTicket.student?.attendance}%</div>
                          <div><strong>Fees:</strong> ${semesterHallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}</div>
                        </div>
                        <span class="status ${semesterHallTicket.eligible ? 'eligible' : 'not-eligible'}">
                          ${semesterHallTicket.eligible ? '✓ Eligible for Exams' : '✗ Not Eligible - Contact Staff Office'}
                        </span>
                        <table class="exam-table">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Course</th>
                              <th>Code</th>
                              <th>Date</th>
                              <th>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${semesterHallTicket.exams?.map((exam, i) => `
                              <tr>
                                <td>${i + 1}</td>
                                <td>${exam.courseName}</td>
                                <td>${exam.courseCode}</td>
                                <td>${new Date(exam.date).toLocaleDateString()}</td>
                                <td>${exam.startTime} - ${exam.endTime}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        <div class="footer">
                          <p>This is a computer-generated hall ticket. Please carry a valid ID card.</p>
                          <p>Generated on: ${new Date().toLocaleString()}</p>
                        </div>
                      </body>
    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
                disabled={!semesterHallTicket.eligible}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download / Print
              </button>
              <button
                onClick={() => { setShowSemesterModal(false); setSemesterHallTicket(null); }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default StudentExams;
