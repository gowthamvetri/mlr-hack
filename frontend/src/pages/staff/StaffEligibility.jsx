import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import Modal from '../../components/Modal';
import {
  Users, Search, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, FileText, Download, Filter
} from 'lucide-react';
import {
  getStudentsForStaff, getIneligibleStudents,
  checkStudentEligibility
} from '../../utils/api';

const StaffEligibility = () => {
  const user = useSelector(selectCurrentUser);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [eligibilityDetails, setEligibilityDetails] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Staff can only manage students from their department
  const staffDepartment = user?.department || '';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYear, staffDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      // Auto-filter by staff's department
      if (staffDepartment) params.department = staffDepartment;
      if (filterYear !== 'all') params.year = filterYear;

      const studentsRes = await getStudentsForStaff(params);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = (student) => {
    const issues = [];
    if (student.attendance < 75) {
      issues.push(`Low attendance: ${student.attendance}% (minimum 75% required)`);
    }
    if (!student.feesPaid) {
      issues.push('Fees not cleared');
    }
    return {
      eligible: issues.length === 0,
      issues
    };
  };

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setCheckingEligibility(true);

    try {
      const { data } = await checkStudentEligibility(student._id);
      setEligibilityDetails(data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // Fallback to local calculation
      setEligibilityDetails({
        ...student,
        eligible: checkEligibility(student).eligible,
        issues: checkEligibility(student).issues
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterEligibility === 'eligible') {
      return matchesSearch && student.attendance >= 75 && student.feesPaid;
    }
    if (filterEligibility === 'ineligible') {
      return matchesSearch && (student.attendance < 75 || !student.feesPaid);
    }
    return matchesSearch;
  });

  const eligibleCount = students.filter(s => s.attendance >= 75 && s.feesPaid).length;
  const ineligibleCount = students.filter(s => s.attendance < 75 || !s.feesPaid).length;

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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Hall Ticket Eligibility</h1>
            <p className="text-sm sm:text-base text-gray-500">
              Check student eligibility for hall tickets
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-4 sm:p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-primary-100 text-xs sm:text-sm">Total Students</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1"><AnimatedNumber value={students.length} /></p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Eligible</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1"><AnimatedNumber value={eligibleCount} /></p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Not Eligible</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1"><AnimatedNumber value={ineligibleCount} /></p>
              </div>
            </div>
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
                value={filterEligibility}
                onChange={(e) => setFilterEligibility(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm sm:text-base"
              >
                <option value="all">All Students</option>
                <option value="eligible">Eligible Only</option>
                <option value="ineligible">Ineligible Only</option>
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
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Attendance</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Fees</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Eligibility</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const { eligible, issues } = checkEligibility(student);
                    return (
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
                          <span className={`font-medium ${student.attendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {student.attendance || 0}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {student.feesPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {eligible ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-4 h-4" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="w-4 h-4" /> Not Eligible
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleViewDetails(student)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
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
        <Modal
          isOpen={showModal && !!selectedStudent}
          onClose={() => setShowModal(false)}
          title="Eligibility Details"
          size="md"
        >
          {checkingEligibility ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Checking eligibility...</p>
            </div>
          ) : eligibilityDetails ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-semibold">
                  {eligibilityDetails.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{eligibilityDetails.name}</h4>
                  <p className="text-sm text-gray-500">{eligibilityDetails.rollNumber}</p>
                  <p className="text-sm text-gray-500">{eligibilityDetails.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500">Attendance</p>
                  <p className={`text-xl font-bold ${eligibilityDetails.attendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityDetails.attendance}%
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500">Fee Status</p>
                  <p className={`text-xl font-bold ${eligibilityDetails.feesPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityDetails.feesPaid ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${eligibilityDetails.eligible ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {eligibilityDetails.eligible ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-green-700">Eligible for Hall Ticket</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-semibold text-red-700">Not Eligible</span>
                    </>
                  )}
                </div>

                {eligibilityDetails.issues?.length > 0 && (
                  <ul className="text-sm text-red-700 list-disc pl-5">
                    {eligibilityDetails.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffEligibility;
