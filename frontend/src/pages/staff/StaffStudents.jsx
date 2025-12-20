import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { useAppDispatch } from '../../store';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import { createUserByAdmin, bulkImportStudents } from '../../utils/api';
import {
    Users, Search, Download, GraduationCap, Building, Eye, AlertTriangle,
    X, Grid3X3, List, Calendar, Mail, Hash, BookOpen, Target, CheckCircle,
    MoreHorizontal, RefreshCw, UserCheck, XCircle, Clock, Filter, UserPlus,
    Upload, FileSpreadsheet, Table
} from 'lucide-react';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API;

// Premium Animated Counter
const AnimatedNumber = ({ value, suffix = '', prefix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);

    useEffect(() => {
        const duration = 600;
        const start = prevValue.current;
        const end = typeof value === 'number' ? value : parseFloat(value) || 0;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const newVal = start + (end - start) * eased;
            setDisplayValue(suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
            if (progress < 1) requestAnimationFrame(animate);
            else prevValue.current = end;
        };
        requestAnimationFrame(animate);
    }, [value, suffix]);

    return (
        <span className="tabular-nums tracking-tight">
            {prefix}{displayValue}{suffix}
        </span>
    );
};

// Progress Ring
const ProgressRing = ({ percentage, size = 40, strokeWidth = 3, color = '#8b5cf6' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-zinc-600">{percentage}%</span>
            </div>
        </div>
    );
};

// Skeleton components
const SkeletonCard = () => (
    <div className="rounded-xl p-5 bg-white border border-zinc-200 shadow-sm">
        <div className="animate-pulse">
            <div className="flex items-start justify-between mb-6">
                <div className="w-9 h-9 bg-zinc-100 rounded-lg" />
                <div className="w-16 h-5 bg-zinc-100 rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-20 bg-zinc-100 rounded" />
                <div className="h-8 w-14 bg-zinc-100 rounded" />
            </div>
        </div>
    </div>
);

const SkeletonStudentCard = () => (
    <div className="rounded-xl p-5 bg-white border border-zinc-200 shadow-sm">
        <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-zinc-100 rounded-full" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-zinc-100 rounded" />
                    <div className="h-3 w-36 bg-zinc-100 rounded" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-100 rounded" />
                <div className="h-3 w-2/3 bg-zinc-100 rounded" />
            </div>
        </div>
    </div>
);

