import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getMyHallTickets, downloadHallTicket } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
    Ticket, Download, Calendar, Clock, MapPin,
    Building, QrCode, CheckCircle, AlertCircle, Eye
} from 'lucide-react';

const StudentHallTickets = () => {
    const user = useSelector(selectCurrentUser);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data } = await getMyHallTickets();
            setTickets(data || []);
        } catch (err) {
            console.error('Error fetching hall tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (ticketId) => {
        try {
            setDownloading(ticketId);
            const response = await downloadHallTicket(ticketId);

            // Create blob and download
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

    const authorizedTickets = tickets.filter(t => t.authorized);
    const pendingTickets = tickets.filter(t => !t.authorized);

    return (
        <DashboardLayout role="student" userName={user?.name}>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hall Tickets</h1>
                        <p className="text-gray-500 mt-1 text-lg">
                            Download your exam hall tickets for upcoming exams
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                            {authorizedTickets.length} ready
                        </span>
                        {pendingTickets.length > 0 && (
                            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold text-sm">
                                {pendingTickets.length} pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-lg shadow-primary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 font-medium text-sm">Total Tickets</p>
                                <p className="text-3xl font-bold mt-1"><AnimatedNumber value={tickets.length} /></p>
                            </div>
                            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Ready to Download</p>
                                <p className="text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={authorizedTickets.length} /></p>
                            </div>
                            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
                                <Download className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium text-sm">Pending Authorization</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1"><AnimatedNumber value={pendingTickets.length} /></p>
                            </div>
                            <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hall Tickets List */}
                <div className="glass-card rounded-2xl tilt-card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Your Hall Tickets</h2>
                            <p className="text-sm text-gray-500">Each ticket has a unique QR code for attendance</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-500">Loading hall tickets...</p>
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tickets.map(ticket => (
                                    <div
                                        key={ticket._id}
                                        className={`p-5 rounded-xl border-2 transition-all ${ticket.authorized
                                            ? 'bg-green-50 border-green-200 hover:shadow-md'
                                            : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-800">
                                                    {ticket.examDetails?.courseName || ticket.exam?.courseName || 'Exam'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {ticket.examDetails?.courseCode || ticket.exam?.courseCode || 'N/A'}
                                                </p>
                                            </div>
                                            {ticket.authorized ? (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Ready
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>
                                                    {ticket.subjects?.length > 0
                                                        ? `${ticket.subjects.length} subjects`
                                                        : 'TBD'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{ticket.examType || 'Semester'}</span>
                                            </div>
                                        </div>

                                        {/* Subjects List */}
                                        {ticket.subjects && ticket.subjects.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-medium text-gray-500 mb-2">Subjects:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {ticket.subjects.slice(0, 3).map((subj, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                                                            {subj.subjectCode || subj.courseName}
                                                        </span>
                                                    ))}
                                                    {ticket.subjects.length > 3 && (
                                                        <span className="px-2 py-1 text-xs text-gray-500">
                                                            +{ticket.subjects.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {ticket.authorized ? (
                                                <button
                                                    onClick={() => handleDownload(ticket._id)}
                                                    disabled={downloading === ticket._id}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg font-semibold transition-all"
                                                >
                                                    {downloading === ticket._id ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Download className="w-5 h-5" />
                                                    )}
                                                    Download PDF
                                                </button>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-2.5 rounded-lg font-medium">
                                                    <AlertCircle className="w-5 h-5" />
                                                    Awaiting Authorization
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="font-semibold text-gray-800">No Hall Tickets Yet</p>
                                <p className="text-sm text-gray-500">Hall tickets will appear here when generated for your exams</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticket Detail Modal */}
                {selectedTicket && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Hall Ticket Details</h2>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="text-center pb-4 border-b">
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {selectedTicket.studentDetails?.name || user?.name}
                                    </h3>
                                    <p className="text-gray-600">{selectedTicket.studentDetails?.rollNumber || user?.rollNumber}</p>
                                    <p className="text-sm text-gray-500">{selectedTicket.studentDetails?.department || user?.department}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Exam Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                        <p><span className="text-gray-500">Exam Type:</span> <span className="font-medium">{selectedTicket.examType || 'Semester'}</span></p>
                                        <p><span className="text-gray-500">Total Subjects:</span> <span className="font-medium">{selectedTicket.subjects?.length || 0}</span></p>
                                        <p><span className="text-gray-500">Year:</span> <span className="font-medium">{selectedTicket.year || user?.year || 'N/A'}</span></p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                                    <p className="font-medium">📍 Room & Seat information varies per exam.</p>
                                    <p className="text-blue-600">Check <strong>My Exams</strong> page for specific room/seat assignments.</p>
                                </div>

                                {selectedTicket.qrCodeImage && (
                                    <div className="text-center">
                                        <h4 className="font-semibold text-gray-700 mb-2">QR Code for Attendance</h4>
                                        <img
                                            src={selectedTicket.qrCodeImage}
                                            alt="QR Code"
                                            className="w-32 h-32 mx-auto border rounded-lg"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Scan at exam hall for attendance</p>
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

export default StudentHallTickets;
