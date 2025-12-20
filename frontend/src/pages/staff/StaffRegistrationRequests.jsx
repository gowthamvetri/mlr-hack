import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';
import gsap from 'gsap';
import {
    Users, Building, CheckCircle, XCircle, Clock,
    Search, Eye, AlertCircle, UserPlus, RefreshCw, Loader
} from 'lucide-react';

// Animated counter
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        const duration = 500;
        const start = displayValue;
        const end = typeof value === 'number' ? value : parseInt(value) || 0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span className="tabular-nums">{displayValue}</span>;
};

const StaffRegistrationRequests = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'all', role: 'all', search: '' });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [comment, setComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchStats(); fetchRequests(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        }
    }, [loading]);

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;
        socket.on('registration_request_created', (newRequest) => { setRequests(prev => [newRequest, ...prev]); fetchStats(); });
        socket.on('registration_request_updated', (updatedRequest) => { setRequests(prev => prev.map(req => req._id === updatedRequest._id ? updatedRequest : req)); fetchStats(); });
        return () => { socket.off('registration_request_created'); socket.off('registration_request_updated'); };
    }, [socket]);

    useEffect(() => { const timeoutId = setTimeout(() => { fetchRequests(); }, 300); return () => clearTimeout(timeoutId); }, [filters]);

    const fetchStats = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            const { data } = await axios.get('http://localhost:5000/api/registration-requests/stats', { headers: { Authorization: `Bearer ${token}` } });
            setStats(data);
        } catch (error) { console.error('Error fetching stats:', error); }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            const { data } = await axios.get('http://localhost:5000/api/registration-requests', { headers: { Authorization: `Bearer ${token}` }, params: filters });
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) { console.error('Error fetching requests:', error); }
        finally { setLoading(false); }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            await axios.put(`http://localhost:5000/api/registration-requests/${selectedRequest._id}/approve`, { comment }, { headers: { Authorization: `Bearer ${token}` } });
            setShowApproveModal(false);
            setComment('');
            fetchStats();
            fetchRequests();
            toast.success('Request approved successfully');
        } catch (error) { alert(error.response?.data?.message || 'Failed to approve request'); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!comment.trim()) { alert('Please provide a reason for rejection'); return; }
        setActionLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            await axios.put(`http://localhost:5000/api/registration-requests/${selectedRequest._id}/reject`, { comment }, { headers: { Authorization: `Bearer ${token}` } });
            setShowRejectModal(false);
            setComment('');
            fetchStats();
            fetchRequests();
            toast.success('Request rejected successfully');
        } catch (error) { alert(error.response?.data?.message || 'Failed to reject request'); }
        finally { setActionLoading(false); }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'SeatingManager': return <Users className="w-3 h-3" />;
            case 'ClubCoordinator': return <Building className="w-3 h-3" />;
            default: return <Users className="w-3 h-3" />;
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            SeatingManager: 'bg-violet-50 text-violet-600 border-violet-100',
            ClubCoordinator: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            Student: 'bg-blue-50 text-blue-600 border-blue-100'
        };
        const labels = { SeatingManager: 'Seating Manager', ClubCoordinator: 'Club Coordinator', Student: 'Student' };
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${colors[role] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>{getRoleIcon(role)}{labels[role] || role}</span>;
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending' },
            approved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Approved' },
            rejected: { icon: XCircle, color: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected' }
        };
        const { icon: Icon, color, label } = config[status] || config.pending;
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}><Icon className="w-3 h-3" />{label}</span>;
    };

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6 text-zinc-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Student Registrations</h1>
                        <p className="text-zinc-500 text-sm mt-0.5 font-medium">Review and approve new student account requests</p>
                    </div>
                    <button onClick={() => { fetchStats(); fetchRequests(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
                        { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
                        { label: 'Total', value: stats.total, icon: UserPlus, color: 'blue' }
                    ].map((stat, idx) => {
                        const colorClasses = {
                            amber: 'bg-amber-50 text-amber-600 border-amber-100',
                            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                            red: 'bg-red-50 text-red-600 border-red-100',
                            blue: 'bg-blue-50 text-blue-600 border-blue-100',
                        };
                        const iconColorClasses = {
                            amber: 'text-amber-600',
                            emerald: 'text-emerald-600',
                            red: 'text-red-600',
                            blue: 'text-blue-600'
                        };
                        return (
                            <div key={idx} className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorClasses[stat.color]}`}>
                                        <stat.icon className={`w-4.5 h-4.5 ${iconColorClasses[stat.color]}`} strokeWidth={2} />
                                    </div>
                                    <span className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={stat.value} /></span>
                                </div>
                                <p className="mt-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium"
                            />
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Roles</option>
                            <option value="Student">Student</option>
                        </select>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex items-center justify-center h-48"><Loader className="w-6 h-6 text-zinc-300 animate-spin" /></div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100"><AlertCircle className="w-6 h-6 text-zinc-300" /></div>
                            <p className="text-zinc-900 font-bold text-sm">No Registration Requests</p>
                            <p className="text-zinc-500 text-xs mt-1 font-medium">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Applicant</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Role</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Status</th>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Submitted</th>
                                        <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {requests.map((request) => (
                                        <tr key={request._id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900">{request.name}</p>
                                                    <p className="text-xs text-zinc-500 font-medium">{request.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">{getRoleBadge(request.role)}</td>
                                            <td className="px-5 py-3">{getStatusBadge(request.status)}</td>
                                            <td className="px-5 py-3 text-xs text-zinc-500 font-medium">{new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                                                            <button onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            <Modal isOpen={showDetailsModal && !!selectedRequest} onClose={() => setShowDetailsModal(false)} title="Request Details" size="md">
                {selectedRequest && (
                    <div className="space-y-4">
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Name</label><p className="text-sm font-bold text-zinc-900 mt-0.5">{selectedRequest.name}</p></div>
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Email</label><p className="text-sm text-zinc-900 mt-0.5 font-medium">{selectedRequest.email}</p></div>
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Role</label><div className="mt-1">{getRoleBadge(selectedRequest.role)}</div></div>
                        {selectedRequest.clubName && <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Club Name</label><p className="text-sm text-zinc-900 mt-0.5 font-medium">{selectedRequest.clubName}</p></div>}
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Status</label><div className="mt-1">{getStatusBadge(selectedRequest.status)}</div></div>
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Submitted</label><p className="text-sm text-zinc-900 mt-0.5 font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p></div>
                        {selectedRequest.reviewedAt && (<><div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Reviewed</label><p className="text-sm text-zinc-900 mt-0.5 font-medium">{new Date(selectedRequest.reviewedAt).toLocaleString()}</p></div>{selectedRequest.adminComment && <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Comment</label><p className="text-sm text-zinc-900 mt-0.5 font-medium">{selectedRequest.adminComment}</p></div>}</>)}
                        <button onClick={() => setShowDetailsModal(false)} className="w-full mt-6 px-4 py-2.5 bg-white text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors border border-zinc-200">Close</button>
                    </div>
                )}
            </Modal>

            {/* Approve Modal */}
            <Modal isOpen={showApproveModal && !!selectedRequest} onClose={() => setShowApproveModal(false)} title="Approve Request" size="md">
                {selectedRequest && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                            <div><h3 className="font-bold text-zinc-900">Approve Request</h3><p className="text-xs text-zinc-500 font-medium">Create user account</p></div>
                        </div>
                        <p className="text-sm text-zinc-600 mb-4 font-medium">Approve registration for <strong>{selectedRequest.name}</strong>? This will create their account.</p>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Comment (Optional)</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="2" placeholder="Add a note..." className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowApproveModal(false); setComment(''); }} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={handleApprove} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={showRejectModal && !!selectedRequest} onClose={() => setShowRejectModal(false)} title="Reject Request" size="md">
                {selectedRequest && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100"><XCircle className="w-5 h-5 text-red-600" /></div>
                            <div><h3 className="font-bold text-zinc-900">Reject Request</h3><p className="text-xs text-zinc-500 font-medium">Decline registration</p></div>
                        </div>
                        <p className="text-sm text-zinc-600 mb-4 font-medium">Please provide a reason for rejecting <strong>{selectedRequest.name}</strong>'s request.</p>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Reason *</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3" placeholder="Explain the rejection reason..." className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" required />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowRejectModal(false); setComment(''); }} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={handleReject} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default StaffRegistrationRequests;
