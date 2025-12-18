import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import gsap from 'gsap';
import {
  Users, Building, CheckCircle, XCircle, Clock,
  Search, Filter, Eye, AlertCircle, UserPlus, RefreshCw, X
} from 'lucide-react';

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

const AdminRegistrationRequests = () => {
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
  const socket = useSocket();

  useEffect(() => { fetchStats(); fetchRequests(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    if (!socket) return;
    socket.on('registration_request_created', () => { fetchStats(); fetchRequests(); });
    socket.on('registration_request_updated', () => { fetchStats(); fetchRequests(); });
    return () => { socket.off('registration_request_created'); socket.off('registration_request_updated'); };
  }, [socket]);

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchRequests(), 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchStats = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.get('http://localhost:5000/api/registration-requests/stats', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      setStats(data);
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.get('http://localhost:5000/api/registration-requests', {
        headers: { Authorization: `Bearer ${userInfo?.token}` }, params: filters
      });
      setRequests(data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`http://localhost:5000/api/registration-requests/${selectedRequest._id}/approve`, { comment }, { headers: { Authorization: `Bearer ${userInfo?.token}` } });
      setShowApproveModal(false); setComment(''); fetchStats(); fetchRequests();
    } catch (error) { alert(error.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!comment.trim()) { alert('Please provide a reason'); return; }
    setActionLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`http://localhost:5000/api/registration-requests/${selectedRequest._id}/reject`, { comment }, { headers: { Authorization: `Bearer ${userInfo?.token}` } });
      setShowRejectModal(false); setComment(''); fetchStats(); fetchRequests();
    } catch (error) { alert(error.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const getRoleBadge = (role) => {
    const config = {
      SeatingManager: { bg: 'bg-violet-50', text: 'text-violet-600', label: 'Seating Manager' },
      ClubCoordinator: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Club Coordinator' }
    };
    const c = config[role] || { bg: 'bg-zinc-50', text: 'text-zinc-600', label: role };
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
      approved: { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Approved' },
      rejected: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', label: 'Rejected' }
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <c.icon className="w-3 h-3" />{c.label}
      </span>
    );
  };

  const clearFilters = () => setFilters({ status: 'all', role: 'all', search: '' });
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.role !== 'all';

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Registration Requests</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Review and approve new user registrations</p>
          </div>
          <button onClick={() => { fetchStats(); fetchRequests(); }} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
            { label: 'Total', value: stats.total, icon: UserPlus, color: 'blue' },
          ].map((stat, i) => {
            const colorMap = { amber: 'bg-amber-50 text-amber-500', emerald: 'bg-emerald-50 text-emerald-500', red: 'bg-red-50 text-red-500', blue: 'bg-blue-50 text-blue-500' };
            return (
              <div key={i} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center`}>
                    <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stat.value} /></p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:bg-white text-zinc-700 placeholder-zinc-400" />
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="flex items-center gap-2">
              <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                <option value="all">All Roles</option>
                <option value="SeatingManager">Seating Manager</option>
                <option value="ClubCoordinator">Club Coordinator</option>
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="p-2.5 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Loading...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-600">No requests found</p>
              <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Applicant</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Role</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Submitted</th>
                  <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 text-sm">{req.name}</p>
                      <p className="text-xs text-zinc-500">{req.email}</p>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(req.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedRequest(req); setShowDetailsModal(true); }} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelectedRequest(req); setShowApproveModal(true); }} className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          )}
        </div>

        {/* Results Count */}
        {requests.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-zinc-500">Showing <span className="font-medium text-zinc-700">{requests.length}</span> requests</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={showDetailsModal && !!selectedRequest} onClose={() => setShowDetailsModal(false)} title="Request Details" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Name</p><p className="text-sm font-medium text-zinc-900">{selectedRequest.name}</p></div>
            <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Email</p><p className="text-sm text-zinc-700">{selectedRequest.email}</p></div>
            <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Role</p>{getRoleBadge(selectedRequest.role)}</div>
            {selectedRequest.clubName && <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Club</p><p className="text-sm text-zinc-700">{selectedRequest.clubName}</p></div>}
            <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Status</p>{getStatusBadge(selectedRequest.status)}</div>
            <button onClick={() => setShowDetailsModal(false)} className="w-full mt-4 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 text-sm font-medium transition-colors">Close</button>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal && !!selectedRequest} onClose={() => setShowApproveModal(false)} title="Approve Request" size="md">
        {selectedRequest && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="font-medium text-zinc-900 text-sm">Approve registration for {selectedRequest.name}?</p><p className="text-xs text-zinc-500">This will create their account</p></div>
            </div>
            <textarea className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 mb-4" rows={2} placeholder="Add a note (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => { setShowApproveModal(false); setComment(''); }} className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
              <button onClick={handleApprove} disabled={actionLoading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">Approve</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal && !!selectedRequest} onClose={() => setShowRejectModal(false)} title="Reject Request" size="md">
        {selectedRequest && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
              <div><p className="font-medium text-zinc-900 text-sm">Reject {selectedRequest.name}'s request?</p><p className="text-xs text-zinc-500">Please provide a reason</p></div>
            </div>
            <textarea className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 mb-4" rows={3} placeholder="Reason for rejection *" value={comment} onChange={(e) => setComment(e.target.value)} required />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(false); setComment(''); }} className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">Reject</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default AdminRegistrationRequests;
