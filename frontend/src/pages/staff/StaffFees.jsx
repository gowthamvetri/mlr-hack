import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
  CreditCard, Search, Save, Check, X,
  AlertTriangle, RefreshCw, FileText, Loader
} from 'lucide-react';
import {
  getStudentsForStaff, updateStudentFeeStatus, getFeeSummary
} from '../../utils/api';

// Animated counter
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 500;
    const start = displayValue;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(suffix === '%' ? parseFloat((start + (end - start) * eased).toFixed(1)) : Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

const StaffFees = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
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
  const [feeForm, setFeeForm] = useState({ totalAmount: 0, paidAmount: 0, remarks: '' });
  const staffDepartment = user?.department || '';

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => { fetchData(); }, [filterYear, filterStatus, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;
      const [studentsRes, summaryRes] = await Promise.all([
        getStudentsForStaff(params),
        getFeeSummary(params).catch(() => ({ data: {} }))
      ]);
      let filteredStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      if (filterStatus === 'paid') filteredStudents = filteredStudents.filter(s => s.feesPaid);
      else if (filterStatus === 'pending') filteredStudents = filteredStudents.filter(s => !s.feesPaid);
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
        feeDetails: { totalAmount: feeForm.totalAmount, paidAmount: feeForm.paidAmount, dueAmount, lastPaymentDate: new Date(), remarks: feeForm.remarks }
      });
      setStudents(prev => prev.map(s => s._id === selectedStudent._id ? { ...s, feesPaid, feeDetails: { ...feeForm, dueAmount } } : s));
      setShowModal(false);
      setSuccessMessage('Fee status updated'); setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (error) { console.error('Error updating fee status:', error); }
    finally { setSaving(null); }
  };

  const handleQuickToggle = async (student) => {
    try {
      setSaving(student._id);
      await updateStudentFeeStatus(student._id, { feesPaid: !student.feesPaid });
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, feesPaid: !s.feesPaid } : s));
      setSuccessMessage(`Fees ${!student.feesPaid ? 'marked as paid' : 'marked as pending'}`); setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (error) { console.error('Error toggling fee status:', error); }
    finally { setSaving(null); }
  };

  const filteredStudents = Array.isArray(students) ? students.filter(student => student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const years = [{ value: '1', label: '1st Year' }, { value: '2', label: '2nd Year' }, { value: '3', label: '3rd Year' }, { value: '4', label: '4th Year' }];

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Fee Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Update and verify student fee status
              {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">{staffDepartment}</span>}
            </p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2 border border-emerald-100">
            <Check className="w-4 h-4" /> {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: summary.totalStudents, color: 'zinc' },
              { label: 'Fees Cleared', value: summary.feesPaidCount, color: 'emerald' },
              { label: 'Fees Pending', value: summary.feesPendingCount, color: 'red' },
              { label: 'Clearance Rate', value: summary.clearanceRate, suffix: '%', color: 'violet' }
            ].map((stat, i) => (
              <div key={i} className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className={`text-2xl font-semibold ${stat.color === 'zinc' ? 'text-zinc-900' : `text-${stat.color}-600`}`}>
                  <AnimatedNumber value={stat.value || 0} suffix={stat.suffix || ''} />
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search by name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
            </div>
            <div className="flex gap-2">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                <option value="all">All Years</option>
                {years.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Roll No</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Due Amount</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr><td colSpan="5" className="px-5 py-10 text-center text-zinc-400 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-10 text-center text-zinc-400 text-sm">No students found</td></tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student._id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center text-xs font-semibold text-violet-600">{student.name?.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                            <p className="text-xs text-zinc-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-sm font-mono text-zinc-600">{student.rollNumber || '-'}</td>
                      <td className="py-3 px-5">
                        <span className={`text-sm font-medium ${student.feeDetails?.dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₹{student.feeDetails?.dueAmount?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        {student.feesPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><Check className="w-3 h-3" /> Paid</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100"><AlertTriangle className="w-3 h-3" /> Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleQuickToggle(student)} disabled={saving === student._id} className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${student.feesPaid ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={student.feesPaid ? 'Mark Pending' : 'Mark Paid'}>
                            {student.feesPaid ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleEditFees(student)} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors" title="Edit Details">
                            <FileText className="w-4 h-4" />
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
        <Modal isOpen={showModal && !!selectedStudent} onClose={() => setShowModal(false)} title={`Fee Details - ${selectedStudent?.name || ''}`} size="md">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Total Fee Amount</label>
              <input type="number" value={feeForm.totalAmount} onChange={(e) => setFeeForm({ ...feeForm, totalAmount: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Paid Amount</label>
              <input type="number" value={feeForm.paidAmount} onChange={(e) => setFeeForm({ ...feeForm, paidAmount: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
            </div>
            <div className="p-4 bg-zinc-100 rounded-lg">
              <p className="text-xs text-zinc-500">Due Amount</p>
              <p className={`text-xl font-bold ${Math.max(0, feeForm.totalAmount - feeForm.paidAmount) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ₹{Math.max(0, feeForm.totalAmount - feeForm.paidAmount).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Remarks</label>
              <textarea value={feeForm.remarks} onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })} rows="2" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none" placeholder="Add any notes..." />
            </div>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-zinc-100">
            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">Cancel</button>
            <button onClick={handleSaveFees} disabled={saving} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffFees;
