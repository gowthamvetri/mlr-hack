import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import Modal from '../../components/Modal';
import {
  CreditCard, Search, Save, Check, X,
  AlertTriangle, RefreshCw, DollarSign, FileText
} from 'lucide-react';
import {
  getStudentsForStaff, updateStudentFeeStatus,
  getFeeSummary
} from '../../utils/api';

const StaffFees = () => {
  const user = useSelector(selectCurrentUser);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [summary, setSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeForm, setFeeForm] = useState({
    totalAmount: 0,
    paidAmount: 0,
    remarks: ''
  });

  // Staff can only manage students from their department
  const staffDepartment = user?.department || '';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, filterStatus, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      // Auto-filter by staff's department
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;

      const [studentsRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getFeeSummary(params).catch(() => ({ data: {} }))
      ]);

      let filteredStudents = studentsRes.data;
      if (filterStatus === 'paid') {
        filteredStudents = filteredStudents.filter(s => s.feesPaid);
      } else if (filterStatus === 'pending') {
        filteredStudents = filteredStudents.filter(s => !s.feesPaid);
      }

      setStudents(filteredStudents);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFees = (student) => {
    setSelectedStudent(student);
    setFeeForm({
      totalAmount: student.feeDetails?.totalAmount || 0,
      paidAmount: student.feeDetails?.paidAmount || 0,
      remarks: student.feeDetails?.remarks || ''
    });
    setShowModal(true);
  };

  const handleSaveFees = async () => {
    if (!selectedStudent) return;

    try {
      setSaving(selectedStudent._id);
      const dueAmount = Math.max(0, feeForm.totalAmount - feeForm.paidAmount);
      const feesPaid = dueAmount === 0;

      await updateStudentFeeStatus(selectedStudent._id, {
        feesPaid,
        feeDetails: {
          totalAmount: feeForm.totalAmount,
          paidAmount: feeForm.paidAmount,
          dueAmount,
          lastPaymentDate: new Date(),
          remarks: feeForm.remarks
        }
      });

      // Update local state
      setStudents(prev => prev.map(s =>
        s._id === selectedStudent._id
          ? {
            ...s,
            feesPaid,
            feeDetails: {
              totalAmount: feeForm.totalAmount,
              paidAmount: feeForm.paidAmount,
              dueAmount,
              remarks: feeForm.remarks
            }
          }
          : s
      ));

      setShowModal(false);
      setSuccessMessage('Fee status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(); // Refresh summary
    } catch (error) {
      console.error('Error updating fee status:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleQuickToggle = async (student) => {
    try {
      setSaving(student._id);
      await updateStudentFeeStatus(student._id, { feesPaid: !student.feesPaid });

      setStudents(prev => prev.map(s =>
        s._id === student._id ? { ...s, feesPaid: !s.feesPaid } : s
      ));

      setSuccessMessage(`Fees ${!student.feesPaid ? 'marked as paid' : 'marked as pending'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Error toggling fee status:', error);
    } finally {
      setSaving(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const years = [
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Fee Management</h1>
            <p className="text-sm sm:text-base text-gray-500">
              Update and verify student fee status
              {staffDepartment && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {staffDepartment} Department
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={summary.totalStudents} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Fees Cleared</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={summary.feesPaidCount} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Fees Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1"><AnimatedNumber value={summary.feesPendingCount} /></p>
            </div>
            <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
              <p className="text-xs sm:text-sm text-gray-500">Clearance Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1"><AnimatedNumber value={summary.clearanceRate} suffix="%" /></p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm sm:text-base"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Student</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Roll Number</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Department</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Due Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {student.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-gray-700">{student.rollNumber || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {student.department || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={student.feeDetails?.dueAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          ₹{student.feeDetails?.dueAmount?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {student.feesPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickToggle(student)}
                            disabled={saving === student._id}
                            className={`p-2 rounded-lg ${student.feesPaid ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} disabled:opacity-50 transition-colors`}
                            title={student.feesPaid ? 'Mark as Pending' : 'Mark as Paid'}
                          >
                            {student.feesPaid ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleEditFees(student)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit Fee Details"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Details Modal */}
        <Modal
          isOpen={showModal && !!selectedStudent}
          onClose={() => setShowModal(false)}
          title={`Fee Details - ${selectedStudent?.name || ''}`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Fee Amount
              </label>
              <input
                type="number"
                value={feeForm.totalAmount}
                onChange={(e) => setFeeForm({ ...feeForm, totalAmount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid Amount
              </label>
              <input
                type="number"
                value={feeForm.paidAmount}
                onChange={(e) => setFeeForm({ ...feeForm, paidAmount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Due Amount</p>
              <p className={`text-xl font-bold ${Math.max(0, feeForm.totalAmount - feeForm.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.max(0, feeForm.totalAmount - feeForm.paidAmount).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={feeForm.remarks}
                onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Add any notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFees}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffFees;
