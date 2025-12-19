import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import {
    Users, Search, Save, Check, X, AlertTriangle, RefreshCw, FileText, Loader,
    CheckCircle, XCircle, ArrowUp, ArrowDown, ClipboardList, CreditCard, Award
} from 'lucide-react';
import {
    getStudentsForStaff, updateStudentAttendance, bulkUpdateAttendance,
    getAttendanceSummary, updateStudentFeeStatus, getFeeSummary, checkStudentEligibility
} from '../../utils/api';

// Animated counter
const AnimatedNumber = ({ value, suffix = '' }) => {
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
    return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

const StaffStudentManagement = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [activeTab, setActiveTab] = useState('attendance');

    // Common state
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [successMessage, setSuccessMessage] = useState('');
    const staffDepartment = user?.department || '';

    // Attendance state
    const [saving, setSaving] = useState(false);
    const [editedAttendance, setEditedAttendance] = useState({});
    const [attendanceSummary, setAttendanceSummary] = useState(null);

    // Fees state
    const [filterStatus, setFilterStatus] = useState('all');
    const [feeSummary, setFeeSummary] = useState(null);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeForm, setFeeForm] = useState({ totalAmount: 0, paidAmount: 0, remarks: '' });

    // Eligibility state
    const [filterEligibility, setFilterEligibility] = useState('all');
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);
    const [eligibilityDetails, setEligibilityDetails] = useState(null);
    const [checkingEligibility, setCheckingEligibility] = useState(false);

    const years = [{ value: '1', label: '1st Year' }, { value: '2', label: '2nd Year' }, { value: '3', label: '3rd Year' }, { value: '4', label: '4th Year' }];

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        }
    }, [loading, activeTab]);

    useEffect(() => { fetchData(); }, [filterYear, filterStatus, staffDepartment, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (staffDepartment) params.department = staffDepartment;
            if (filterYear !== 'all') params.year = filterYear;

            const studentsRes = await getStudentsForStaff(params);
            let studentsData = studentsRes.data;

            // Apply fee status filter
            if (filterStatus === 'paid') studentsData = studentsData.filter(s => s.feesPaid);
            else if (filterStatus === 'pending') studentsData = studentsData.filter(s => !s.feesPaid);

            setStudents(studentsData);

            // Fetch summaries based on active tab
            if (activeTab === 'attendance') {
                const summaryRes = await getAttendanceSummary(params).catch(() => ({ data: {} }));
                setAttendanceSummary(summaryRes.data);
            } else if (activeTab === 'fees') {
                const summaryRes = await getFeeSummary(params).catch(() => ({ data: {} }));
                setFeeSummary(summaryRes.data);
            }

            setEditedAttendance({});
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    // === ATTENDANCE FUNCTIONS ===
    const handleAttendanceChange = (studentId, value) => {
        const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
        setEditedAttendance(prev => ({ ...prev, [studentId]: numValue }));
    };

    const handleSaveAttendance = async (studentId) => {
        if (editedAttendance[studentId] === undefined) return;
        try {
            setSaving(true);
            await updateStudentAttendance(studentId, editedAttendance[studentId]);
            setStudents(prev => prev.map(s => s._id === studentId ? { ...s, attendance: editedAttendance[studentId] } : s));
            setEditedAttendance(prev => { const newState = { ...prev }; delete newState[studentId]; return newState; });
            setSuccessMessage('Attendance updated'); setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) { console.error('Error updating attendance:', error); }
        finally { setSaving(false); }
    };

    const handleBulkSave = async () => {
        const updates = Object.entries(editedAttendance).map(([studentId, attendance]) => ({ studentId, attendance }));
        if (updates.length === 0) return;
        try {
            setSaving(true);
            await bulkUpdateAttendance(updates);
            setStudents(prev => prev.map(s => editedAttendance[s._id] !== undefined ? { ...s, attendance: editedAttendance[s._id] } : s));
            setEditedAttendance({});
            setSuccessMessage(`Updated ${updates.length} students`); setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) { console.error('Error bulk updating:', error); }
        finally { setSaving(false); }
    };

    const getAttendanceColor = (att) => att >= 75 ? 'text-emerald-600' : att >= 60 ? 'text-amber-600' : 'text-red-600';

    // === FEES FUNCTIONS ===
    const handleEditFees = (student) => {
        setSelectedStudent(student);
        setFeeForm({
            totalAmount: student.feeDetails?.totalAmount || 0,
            paidAmount: student.feeDetails?.paidAmount || 0,
            remarks: student.feeDetails?.remarks || ''
        });
        setShowFeeModal(true);
    };

    const handleSaveFees = async () => {
        if (!selectedStudent) return;
        try {
            setSaving(true);
            const dueAmount = Math.max(0, feeForm.totalAmount - feeForm.paidAmount);
            const feesPaid = dueAmount === 0;
            await updateStudentFeeStatus(selectedStudent._id, {
                feesPaid,
                feeDetails: { totalAmount: feeForm.totalAmount, paidAmount: feeForm.paidAmount, dueAmount, lastPaymentDate: new Date(), remarks: feeForm.remarks }
            });
            setStudents(prev => prev.map(s => s._id === selectedStudent._id ? { ...s, feesPaid, feeDetails: { ...feeForm, dueAmount } } : s));
            setShowFeeModal(false);
            setSuccessMessage('Fee status updated'); setTimeout(() => setSuccessMessage(''), 3000);
            fetchData();
        } catch (error) { console.error('Error updating fee status:', error); }
        finally { setSaving(false); }
    };

    const handleQuickToggle = async (student) => {
        try {
            setSaving(true);
            await updateStudentFeeStatus(student._id, { feesPaid: !student.feesPaid });
            setStudents(prev => prev.map(s => s._id === student._id ? { ...s, feesPaid: !s.feesPaid } : s));
            setSuccessMessage(`Fees ${!student.feesPaid ? 'marked as paid' : 'marked as pending'}`); setTimeout(() => setSuccessMessage(''), 3000);
            fetchData();
        } catch (error) { console.error('Error toggling fee status:', error); }
        finally { setSaving(false); }
    };

    // === ELIGIBILITY FUNCTIONS ===
    const checkEligibility = (student) => {
        const issues = [];
        if (student.attendance < 75) issues.push(`Low attendance: ${student.attendance}% (min 75%)`);
        if (!student.feesPaid) issues.push('Fees not cleared');
        return { eligible: issues.length === 0, issues };
    };

    const handleViewEligibility = async (student) => {
        setSelectedStudent(student);
        setShowEligibilityModal(true);
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

    // Filtered students based on search and eligibility filter
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'eligibility') {
            if (filterEligibility === 'eligible') return matchesSearch && student.attendance >= 75 && student.feesPaid;
            if (filterEligibility === 'ineligible') return matchesSearch && (student.attendance < 75 || !student.feesPaid);
        }
        return matchesSearch;
    });

    const eligibleCount = students.filter(s => s.attendance >= 75 && s.feesPaid).length;
    const ineligibleCount = students.filter(s => s.attendance < 75 || !s.feesPaid).length;

    const tabs = [
        { id: 'attendance', label: 'Attendance', icon: ClipboardList },
        { id: 'fees', label: 'Fee Management', icon: CreditCard },
        { id: 'eligibility', label: 'Eligibility', icon: Award }
    ];

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Student Management</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">
                            Manage attendance, fees, and eligibility
                            {staffDepartment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">{staffDepartment}</span>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                        {activeTab === 'attendance' && Object.keys(editedAttendance).length > 0 && (
                            <button onClick={handleBulkSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm">
                                <Save className="w-4 h-4" /> Save All ({Object.keys(editedAttendance).length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2 border border-emerald-100">
                        <Check className="w-4 h-4" /> {successMessage}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Summary Cards based on tab */}
                {activeTab === 'attendance' && attendanceSummary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Students', value: attendanceSummary.totalStudents, color: 'zinc' },
                            { label: 'Above 75%', value: attendanceSummary.aboveThreshold, color: 'emerald' },
                            { label: 'Below 75%', value: attendanceSummary.belowThreshold, color: 'red' },
                            { label: 'Average', value: attendanceSummary.averageAttendance, suffix: '%', color: 'violet' }
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

                {activeTab === 'fees' && feeSummary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Students', value: feeSummary.totalStudents, color: 'zinc' },
                            { label: 'Fees Cleared', value: feeSummary.feesPaidCount, color: 'emerald' },
                            { label: 'Fees Pending', value: feeSummary.feesPendingCount, color: 'red' },
                            { label: 'Clearance Rate', value: feeSummary.clearanceRate, suffix: '%', color: 'violet' }
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

                {activeTab === 'eligibility' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="metric-card bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><Users className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-violet-200 text-xs">Total Students</p>
                                    <p className="text-2xl font-semibold mt-0.5"><AnimatedNumber value={students.length} /></p>
                                </div>
                            </div>
                        </div>
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                                <div>
                                    <p className="text-zinc-500 text-xs">Eligible</p>
                                    <p className="text-2xl font-semibold text-emerald-600 mt-0.5"><AnimatedNumber value={eligibleCount} /></p>
                                </div>
                            </div>
                        </div>
                        <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><XCircle className="w-5 h-5 text-red-500" /></div>
                                <div>
                                    <p className="text-zinc-500 text-xs">Not Eligible</p>
                                    <p className="text-2xl font-semibold text-red-600 mt-0.5"><AnimatedNumber value={ineligibleCount} /></p>
                                </div>
                            </div>
                        </div>
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
                            {activeTab === 'fees' && (
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                                    <option value="all">All Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                </select>
                            )}
                            {activeTab === 'eligibility' && (
                                <select value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)} className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                                    <option value="all">All Students</option>
                                    <option value="eligible">Eligible Only</option>
                                    <option value="ineligible">Ineligible Only</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>
                                    <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Student</th>
                                    <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Roll No</th>
                                    {activeTab === 'attendance' && (
                                        <>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Year</th>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Attendance</th>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'fees' && (
                                        <>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Due Amount</th>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'eligibility' && (
                                        <>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Attendance</th>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Fees</th>
                                            <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Eligibility</th>
                                        </>
                                    )}
                                    <th className="text-left py-3 px-5 text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-5 py-10 text-center text-zinc-400 text-sm"><Loader className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="7" className="px-5 py-10 text-center text-zinc-400 text-sm">No students found</td></tr>
                                ) : (
                                    filteredStudents.map(student => {
                                        const att = editedAttendance[student._id] ?? student.attendance ?? 0;
                                        const { eligible } = checkEligibility(student);
                                        return (
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

                                                {activeTab === 'attendance' && (
                                                    <>
                                                        <td className="py-3 px-5 text-sm text-zinc-600">{student.year || '-'}</td>
                                                        <td className="py-3 px-5">
                                                            <input type="number" min="0" max="100" value={att} onChange={(e) => handleAttendanceChange(student._id, e.target.value)} className={`w-16 px-2 py-1 border border-zinc-200 rounded-lg text-sm text-center font-medium ${getAttendanceColor(att)} focus:outline-none focus:ring-2 focus:ring-violet-100`} />
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            {att >= 75 ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><ArrowUp className="w-3 h-3" /> Eligible</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100"><ArrowDown className="w-3 h-3" /> Low</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}

                                                {activeTab === 'fees' && (
                                                    <>
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
                                                    </>
                                                )}

                                                {activeTab === 'eligibility' && (
                                                    <>
                                                        <td className="py-3 px-5">
                                                            <span className={`text-sm font-medium ${student.attendance >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{student.attendance || 0}%</span>
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            {student.feesPaid ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3 h-3" /> Paid</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100"><XCircle className="w-3 h-3" /> Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-5">
                                                            {eligible ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> Eligible</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100"><AlertTriangle className="w-3.5 h-3.5" /> Not Eligible</span>
                                                            )}
                                                        </td>
                                                    </>
                                                )}

                                                <td className="py-3 px-5">
                                                    {activeTab === 'attendance' && editedAttendance[student._id] !== undefined && (
                                                        <button onClick={() => handleSaveAttendance(student._id)} disabled={saving} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors disabled:opacity-50"><Save className="w-4 h-4" /></button>
                                                    )}
                                                    {activeTab === 'fees' && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleQuickToggle(student)} disabled={saving} className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${student.feesPaid ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={student.feesPaid ? 'Mark Pending' : 'Mark Paid'}>
                                                                {student.feesPaid ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                            </button>
                                                            <button onClick={() => handleEditFees(student)} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors" title="Edit Details">
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {activeTab === 'eligibility' && (
                                                        <button onClick={() => handleViewEligibility(student)} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors"><FileText className="w-4 h-4" /></button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fee Details Modal */}
                <Modal isOpen={showFeeModal && !!selectedStudent} onClose={() => setShowFeeModal(false)} title={`Fee Details - ${selectedStudent?.name || ''}`} size="md">
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
                        <button onClick={() => setShowFeeModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">Cancel</button>
                        <button onClick={handleSaveFees} disabled={saving} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </Modal>

                {/* Eligibility Details Modal */}
                <Modal isOpen={showEligibilityModal && !!selectedStudent} onClose={() => setShowEligibilityModal(false)} title="Eligibility Details" size="md">
                    {checkingEligibility ? (
                        <div className="text-center py-8"><Loader className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-3" /><p className="text-zinc-500 text-sm">Checking eligibility...</p></div>
                    ) : eligibilityDetails ? (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 text-xl font-semibold">{eligibilityDetails.name?.charAt(0)}</div>
                                <div>
                                    <h4 className="font-semibold text-zinc-900">{eligibilityDetails.name}</h4>
                                    <p className="text-xs text-zinc-500">{eligibilityDetails.rollNumber} · {eligibilityDetails.department}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-zinc-50 rounded-lg">
                                    <p className="text-xs text-zinc-500 mb-1">Attendance</p>
                                    <p className={`text-xl font-bold ${eligibilityDetails.attendance >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{eligibilityDetails.attendance}%</p>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-lg">
                                    <p className="text-xs text-zinc-500 mb-1">Fee Status</p>
                                    <p className={`text-xl font-bold ${eligibilityDetails.feesPaid ? 'text-emerald-600' : 'text-red-600'}`}>{eligibilityDetails.feesPaid ? 'Cleared' : 'Pending'}</p>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg ${eligibilityDetails.eligible ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {eligibilityDetails.eligible ? (<><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-700">Eligible for Hall Ticket</span></>) : (<><XCircle className="w-5 h-5 text-red-600" /><span className="font-semibold text-red-700">Not Eligible</span></>)}
                                </div>
                                {eligibilityDetails.issues?.length > 0 && (<ul className="text-xs text-red-700 list-disc pl-5 space-y-1">{eligibilityDetails.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>)}
                            </div>
                        </div>
                    ) : null}
                    <div className="flex justify-end mt-6 pt-4 border-t border-zinc-100">
                        <button onClick={() => setShowEligibilityModal(false)} className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">Close</button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default StaffStudentManagement;
