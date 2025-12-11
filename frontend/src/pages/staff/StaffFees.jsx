import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  CreditCard, Search, Save, Check, X, 
  AlertTriangle, RefreshCw, DollarSign, FileText
} from 'lucide-react';
import { 
  getStudentsForStaff, updateStudentFeeStatus, 
  getFeeSummary, getDepartments 
} from '../../utils/api';

const StaffFees = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeForm, setFeeForm] = useState({
    totalAmount: 0,
    paidAmount: 0,
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterDept, filterYear, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept !== 'all') params.department = filterDept;
      if (filterYear !== 'all') params.year = filterYear;

      const [studentsRes, deptRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getDepartments().catch(() => ({ data: [] })),
        getFeeSummary(params).catch(() => ({ data: {} }))
      ]);

      let filteredStudents = studentsRes.data;
      if (filterStatus === 'paid') {
        filteredStudents = filteredStudents.filter(s => s.feesPaid);
      } else if (filterStatus === 'pending') {
        filteredStudents = filteredStudents.filter(s => !s.feesPaid);
      }

      setStudents(filteredStudents);
      setDepartments(deptRes.data);
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

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Update and verify student fee status</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalStudents}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Fees Cleared</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.feesPaidCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Fees Pending</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.feesPendingCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Clearance Rate</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.clearanceRate}%</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept.code || dept.name}>{dept.name}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                            {student.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{student.rollNumber || '-'}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{student.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={student.feeDetails?.dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          ₹{student.feeDetails?.dueAmount?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {student.feesPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <AlertTriangle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickToggle(student)}
                            disabled={saving === student._id}
                            className={`p-2 rounded-lg ${student.feesPaid ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'} disabled:opacity-50`}
                            title={student.feesPaid ? 'Mark as Pending' : 'Mark as Paid'}
                          >
                            {student.feesPaid ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleEditFees(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
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
        {showModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Fee Details - {selectedStudent.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Fee Amount
                  </label>
                  <input
                    type="number"
                    value={feeForm.totalAmount}
                    onChange={(e) => setFeeForm({ ...feeForm, totalAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    value={feeForm.paidAmount}
                    onChange={(e) => setFeeForm({ ...feeForm, paidAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Due Amount</p>
                  <p className={`text-xl font-bold ${Math.max(0, feeForm.totalAmount - feeForm.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.max(0, feeForm.totalAmount - feeForm.paidAmount).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={feeForm.remarks}
                    onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Add any notes..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFees}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffFees;
