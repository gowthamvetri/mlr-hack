import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentExams, getHallTicket } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Download, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const StudentExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [hallTicket, setHallTicket] = useState(null);

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
      const { data } = await getHallTicket(examId);
      setHallTicket(data);
      setSelectedExam(examId);
    } catch (error) {
      alert('Hall ticket not available yet');
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Exams</h1>
        <p className="text-gray-500">View your exam schedule and download hall tickets</p>
      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Student Name</label>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Roll Number</label>
                  <p className="font-medium">{user?.rollNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course</label>
                  <p className="font-medium">{hallTicket.exam?.courseName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Course Code</label>
                  <p className="font-medium">{hallTicket.exam?.courseCode}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date</label>
                  <p className="font-medium">{new Date(hallTicket.exam?.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Time</label>
                  <p className="font-medium">{hallTicket.exam?.startTime} - {hallTicket.exam?.endTime}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Room Number</label>
                  <p className="font-medium text-primary-600">{hallTicket.seating?.roomNumber || 'TBA'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Seat Number</label>
                  <p className="font-medium text-primary-600">{hallTicket.seating?.seatNumber || 'TBA'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleDownloadHallTicket}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors"
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
    </DashboardLayout>
  );
};

export default StudentExams;