const StaffStudents = () => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useAppDispatch();
    const pageRef = useRef(null);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Add Student Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', year: '1', role: 'Student'
    });
    const [formError, setFormError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Bulk Import State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [excelPreview, setExcelPreview] = useState([]);
    const [bulkResult, setBulkResult] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const years = ['all', '1', '2', '3', '4'];

    // Fetch students from staff API (auto-filtered by department)
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filterYear !== 'all') params.append('year', filterYear);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`${API_URL}staff/students?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch students');
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
            dispatch(showErrorToast(error.message || 'Error fetching students'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [filterYear]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // GSAP Animations
    useEffect(() => {
        if (!pageRef.current || loading) return;
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
                gsap.fromTo('.student-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.2, ease: 'power2.out' });
            }, pageRef);
            return () => ctx.revert();
        }, 50);
        return () => clearTimeout(timer);
    }, [loading, viewMode]);

    const handleExport = () => {
        const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Attendance', 'Fees Paid'];
        const csvContent = [headers.join(','), ...students.map(s =>
            [s.name, s.email, s.rollNumber, s.department, s.year, s.attendance || 0, s.feesPaid ? 'Yes' : 'No'].join(',')
        )].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `students_${user?.department || 'dept'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); window.URL.revokeObjectURL(url);
    };

    // Add new student
    const handleAddStudent = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.name || !formData.email || !formData.password) {
            setFormError('Please fill in all required fields');
            return;
        }
        setIsCreating(true);
        try {
            // Auto-assign staff's department to the student
            const studentData = {
                ...formData,
                department: user?.department || 'CSE',
                role: 'Student'
            };
            await createUserByAdmin(studentData);
            dispatch(showSuccessToast('Student added successfully!'));
            setShowAddModal(false);
            setFormData({ name: '', email: '', password: '', year: '1', role: 'Student' });
            fetchStudents();
        } catch (error) {
            setFormError(error?.response?.data?.message || error?.message || 'Error adding student');
        } finally {
            setIsCreating(false);
        }
    };

    // Bulk Import - Download Excel template
    const downloadExcelTemplate = () => {
        const templateData = [
            { Name: 'John Doe', Email: '', Password: '', Year: '1', JoiningYear: 2024 },
            { Name: 'Jane Smith', Email: '', Password: 'jane456', Year: '2', JoiningYear: 2023 }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        ws['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 8 }, { wch: 12 }];
        XLSX.writeFile(wb, `students_template_${user?.department || 'dept'}.xlsx`);
    };

    // Handle Excel file upload
    const handleExcelUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const normalizedData = jsonData.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey === 'name') normalized.name = row[key];
                        else if (lowerKey === 'email') normalized.email = row[key];
                        else if (lowerKey === 'password' || lowerKey === 'pass') normalized.password = row[key];
                        else if (lowerKey === 'year') normalized.year = String(row[key]);
                        else if (lowerKey === 'joiningyear' || lowerKey === 'joining year') normalized.joiningYear = row[key];
                    });
                    // Auto-assign staff's department
                    normalized.department = user?.department || 'CSE';
                    return normalized;
                });

                setExcelPreview(normalizedData);
                setBulkResult(null);
            } catch (error) {
                console.error('Excel parse error:', error);
                setBulkResult({ error: 'Failed to parse Excel file. Please check the format.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleExcelUpload(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            handleExcelUpload(file);
        } else {
            setBulkResult({ error: 'Please upload an Excel file (.xlsx or .xls)' });
        }
    };

    const handleExcelImport = async () => {
        if (excelPreview.length === 0) {
            setBulkResult({ error: 'No data to import' });
            return;
        }
        try {
            setBulkLoading(true);
            setBulkResult(null);
            const { data } = await bulkImportStudents(excelPreview);
            setBulkResult(data);
            setExcelPreview([]);
            fetchStudents();
        } catch (error) {
            setBulkResult({ error: error.response?.data?.message || 'Error importing students' });
        } finally {
            setBulkLoading(false);
        }
    };

    const clearExcelPreview = () => {
        setExcelPreview([]);
        setBulkResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Calculate stats
    const stats = useMemo(() => ({
        total: students.length,
        approved: students.filter(s => s.isApproved).length,
        pending: students.filter(s => !s.isApproved).length,
        avgAttendance: students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length)
            : 0,
        feesPaid: students.filter(s => s.feesPaid).length,
        lowAttendance: students.filter(s => (s.attendance || 0) < 75).length
    }), [students]);

    // Year distribution
    const yearDistribution = useMemo(() =>
        ['1', '2', '3', '4'].map(y => ({
            year: y,
            count: students.filter(s => s.year === y).length
        })), [students]);
    const maxYearCount = Math.max(...yearDistribution.map(y => y.count), 1);

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto text-zinc-900">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Department Students</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">
                            Managing students in <span className="font-bold text-zinc-900">{user?.department || 'your department'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-md transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Student</span>
                        </button>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Bulk Import</span>
                        </button>
                        <button
                            onClick={fetchStudents}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                    ) : (
                        <>
                            {/* Total Students */}
                            <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                        <Users className="w-4.5 h-4.5 text-violet-600" strokeWidth={2} />
                                    </div>
                                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">
                                        {user?.department}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Total Students</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    <AnimatedNumber value={stats.total} />
                                </p>
                                {/* Mini bar chart */}
                                <div className="mt-4 pt-3 border-t border-zinc-100">
                                    <div className="flex items-end gap-1 h-8">
                                        {yearDistribution.map((y) => (
                                            <div
                                                key={y.year}
                                                className="flex-1 bg-violet-100 rounded-sm transition-all duration-500 hover:bg-violet-500"
                                                style={{ height: `${(y.count / maxYearCount) * 100}%`, minHeight: '4px' }}
                                                title={`Year ${y.year}: ${y.count}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-1.5">
                                        {yearDistribution.map((y) => (
                                            <span key={y.year} className="text-[9px] text-zinc-500 font-bold flex-1 text-center">Y{y.year}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Approved Students */}
                            <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                        <GraduationCap className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
                                    </div>
                                    <ProgressRing percentage={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0} color="#10b981" />
                                </div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Approved</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    <AnimatedNumber value={stats.approved} />
                                </p>
                                <div className="mt-4 pt-3 border-t border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 font-medium">Enrolled students</span>
                                        {stats.pending > 0 && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{stats.pending} pending</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Avg Attendance */}
                            <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                        <Target className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
                                    </div>
                                    {stats.lowAttendance > 0 && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">{stats.lowAttendance} low</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Avg. Attendance</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    <AnimatedNumber value={stats.avgAttendance} suffix="%" />
                                </p>
                                <div className="mt-4 pt-3 border-t border-zinc-100">
                                    <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute h-full rounded-full transition-all duration-700 ${stats.avgAttendance >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${stats.avgAttendance}%` }}
                                        />
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-zinc-300" style={{ left: '75%' }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[10px]">
                                        <span className="text-zinc-400 font-bold">0%</span>
                                        <span className={`font-bold ${stats.avgAttendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {stats.avgAttendance >= 75 ? '✓ Above 75%' : '↑ Below 75%'}
                                        </span>
                                        <span className="text-zinc-400 font-bold">100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fees Paid */}
                            <div className="metric-card group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                        <CheckCircle className="w-4.5 h-4.5 text-violet-600" strokeWidth={2} />
                                    </div>
                                    <ProgressRing percentage={stats.total > 0 ? Math.round((stats.feesPaid / stats.total) * 100) : 0} color="#8b5cf6" />
                                </div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Fees Cleared</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    <AnimatedNumber value={stats.feesPaid} />
                                </p>
                                <div className="mt-4 pt-3 border-t border-zinc-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 font-medium">Financial clearance</span>
                                        {stats.total - stats.feesPaid > 0 && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                                                {stats.total - stats.feesPaid} pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium"
                            />
                        </div>

                        {/* Year Filter */}
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-bold cursor-pointer"
                        >
                            <option value="all">All Years</option>
                            {['1', '2', '3', '4'].map(y => (
                                <option key={y} value={y}>Year {y}</option>
                            ))}
                        </select>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Results count */}
                        <span className="text-sm text-zinc-500 font-bold">
                            {students.length} student{students.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Students Display */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStudentCard key={i} />)}
                    </div>
                ) : students.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                            <Users className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">No Students Found</h3>
                        <p className="text-sm text-zinc-500 font-medium">
                            {searchQuery || filterYear !== 'all'
                                ? 'No students match your current filters.'
                                : 'No students in your department yet.'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((student) => (
                            <div
                                key={student._id}
                                className="student-item group bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-100 shadow-md">
                                                <span className="text-white font-medium text-sm">
                                                    {student.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${student.isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">
                                                {student.name}
                                            </h3>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate max-w-[140px]">{student.email}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedStudent(student); setShowDetailsModal(true); }}
                                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="px-2 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-center">
                                        <Hash className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={2} />
                                        <p className="text-[10px] font-mono font-bold text-zinc-600 truncate">{student.rollNumber}</p>
                                    </div>
                                    <div className="px-2 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-center">
                                        <BookOpen className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={2} />
                                        <p className="text-[10px] font-bold text-zinc-600">{student.department}</p>
                                    </div>
                                    <div className="px-2 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-center">
                                        <Calendar className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" strokeWidth={2} />
                                        <p className="text-[10px] font-bold text-zinc-600">Year {student.year}</p>
                                    </div>
                                </div>

                                {/* Attendance Bar */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="text-zinc-500 font-bold">Attendance</span>
                                        <span className={`font-bold ${(student.attendance || 0) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {student.attendance || 0}%
                                        </span>
                                    </div>
                                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${student.attendance || 0}%`,
                                                background: (student.attendance || 0) >= 75 ? '#10b981' : '#f59e0b'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                                    {student.isApproved ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle className="w-3 h-3" />
                                            Approved
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                            <Clock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${student.feesPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {student.feesPaid ? 'Fees Paid' : 'Fees Due'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Roll Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Year</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Attendance</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wide">Fees</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {students.map((student) => (
                                    <tr key={student._id} className="student-item hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                    {student.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900">{student.name}</p>
                                                    <p className="text-xs text-zinc-500 font-medium">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono font-medium text-zinc-600">{student.rollNumber}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-zinc-600">Year {student.year}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${student.attendance || 0}%`,
                                                            background: (student.attendance || 0) >= 75 ? '#10b981' : '#f59e0b'
                                                        }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold ${(student.attendance || 0) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {student.attendance || 0}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {student.isApproved ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    <CheckCircle className="w-3 h-3" /> Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${student.feesPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                {student.feesPaid ? '✓ Paid' : '× Due'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Student Details Modal */}
                <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedStudent(null); }} title="Student Details" size="md">
                    {selectedStudent && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-2xl">{selectedStudent.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-1">{selectedStudent.name}</h3>
                                    <p className="text-sm text-zinc-500 flex items-center gap-2 font-medium">
                                        <Mail className="w-4 h-4" /> {selectedStudent.email}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Roll Number</p>
                                    <p className="text-sm font-mono font-bold text-zinc-900">{selectedStudent.rollNumber}</p>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Department</p>
                                    <p className="text-sm font-bold text-zinc-900">{selectedStudent.department}</p>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Year</p>
                                    <p className="text-sm font-bold text-zinc-900">Year {selectedStudent.year}</p>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Semester</p>
                                    <p className="text-sm font-bold text-zinc-900">{selectedStudent.semester || '-'}</p>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Attendance</p>
                                    <p className={`text-sm font-bold ${(selectedStudent.attendance || 0) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedStudent.attendance || 0}%
                                    </p>
                                </div>
                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 font-bold mb-1">Status</p>
                                    <p className={`text-sm font-bold ${selectedStudent.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedStudent.isApproved ? 'Approved' : 'Pending'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <p className="text-xs text-zinc-500 font-bold mb-1">Fee Status</p>
                                <p className={`text-sm font-bold ${selectedStudent.feesPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {selectedStudent.feesPaid ? '✓ Fees Paid' : '× Fees Due'}
                                </p>
                                {selectedStudent.feeDetails && (
                                    <div className="mt-2 text-xs text-zinc-600 font-medium">
                                        {selectedStudent.feeDetails.paidAmount && <p>Paid: ₹{selectedStudent.feeDetails.paidAmount}</p>}
                                        {selectedStudent.feeDetails.dueAmount && <p>Due: ₹{selectedStudent.feeDetails.dueAmount}</p>}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => { setShowDetailsModal(false); setSelectedStudent(null); }}
                                className="w-full py-2.5 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors shadow-md"
                            >
                                Close Details
                            </button>
                        </div>
                    )}
                </Modal>

                {/* Add Student Modal */}
                <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Student" size="md">
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2 border border-red-100 font-bold">
                                <AlertTriangle className="w-4 h-4" />{formError}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                placeholder="Enter student name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                placeholder="Enter email address"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                placeholder="Enter initial password"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Year</label>
                            <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                            >
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full py-2.5 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isCreating ? 'Adding...' : 'Add Student'}
                        </button>
                    </form>
                </Modal>

                {/* Bulk Import Modal */}
                <Modal isOpen={showBulkModal} onClose={() => { setShowBulkModal(false); clearExcelPreview(); }} title="Bulk Import Students" size="lg">
                    <div className="space-y-6">
                        {/* Step 1: Download Template */}
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5" />
                                        Step 1: Download Template
                                    </h4>
                                    <p className="text-sm text-blue-700 mt-1 max-w-sm font-medium">Get the correctly formatted Excel template to add students.</p>
                                </div>
                                <button
                                    onClick={downloadExcelTemplate}
                                    className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Upload File */}
                        <div>
                            <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-zinc-500" />
                                Step 2: Upload Excel File
                            </h4>
                            {!excelPreview.length && !bulkResult ? (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300 hover:border-zinc-400 bg-white'}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                    />
                                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                        <FileSpreadsheet className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <p className="text-zinc-900 font-bold text-lg mb-1">Drag and drop excel file here</p>
                                    <p className="text-zinc-500 text-sm mb-4">or click to browse from your computer</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all shadow-md"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : null}

                            {/* Preview Table */}
                            {excelPreview.length > 0 && !bulkResult && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-zinc-900 flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-zinc-500" />
                                            Preview ({excelPreview.length} students)
                                        </p>
                                        <button onClick={clearExcelPreview} className="text-sm text-red-600 hover:text-red-700 font-bold hover:underline">
                                            Cancel & Upload New
                                        </button>
                                    </div>
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-sm">
                                            <thead className="bg-zinc-100 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-bold text-zinc-600">Name</th>
                                                    <th className="px-4 py-2 text-left font-bold text-zinc-600">Email</th>
                                                    <th className="px-4 py-2 text-left font-bold text-zinc-600">Year</th>
                                                    <th className="px-4 py-2 text-left font-bold text-zinc-600">Dept</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200">
                                                {excelPreview.map((row, i) => (
                                                    <tr key={i} className="bg-white">
                                                        <td className="px-4 py-2 text-zinc-900">{row.name}</td>
                                                        <td className="px-4 py-2 text-zinc-500 font-mono text-xs">{row.email}</td>
                                                        <td className="px-4 py-2 text-zinc-500">{row.year}</td>
                                                        <td className="px-4 py-2 text-zinc-500">{row.department}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleExcelImport}
                                            disabled={bulkLoading}
                                            className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
                                        >
                                            {bulkLoading ? <span className="animate-spin">⌛</span> : <Upload className="w-5 h-5" />}
                                            {bulkLoading ? 'Importing...' : 'Confirm Import'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Result Message */}
                            {bulkResult && (
                                <div className={`p-6 rounded-xl border animate-fade-in ${bulkResult.error ? 'bg-red-50 border-red-100 text-center' : 'bg-emerald-50 border-emerald-100 text-center'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${bulkResult.error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {bulkResult.error ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                                    </div>
                                    <h4 className={`text-lg font-bold mb-1 ${bulkResult.error ? 'text-red-900' : 'text-emerald-900'}`}>
                                        {bulkResult.error ? 'Import Failed' : 'Import Successful!'}
                                    </h4>
                                    <p className={`text-sm mb-4 font-medium ${bulkResult.error ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {bulkResult.error || `Successfully imported ${bulkResult.count} students.`}
                                    </p>
                                    <button
                                        onClick={clearExcelPreview}
                                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${bulkResult.error ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}
                                    >
                                        {bulkResult.error ? 'Try Again' : 'Done'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default StaffStudents;
