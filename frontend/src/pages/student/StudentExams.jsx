import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentExams, getHallTicket, getSemesterHallTicket } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Download, Calendar, Clock, MapPin, CheckCircle, AlertCircle, XCircle, AlertTriangle, List } from 'lucide-react';

const StudentExams = () => {
  const { user } = useAuth();
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
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Exams</h1>
          <p className="text-sm sm:text-base text-gray-500">View your exam schedule and download hall tickets</p>
        </div>
        <button
          onClick={handleViewSemesterHallTicket}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <List className="w-5 h-5" />
          Semester Hall Ticket
        </button>
      </div>

      {/* Eligibility Warning */}
      {eligibilityError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Not Eligible for Hall Ticket</h3>
              <ul className="mt-2 space-y-1">
                {eligibilityError.issues?.map((issue, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Upcoming Exams</h2>
              <p className="text-sm text-gray-500">{upcomingExams.length} exams scheduled</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading exams...</div>
          ) : upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming exams</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map(exam => (
                <div key={exam._id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{exam.courseName}</h3>
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {exam.courseCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.startTime} - {exam.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {exam.venue || 'TBA'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {exam.hallTicketsGenerated ? (
                        <button
                          onClick={() => handleViewHallTicket(exam._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Hall Ticket
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
                          <AlertCircle className="w-4 h-4" />
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Past Exams</h2>
              <p className="text-sm text-gray-500">{pastExams.length} completed</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {pastExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No past exams</div>
          ) : (
            <div className="space-y-3">
              {pastExams.map(exam => (
                <div key={exam._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{exam.courseName} ({exam.courseCode})</p>
                    <p className="text-sm text-gray-500">{new Date(exam.date).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hall Ticket Modal */}
      {hallTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-100 bg-primary-600 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Hall Ticket</h2>
              <p className="text-primary-100 text-sm">MLRIT Academic Portal</p>
            </div>
            <div className="p-6 space-y-4">
              {hallTicket.eligible === false && hallTicket.eligibilityIssues?.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-red-800 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Eligibility Issues
                  </p>
                  <ul className="mt-2 text-sm text-red-700">
                    {hallTicket.eligibilityIssues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Student Name</label>
                  <p className="font-medium">{hallTicket.student?.name || user?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Roll Number</label>
                  <p className="font-medium">{hallTicket.student?.rollNumber || user?.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course</label>
                  <p className="font-medium">{hallTicket.courseName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course Code</label>
                  <p className="font-medium">{hallTicket.courseCode}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date</label>
                  <p className="font-medium">{new Date(hallTicket.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Time</label>
                  <p className="font-medium">{hallTicket.startTime} - {hallTicket.endTime}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Attendance</label>
                  <p className={`font-medium ${(hallTicket.student?.attendance || 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {hallTicket.student?.attendance || 0}%
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fees Status</label>
                  <p className={`font-medium ${hallTicket.student?.feesPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {hallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleDownloadHallTicket}
                disabled={hallTicket.eligible === false}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download / Print
              </button>
              <button
                onClick={() => { setHallTicket(null); setSelectedExam(null); }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Semester Hall Ticket Modal */}
      {showSemesterModal && semesterHallTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-primary-600 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Semester Hall Ticket</h2>
              <p className="text-primary-100 text-sm">{semesterHallTicket.semester} - {semesterHallTicket.examType}</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Eligibility Status */}
              {!semesterHallTicket.eligible && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Not Eligible for Hall Ticket
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {semesterHallTicket.eligibilityIssues?.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {semesterHallTicket.eligible && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <div className="flex items-center gap-2 text-green-800 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Eligible for All Exams
                  </div>
                </div>
              )}

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-xs text-gray-500">Student Name</label>
                  <p className="font-medium">{semesterHallTicket.student?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Roll Number</label>
                  <p className="font-medium">{semesterHallTicket.student?.rollNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Department</label>
                  <p className="font-medium">{semesterHallTicket.student?.department}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Year</label>
                  <p className="font-medium">{semesterHallTicket.student?.year}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Attendance</label>
                  <p className={`font-medium ${(semesterHallTicket.student?.attendance || 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {semesterHallTicket.student?.attendance || 0}%
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fees Status</label>
                  <p className={`font-medium ${semesterHallTicket.student?.feesPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {semesterHallTicket.student?.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Exam List */}
              <h3 className="font-semibold text-gray-800 mb-3">Scheduled Exams ({semesterHallTicket.totalExams})</h3>
              <div className="space-y-3">
                {semesterHallTicket.exams?.map((exam, index) => (
                  <div key={exam.examId || index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{exam.courseName}</h4>
                        <p className="text-sm text-gray-500">{exam.courseCode}</p>
                      </div>
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {exam.examType}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(exam.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.startTime} - {exam.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Instructions</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {semesterHallTicket.instructions?.map((instruction, i) => (
                    <li key={i}>• {instruction}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
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
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentExams;
