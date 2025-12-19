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
                        <h1 className="text-3xl font-bold text-white tracking-tight">Hall Tickets</h1>
                        <p className="text-dark-400 mt-1 text-lg">
                            Download your exam hall tickets for upcoming exams
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm shadow-sm">
                            {authorizedTickets.length} ready
                        </span>
                        {pendingTickets.length > 0 && (
                            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold text-sm shadow-sm">
                                {pendingTickets.length} pending
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {loading ? (
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
                                                    onClick={() => handleDownload(ticket._id)}
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
                                    <p className="text-blue-300 opacity-90">Check <strong className="text-blue-200">My Exams</strong> page for specific room/seat assignments.</p>
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

export default StudentHallTickets;
