import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';
import {
    Users, Building, CheckCircle, XCircle, Clock,
    Search, Filter, Eye, AlertCircle, UserPlus, RefreshCw
} from 'lucide-react';

const StaffRegistrationRequests = () => {
    const user = useSelector(selectCurrentUser);
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

    useEffect(() => {
        fetchStats();
        fetchRequests();
    }, []);

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('registration_request_created', (newRequest) => {
            setRequests(prev => [newRequest, ...prev]);
            fetchStats();
        });

        socket.on('registration_request_updated', (updatedRequest) => {
            setRequests(prev => prev.map(req => req._id === updatedRequest._id ? updatedRequest : req));
            fetchStats();
        });

        return () => {
            socket.off('registration_request_created');
            socket.off('registration_request_updated');
        };
    }, [socket]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRequests();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const fetchStats = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            const { data } = await axios.get('http://localhost:5000/api/registration-requests/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            const { data } = await axios.get('http://localhost:5000/api/registration-requests', {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            await axios.put(
                `http://localhost:5000/api/registration-requests/${selectedRequest._id}/approve`,
                { comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowApproveModal(false);
            setComment('');
            fetchStats();
            fetchRequests();
            toast.success('Request approved successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        setActionLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const token = userInfo?.token;
            await axios.put(
                `http://localhost:5000/api/registration-requests/${selectedRequest._id}/reject`,
                { comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowRejectModal(false);
            setComment('');
            fetchStats();
            fetchRequests();
            toast.success('Request rejected successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'SeatingManager':
                return <Users className="w-4 h-4" />;
            case 'ClubCoordinator':
                return <Building className="w-4 h-4" />;
            default:
                return <Users className="w-4 h-4" />;
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            SeatingManager: 'bg-purple-100 text-purple-700',
            ClubCoordinator: 'bg-green-100 text-green-700',
            Student: 'bg-blue-100 text-blue-700'
        };
        const labels = {
            SeatingManager: 'Seating Manager',
            ClubCoordinator: 'Club Coordinator',
            Student: 'Student'
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
                {getRoleIcon(role)}
                {labels[role] || role}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
            approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
            rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' }
        };
        const { icon: Icon, color, label } = config[status] || config.pending;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
            </span>
        );
    };

    const statCards = [
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-amber-600', bgColor: 'bg-yellow-50' },
        { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50' },
        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'from-red-500 to-rose-600', bgColor: 'bg-red-50' },
        { label: 'Total', value: stats.total, icon: UserPlus, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50' }
    ];

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Student Registrations</h1>
                        <p className="text-gray-600 mt-1">Review and approve new student account requests</p>
                    </div>
                    <button
                        onClick={() => { fetchStats(); fetchRequests(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className={`${stat.bgColor} rounded-xl p-5 border border-gray-100`}>
                            <div className="flex items-center justify-between">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            >
                                <option value="all">All Roles</option>
                                <option value="Student">Student</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-3 text-gray-500">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No registration requests found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {requests.map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{request.name}</p>
                                                    <p className="text-sm text-gray-500">{request.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getRoleBadge(request.role)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => { setSelectedRequest(request); setShowApproveModal(true); }}
                                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
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
            <Modal
                isOpen={showDetailsModal && !!selectedRequest}
                onClose={() => setShowDetailsModal(false)}
                title="Request Details"
                size="md"
            >
                {selectedRequest && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
                            <p className="text-gray-900 font-medium">{selectedRequest.name}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                            <p className="text-gray-900">{selectedRequest.email}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
                            <div className="mt-1">{getRoleBadge(selectedRequest.role)}</div>
                        </div>
                        {selectedRequest.clubName && (
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Club Name</label>
                                <p className="text-gray-900">{selectedRequest.clubName}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Submitted</label>
                            <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                        </div>
                        {selectedRequest.reviewedAt && (
                            <>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Reviewed</label>
                                    <p className="text-gray-900">{new Date(selectedRequest.reviewedAt).toLocaleString()}</p>
                                </div>
                                {selectedRequest.adminComment && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Comment</label>
                                        <p className="text-gray-900">{selectedRequest.adminComment}</p>
                                    </div>
                                )}
                            </>
                        )}
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                )}
            </Modal>

            {/* Approve Modal */}
            <Modal
                isOpen={showApproveModal && !!selectedRequest}
                onClose={() => setShowApproveModal(false)}
                title="Approve Request"
                size="md"
            >
                {selectedRequest && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Approve Request</h3>
                                <p className="text-sm text-gray-500">Create user account</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Approve registration for <strong>{selectedRequest.name}</strong>? This will create their account.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                rows="2"
                                placeholder="Add a note..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowApproveModal(false); setComment(''); }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal && !!selectedRequest}
                onClose={() => setShowRejectModal(false)}
                title="Reject Request"
                size="md"
            >
                {selectedRequest && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Reject Request</h3>
                                <p className="text-sm text-gray-500">Decline registration</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejecting <strong>{selectedRequest.name}</strong>'s request.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                rows="3"
                                placeholder="Explain the rejection reason..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowRejectModal(false); setComment(''); }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Reject
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default StaffRegistrationRequests;
