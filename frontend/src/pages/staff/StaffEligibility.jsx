import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
  Users, Search, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, FileText, Loader
} from 'lucide-react';
import {
  getStudentsForStaff, checkStudentEligibility
} from '../../utils/api';

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

const StaffEligibility = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [eligibilityDetails, setEligibilityDetails] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const staffDepartment = user?.department || '';

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => { fetchData(); }, [filterYear, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;
      const studentsRes = await getStudentsForStaff(params);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = (student) => {
    const issues = [];
    if (student.attendance < 75) issues.push(`Low attendance: ${student.attendance}% (min 75%)`);
    if (!student.feesPaid) issues.push('Fees not cleared');
    return { eligible: issues.length === 0, issues };
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setCheckingEligibility(true);
    try {
      const { data } = await checkStudentEligibility(student._id);
      setEligibilityDetails(data);
    } catch (error) {
      setEligibilityDetails({ ...student, ...checkEligibility(student) });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const filteredStudents = Array.isArray(students) ? students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterEligibility === 'eligible') return matchesSearch && student.attendance >= 75 && student.feesPaid;
    if (filterEligibility === 'ineligible') return matchesSearch && (student.attendance < 75 || !student.feesPaid);
    return matchesSearch;
  }) : [];

  const eligibleCount = Array.isArray(students) ? students.filter(s => s.attendance >= 75 && s.feesPaid).length : 0;
  const ineligibleCount = Array.isArray(students) ? students.filter(s => s.attendance < 75 || !s.feesPaid).length : 0;
  const years = [{ value: '1', label: '1st Year' }, { value: '2', label: '2nd Year' }, { value: '3', label: '3rd Year' }, { value: '4', label: '4th Year' }];

  return (
    <DashboardLayout role="staff" userName={user?.name}>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Hall Ticket Eligibility</h1>
            <p className="text-dark-400 text-sm mt-0.5">
              Check student eligibility for hall tickets
              {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-dark-800 text-dark-300 border border-dark-700">{staffDepartment}</span>}
            </p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-dark-300 rounded-lg text-sm font-medium hover:bg-dark-700 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="metric-card bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white shadow-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-violet-200 text-xs font-bold uppercase tracking-wider">Total Students</p>
                <p className="text-2xl font-bold mt-0.5"><AnimatedNumber value={students.length} /></p>
              </div>
            </div>
          </div>
          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-dark-400 text-xs font-bold uppercase tracking-wider">Eligible</p>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5"><AnimatedNumber value={eligibleCount} /></p>
              </div>
            </div>
          </div>
          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20"><XCircle className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="text-dark-400 text-xs font-bold uppercase tracking-wider">Not Eligible</p>
                <p className="text-2xl font-bold text-red-400 mt-0.5"><AnimatedNumber value={ineligibleCount} /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-dark rounded-xl border border-dark-700 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
              >
                <option value="all">All Years</option>
                {years.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
              </select>
              <select
                value={filterEligibility}
                onChange={(e) => setFilterEligibility(e.target.value)}
                className="px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
              >
                <option value="all">All Students</option>
                <option value="eligible">Eligible Only</option>
                <option value="ineligible">Ineligible Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Student</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Roll No</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Attendance</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Fees</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Eligibility</th>
                  <th className="text-left py-3 px-5 text-[10px] font-medium text-dark-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {loading ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-dark-400 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto text-primary-500" /></td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-10 text-center text-dark-400 text-sm">No students found</td></tr>
                ) : (
                  filteredStudents.map(student => {
                    const { eligible } = checkEligibility(student);
                    return (
                      <tr key={student._id} className="hover:bg-dark-800/50 transition-colors">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-lg">
                              {student.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{student.name}</p>
                              <p className="text-xs text-dark-400">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-sm font-mono text-dark-300">{student.rollNumber || '-'}</td>
                        <td className="py-3 px-5">
                          <span className={`text-sm font-bold ${student.attendance >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{student.attendance || 0}%</span>
                        </td>
                        <td className="py-3 px-5">
                          {student.feesPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Paid</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3" /> Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-5">
                          {eligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Eligible</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold tracking-wide bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Not Eligible</span>
                          )}
                        </td>
                        <td className="py-3 px-5">
                          <button onClick={() => handleViewDetails(student)} className="p-1.5 text-primary-400 hover:bg-primary-500/10 rounded-md transition-colors border border-transparent hover:border-primary-500/20"><FileText className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Eligibility Details Modal */}
        <Modal isOpen={showModal && !!selectedStudent} onClose={() => setShowModal(false)} title="Eligibility Details" size="md">
          {checkingEligibility ? (
            <div className="text-center py-8"><Loader className="w-6 h-6 text-primary-500 animate-spin mx-auto mb-3" /><p className="text-dark-400 text-sm">Checking eligibility...</p></div>
          ) : eligibilityDetails ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center text-white text-xl font-bold border border-white/10 shadow-lg">
                  {eligibilityDetails.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{eligibilityDetails.name}</h4>
                  <p className="text-xs text-dark-400">{eligibilityDetails.rollNumber} · {eligibilityDetails.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                  <p className="text-xs text-dark-400 mb-1">Attendance</p>
                  <p className={`text-xl font-bold ${eligibilityDetails.attendance >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{eligibilityDetails.attendance}%</p>
                </div>
                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                  <p className="text-xs text-dark-400 mb-1">Fee Status</p>
                  <p className={`text-xl font-bold ${eligibilityDetails.feesPaid ? 'text-emerald-400' : 'text-red-400'}`}>{eligibilityDetails.feesPaid ? 'Cleared' : 'Pending'}</p>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${eligibilityDetails.eligible ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {eligibilityDetails.eligible ? (<><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="font-bold text-emerald-400">Eligible for Hall Ticket</span></>) : (<><XCircle className="w-5 h-5 text-red-400" /><span className="font-bold text-red-400">Not Eligible</span></>)}
                </div>
                {eligibilityDetails.issues?.length > 0 && (<ul className="text-xs text-red-400 list-disc pl-5 space-y-1">{eligibilityDetails.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>)}
              </div>
            </div>
          ) : null}
          <div className="flex justify-end mt-6 pt-4 border-t border-dark-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm font-medium hover:bg-dark-700 hover:text-white transition-colors border border-dark-700">Close</button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffEligibility;
