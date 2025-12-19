import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import { useSocket } from '../../context/SocketContext';
import { getPendingApprovals, getAllApprovals, approveCareerRequest, rejectCareerRequest } from '../../utils/api';
import {
  CheckCircle, XCircle, Clock, Search, User, Calendar, Eye, Award, Loader, FileText
} from 'lucide-react';

const StaffCareerApprovals = () => {
  const user = useSelector(selectCurrentUser);
  const socket = useSocket();
  const pageRef = useRef(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const staffDepartment = user?.department || '';

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.approval-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading, approvals]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      let data;
      if (filterStatus === 'pending') {
        const response = await getPendingApprovals();
        data = response.data;
      } else {
        const response = await getAllApprovals();
        data = response.data;
        if (filterStatus !== 'all') data = data.filter(a => a.status === filterStatus);
      }
      let filteredData = Array.isArray(data) ? data : [];
      if (staffDepartment) {
        filteredData = filteredData.filter(approval => {
          const studentDept = approval.student?.department || approval.studentDepartment || '';
          return studentDept === staffDepartment;
        });
      }
      setApprovals(filteredData);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, [filterStatus, staffDepartment]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveCareerRequest(id, { comments: `Approved by ${user?.name}` });
      await fetchApprovals();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) { console.error('Error approving request:', error); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await rejectCareerRequest(selectedRequest._id, { comments: rejectReason || `Rejected by ${user?.name}` });
      await fetchApprovals();
      setShowRejectModal(false);
      setShowModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) { console.error('Error rejecting request:', error); }
    finally { setActionLoading(false); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock },
      approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${badge.bg} ${badge.text} border ${badge.border}`}>
        <badge.icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredApprovals = approvals.filter(approval =>
    approval.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    approval.careerGoal?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-primary-500" /> Career Approvals
            </h1>
            <p className="text-dark-400 text-sm mt-0.5">
              Review and approve student career requests
              {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-dark-800 text-dark-300 border border-dark-700">{staffDepartment}</span>}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-dark rounded-xl border border-dark-700 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search by student name or goal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'all'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-dark-800 text-dark-300 border border-dark-700 hover:bg-dark-700 hover:text-white'}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass-card-dark rounded-xl border border-dark-700 p-12 text-center">
              <Loader className="w-6 h-6 text-primary-500 animate-spin mx-auto mb-3" />
              <p className="text-dark-400 text-sm">Loading approvals...</p>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="glass-card-dark rounded-xl border border-dark-700 p-12 text-center">
              <div className="w-14 h-14 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700">
                <FileText className="w-6 h-6 text-dark-400" />
              </div>
              <p className="text-white font-medium">No Requests Found</p>
              <p className="text-dark-400 text-sm mt-1">No approval requests match your criteria.</p>
            </div>
          ) : (
            filteredApprovals.map(approval => (
              <div key={approval._id} className="approval-card glass-card-dark rounded-xl border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center text-white font-bold text-sm border border-white/10 shadow-lg">
                      {approval.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{approval.student?.name || 'Unknown Student'}</h3>
                      <p className="text-xs text-dark-400">{approval.student?.email} · {approval.student?.rollNumber}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getStatusBadge(approval.status)}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-dark-800 text-dark-400 border border-dark-700">
                          <Calendar className="w-3 h-3" />{new Date(approval.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelectedRequest(approval); setShowModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-700 hover:text-white transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {approval.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(approval._id)} disabled={actionLoading} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                        <button onClick={() => { setSelectedRequest(approval); setShowRejectModal(true); }} className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                  <p className="text-xs font-medium text-dark-400 mb-1">Career Goal</p>
                  <p className="text-sm text-gray-300">{approval.careerGoal || 'Not specified'}</p>
                  {approval.description && (<><p className="text-xs font-medium text-dark-400 mt-3 mb-1">Description</p><p className="text-xs text-dark-300">{approval.description}</p></>)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Details Modal */}
        <Modal isOpen={showModal && !!selectedRequest} onClose={() => setShowModal(false)} title="Request Details" size="lg">
          {selectedRequest && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center text-white text-xl font-bold border border-white/10 shadow-lg">
                  {selectedRequest.student?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{selectedRequest.student?.name}</h4>
                  <p className="text-xs text-dark-400">{selectedRequest.student?.email} · {selectedRequest.student?.department}</p>
                </div>
              </div>
              <div className="grid gap-4 p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div><p className="text-xs font-medium text-dark-400 mb-1">Career Goal</p><p className="text-sm text-white">{selectedRequest.careerGoal}</p></div>
                <div><p className="text-xs font-medium text-dark-400 mb-1">Request Type</p><p className="text-sm text-white">{selectedRequest.requestType || 'Career Path Approval'}</p></div>
                <div><p className="text-xs font-medium text-dark-400 mb-1">Description</p><p className="text-sm text-white">{selectedRequest.description || 'No description provided'}</p></div>
                <div><p className="text-xs font-medium text-dark-400 mb-1">Status</p>{getStatusBadge(selectedRequest.status)}</div>
                <div><p className="text-xs font-medium text-dark-400 mb-1">Submitted On</p><p className="text-sm text-white">{new Date(selectedRequest.createdAt).toLocaleString()}</p></div>
                {selectedRequest.reviewedBy && <div><p className="text-xs font-medium text-dark-400 mb-1">Reviewed By</p><p className="text-sm text-white">{selectedRequest.reviewedBy?.name}</p></div>}
                {selectedRequest.comments && <div><p className="text-xs font-medium text-dark-400 mb-1">Comments</p><p className="text-sm text-white">{selectedRequest.comments}</p></div>}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-dark-800 border border-dark-700 text-dark-300 rounded-lg text-sm font-medium hover:bg-dark-700 hover:text-white transition-colors">Close</button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">Reject</button>
                    <button onClick={() => handleApprove(selectedRequest._id)} disabled={actionLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20">Approve</button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectReason(''); }} title="Reject Request" size="md">
          <p className="text-dark-400 text-sm mb-4">Please provide a reason for rejecting this request.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows="4"
            className="w-full px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 placeholder-dark-500"
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-dark-700">
            <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="px-4 py-2 bg-dark-800 border border-dark-700 text-dark-300 rounded-lg text-sm font-medium hover:bg-dark-700 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-red-500/20">Confirm Reject</button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffCareerApprovals;
