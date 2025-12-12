import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import { getPendingApprovals, getAllApprovals, approveCareerRequest, rejectCareerRequest } from '../../utils/api';
import {
  CheckCircle, XCircle, Clock, Search, Filter, User, FileText,
  Calendar, Eye, MessageSquare, AlertCircle, Award
} from 'lucide-react';

const StaffCareerApprovals = () => {
  const user = useSelector(selectCurrentUser);
  const socket = useSocket();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Staff can only see approvals from their department
  const staffDepartment = user?.department || '';

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
        if (filterStatus !== 'all') {
          data = data.filter(a => a.status === filterStatus);
        }
      }

      // Filter by staff's department if set
      let filteredData = Array.isArray(data) ? data : [];
      if (staffDepartment) {
        filteredData = filteredData.filter(approval => {
          // Check student's department from the approval record
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

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, staffDepartment]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveCareerRequest(id, { comments: `Approved by staff - ${user?.name}` });
      await fetchApprovals();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await rejectCareerRequest(selectedRequest._id, { comments: rejectReason || `Rejected by staff - ${user?.name}` });
      await fetchApprovals();
      setShowRejectModal(false);
      setShowModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <badge.icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch =
      approval.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.careerGoal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.requestType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-7 h-7 text-purple-600" />
              Career Approvals
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Review and approve student career requests
              {staffDepartment && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {staffDepartment} Department
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by student name or goal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'all'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading approvals...</p>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No approval requests found</p>
            </div>
          ) : (
            filteredApprovals.map(approval => (
              <div key={approval._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-lg">
                      {approval.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{approval.student?.name || 'Unknown Student'}</h3>
                      <p className="text-sm text-gray-500">
                        {approval.student?.email} • {approval.student?.rollNumber}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getStatusBadge(approval.status)}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(approval.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedRequest(approval); setShowModal(true); }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {approval.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(approval._id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => { setSelectedRequest(approval); setShowRejectModal(true); }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Career Goal</p>
                  <p className="text-gray-800">{approval.careerGoal || 'Not specified'}</p>
                  {approval.description && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-2">Description</p>
                      <p className="text-gray-600">{approval.description}</p>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Details Modal */}
        <Modal
          isOpen={showModal && !!selectedRequest}
          onClose={() => setShowModal(false)}
          title="Request Details"
          size="lg"
        >
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-semibold">
                  {selectedRequest.student?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-800">{selectedRequest.student?.name}</h4>
                  <p className="text-gray-500">{selectedRequest.student?.email}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.student?.department} - {selectedRequest.student?.year}</p>
                </div>
              </div>

              <div className="grid gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Career Goal</p>
                  <p className="text-gray-800">{selectedRequest.careerGoal}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Request Type</p>
                  <p className="text-gray-800">{selectedRequest.requestType || 'Career Path Approval'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-gray-800">{selectedRequest.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted On</p>
                  <p className="text-gray-800">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                {selectedRequest.reviewedBy && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reviewed By</p>
                    <p className="text-gray-800">{selectedRequest.reviewedBy?.name}</p>
                  </div>
                )}
                {selectedRequest.comments && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Comments</p>
                    <p className="text-gray-800">{selectedRequest.comments}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { setShowRejectModal(true); }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
          title="Reject Request"
          size="md"
        >
          <p className="text-gray-500 mb-4">
            Please provide a reason for rejecting this request.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows="4"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Confirm Reject
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffCareerApprovals;
