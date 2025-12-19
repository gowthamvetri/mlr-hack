import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getUsers, getDepartments, createUserByAdmin, deleteUser } from '../../utils/api';
import {
    Users, Search, UserPlus, Download, Mail,
    Building, Star, BookOpen, X, Trash2, Edit, AlertTriangle, CheckCircle,
    ArrowUpRight, ArrowDownRight, Grid3X3, List, Eye, Briefcase, GraduationCap, MoreHorizontal
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';
import PremiumFilterBar, { FilterTriggerButton } from '../../components/PremiumFilterBar';
import gsap from 'gsap';

// Premium Animated Counter - Smooth count-up with easing
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
            // Smooth ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const newVal = start + (end - start) * eased;
            setDisplayValue(suffix === '/5' || suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
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

// Minimal Progress Ring - Clean, refined circular progress
const ProgressRing = ({ percentage, size = 40, strokeWidth = 3 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-dark-400">{percentage}%</span>
            </div>
        </div>
    );
};

// Skeleton with subtle shimmer
const SkeletonCard = () => (
    <div className="rounded-xl p-5 bg-dark-800/50 border border-dark-700">
        <div className="animate-pulse">
            <div className="flex items-start justify-between mb-6">
                <div className="w-9 h-9 bg-dark-700 rounded-lg" />
                <div className="w-16 h-5 bg-dark-700 rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-20 bg-dark-700 rounded" />
                <div className="h-8 w-14 bg-dark-700 rounded" />
            </div>
        </div>
    </div>
);

const SkeletonStaffCard = () => (
    <div className="rounded-xl p-5 bg-dark-800/50 border border-dark-700">
        <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-dark-700 rounded-full" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-dark-700 rounded" />
                    <div className="h-3 w-36 bg-dark-700 rounded" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full bg-dark-700 rounded" />
                <div className="h-3 w-2/3 bg-dark-700 rounded" />
            </div>
        </div>
    </div>
);

const AdminStaff = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [departments, setDepartments] = useState(['all']);
    const [stats, setStats] = useState({ total: 0, professors: 0, avgRating: 0, totalCourses: 0 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', department: 'CSE', designation: 'Assistant Professor', experience: '', phone: '', subjects: [] });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const socket = useSocket();

    useEffect(() => { fetchInitialData(); }, []);

    useEffect(() => {
        if (!socket) return;
        const handleStaffUpdate = () => { fetchStaff(); };
        socket.on('staff_created', handleStaffUpdate);
        socket.on('staff_deleted', handleStaffUpdate);
        return () => { socket.off('staff_created', handleStaffUpdate); socket.off('staff_deleted', handleStaffUpdate); };
    }, [socket, filterDept]);

    useEffect(() => { fetchStaff(); }, [filterDept]);

    // Refined GSAP Animations - Subtle and elegant
    useEffect(() => {
        if (!pageRef.current || loading) return;
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
                gsap.fromTo('.filter-bar', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.2, ease: 'power2.out' });
                gsap.fromTo('.staff-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.25, ease: 'power2.out' });
            }, pageRef);
            return () => ctx.revert();
        }, 50);
        return () => clearTimeout(timer);
    }, [loading, viewMode]);

    const fetchInitialData = async () => {
        try {
            const { data } = await getDepartments();
            const deptCodes = data.map(d => d.code);
            setDepartments(['all', ...deptCodes]);
        } catch (error) {
            setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
            await fetchStaff();
        }
    };

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const params = { role: 'Staff' };
            if (filterDept !== 'all') params.department = filterDept;
            const { data } = await getUsers(params);
            setStaff(data || []);
            const staffData = data || [];
            const total = staffData.length;
            const professors = staffData.filter(f => f.designation?.includes('Professor')).length;
            const ratedStaff = staffData.filter(f => f.rating != null);
            const avgRating = ratedStaff.length > 0 ? (ratedStaff.reduce((acc, f) => acc + f.rating, 0) / ratedStaff.length).toFixed(1) : 0;
            const totalCourses = staffData.reduce((acc, f) => acc + (f.courses || 0), 0);
            setStats({ total, professors, avgRating, totalCourses });
        } catch (error) {
            setStaff([]);
            setStats({ total: 0, professors: 0, avgRating: 0, totalCourses: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault(); setFormError(''); setFormSuccess('');
        if (!formData.name || !formData.email || !formData.password) { setFormError('Please fill in all required fields'); return; }
        if (formData.password.length < 6) { setFormError('Password must be at least 6 characters'); return; }
        try {
            await createUserByAdmin({ ...formData, role: 'Staff' });
            setFormSuccess('Staff member added successfully!');
            setTimeout(() => { setShowAddModal(false); setFormData({ name: '', email: '', password: '', department: 'CSE', designation: 'Assistant Professor', experience: '', phone: '', subjects: [] }); setFormSuccess(''); fetchStaff(); }, 1500);
        } catch (error) { setFormError(error.response?.data?.message || 'Error adding staff member'); }
    };

    const handleDeleteStaff = async () => {
        if (!selectedStaff) return;
        try { await deleteUser(selectedStaff._id); setShowDeleteModal(false); setSelectedStaff(null); fetchStaff(); }
        catch (error) { alert('Error deleting staff member'); }
    };

    const handleExport = () => {
        const headers = ['Name', 'Email', 'Department', 'Designation', 'Experience', 'Rating', 'Status'];
        const csvContent = [headers.join(','), ...filteredStaff.map(f => [f.name, f.email, f.department, f.designation, f.experience, f.rating, f.status || 'Active'].join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `staff_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    const clearFilters = () => { setSearchQuery(''); setFilterDept('all'); };
    const hasActiveFilters = searchQuery || filterDept !== 'all';

    const filteredStaff = staff.filter(f => {
        const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || f.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDept === 'all' || f.department === filterDept || f.department?.code === filterDept;
        return matchesSearch && matchesDept;
    });

    // Department distribution for mini chart
    const deptDistribution = departments.slice(1).map(d => ({
        name: d,
        count: staff.filter(s => s.department === d).length
    })).filter(d => d.count > 0);

    const maxDeptCount = Math.max(...deptDistribution.map(d => d.count), 1);

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">

                {/* Premium Header - Clean and confident */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">Staff Directory</h1>
                        <p className="text-dark-400 text-sm mt-0.5">Manage faculty members across departments</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <FilterTriggerButton
                            isOpen={filterPanelOpen}
                            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                            activeFiltersCount={(filterDept !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0)}
                        />
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-dark-400 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-all duration-200"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all duration-200 shadow-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Add Staff</span>
                        </button>
                    </div>
                </div>

                {/* Metric Cards - Premium minimal design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                    ) : (
                        <>
                            {/* Total Staff */}
                            <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center border border-white/5">
                                        <Users className="w-4.5 h-4.5 text-dark-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span>8%</span>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Staff</p>
                                <p className="text-2xl font-semibold text-white">
                                    <AnimatedNumber value={stats.total} />
                                </p>

                                {/* Mini bar chart for departments */}
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-end gap-1 h-8">
                                        {deptDistribution.slice(0, 6).map((dept, i) => (
                                            <div
                                                key={dept.name}
                                                className="flex-1 bg-violet-500/50 rounded-sm transition-all duration-500 hover:bg-violet-500"
                                                style={{ height: `${(dept.count / maxDeptCount) * 100}%`, minHeight: '4px' }}
                                                title={`${dept.name}: ${dept.count}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-dark-400 mt-1.5">Across {deptDistribution.length} departments</p>
                                </div>
                            </div>

                            {/* Professors */}
                            <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/10">
                                        <GraduationCap className="w-4.5 h-4.5 text-violet-400" strokeWidth={1.5} />
                                    </div>
                                    <ProgressRing percentage={stats.total > 0 ? Math.round((stats.professors / stats.total) * 100) : 0} />
                                </div>
                                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Professors</p>
                                <p className="text-2xl font-semibold text-white">
                                    <AnimatedNumber value={stats.professors} />
                                </p>

                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-dark-500">{stats.total > 0 ? Math.round((stats.professors / stats.total) * 100) : 0}% of faculty</span>
                                        <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/10 px-2 py-0.5 rounded">Senior</span>
                                    </div>
                                </div>
                            </div>

                            {/* Avg Rating */}
                            <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                                        <Star className="w-4.5 h-4.5 text-amber-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 transition-colors ${i <= Math.round(parseFloat(stats.avgRating) || 0) ? 'text-amber-400 fill-amber-400' : 'text-dark-600'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Avg. Rating</p>
                                <p className="text-2xl font-semibold text-white">
                                    <AnimatedNumber value={parseFloat(stats.avgRating) || 0} suffix="/5" />
                                </p>

                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="relative h-1.5 bg-dark-700 rounded-full overflow-hidden">
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                                            style={{ width: `${((parseFloat(stats.avgRating) || 0) / 5) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-dark-400 mt-1.5">Performance score</p>
                                </div>
                            </div>

                            {/* Active Courses */}
                            <div className="metric-card group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                                        <BookOpen className="w-4.5 h-4.5 text-emerald-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                                        <ArrowUpRight className="w-3 h-3" />
                                        <span>12%</span>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Active Courses</p>
                                <p className="text-2xl font-semibold text-white">
                                    <AnimatedNumber value={stats.totalCourses} />
                                </p>

                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-xs text-dark-400">Being taught</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Collapsible Premium Filter Panel */}
                <PremiumFilterBar
                    isOpen={filterPanelOpen}
                    onClose={() => setFilterPanelOpen(false)}

                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchPlaceholder="Search by name, email, department..."

                    departments={departments}
                    filterDept={filterDept}
                    setFilterDept={setFilterDept}
                    deptCounts={deptDistribution.reduce((acc, d) => ({ ...acc, [d.name]: d.count }), {})}

                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    showViewToggle={true}

                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}

                    filteredCount={filteredStaff.length}
                    totalCount={staff.length}
                />

                {/* Staff Display */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStaffCard key={i} />)}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStaff.length > 0 ? filteredStaff.map((member) => (
                            <div
                                key={member._id}
                                className="staff-item group glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-11 h-11 bg-gradient-to-br from-violet-600/20 to-violet-600/10 rounded-full flex items-center justify-center border border-violet-500/20">
                                                <span className="text-violet-300 font-medium text-sm">
                                                    {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                                </span>
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-dark-800" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white text-sm group-hover:text-violet-400 transition-colors">
                                                {member.name || 'Unknown'}
                                            </h3>
                                            <p className="text-xs text-dark-400">{member.designation || 'Staff'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); }}
                                        className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="px-3 py-2 bg-dark-700/50 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Department</p>
                                        <p className="text-xs font-medium text-dark-300">{member.department || 'N/A'}</p>
                                    </div>
                                    <div className="px-3 py-2 bg-dark-700/50 rounded-lg border border-white/5">
                                        <p className="text-[10px] text-dark-500 uppercase tracking-wide mb-0.5">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-xs font-medium text-dark-300">{member.rating || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="space-y-2 mb-4 text-xs">
                                    <div className="flex items-center gap-2 text-dark-400">
                                        <Mail className="w-3.5 h-3.5 text-dark-500" strokeWidth={1.5} />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                    {member.experience && (
                                        <div className="flex items-center gap-2 text-dark-400">
                                            <Briefcase className="w-3.5 h-3.5 text-dark-500" strokeWidth={1.5} />
                                            <span>{member.experience} experience</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border border-white/5 ${(member.status === 'Active' || !member.status)
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-dark-700 text-dark-400'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${(member.status === 'Active' || !member.status) ? 'bg-emerald-500' : 'bg-dark-500'}`} />
                                        {member.status || 'Active'}
                                    </span>
                                    <span className="text-[10px] text-dark-400">
                                        {member.courses || member.subjects?.length || 0} courses
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-full flex items-center justify-center">
                                    <Users className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-medium text-white mb-1">No staff found</h3>
                                <p className="text-xs text-dark-400 mb-4">Try adjusting your filters</p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 text-dark-300 rounded-lg text-xs font-medium hover:bg-dark-600 transition-colors">
                                        <X className="w-3 h-3" />
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* List View - Clean table */
                    <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-800/50 border-b border-dark-700">
                                    <tr>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Staff Member</th>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Department</th>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Designation</th>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Rating</th>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Status</th>
                                        <th className="text-left py-3 px-5 text-xs font-medium text-dark-400 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-700">
                                    {filteredStaff.map((member) => (
                                        <tr key={member._id} className="staff-item group hover:bg-dark-800/30 transition-colors">
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-gradient-to-br from-violet-600/20 to-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center">
                                                        <span className="text-violet-300 font-medium text-xs">{member.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{member.name}</p>
                                                        <p className="text-xs text-dark-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className="px-2 py-1 bg-dark-700/50 text-dark-300 border border-white/5 rounded text-xs font-medium">{member.department}</span>
                                            </td>
                                            <td className="py-3 px-5 text-sm text-dark-400">{member.designation || 'Staff'}</td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                    <span className="text-sm font-medium text-dark-300">{member.rating || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/5 ${(member.status === 'Active' || !member.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                                                    <span className={`w-1 h-1 rounded-full ${(member.status === 'Active' || !member.status) ? 'bg-emerald-500' : 'bg-dark-500'}`} />
                                                    {member.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-0.5">
                                                    <button className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-1.5 text-dark-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); }}
                                                        className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredStaff.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-full flex items-center justify-center">
                                    <Users className="w-7 h-7 text-dark-400" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-medium text-white mb-1">No staff found</h3>
                            </div>
                        )}
                        {filteredStaff.length > 0 && (
                            <div className="px-5 py-3 bg-dark-800/30 border-t border-dark-700">
                                <p className="text-xs text-dark-500">
                                    Showing <span className="font-medium text-white">{filteredStaff.length}</span> of <span className="font-medium text-white">{staff.length}</span> staff members
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Staff Modal */}
                <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Staff" size="md">
                    <form onSubmit={handleAddStaff} className="space-y-4">
                        {formError && (
                            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/10 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {formSuccess}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-dark-400 mb-1.5">Full Name *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="Enter name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Email *</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="email@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Password *</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="Min 6 chars" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Department</label>
                                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                                    {departments.slice(1).map(d => <option key={d} value={d} className="bg-dark-800">{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Designation</label>
                                <select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50">
                                    <option className="bg-dark-800">Professor</option>
                                    <option className="bg-dark-800">Associate Professor</option>
                                    <option className="bg-dark-800">Assistant Professor</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Experience</label>
                                <input type="text" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="e.g., 5 years" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-dark-400 mb-1.5">Phone</label>
                                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 text-white placeholder-dark-500 transition-all" placeholder="Phone number" />
                            </div>
                        </div>
                        <div className="flex gap-2.5 pt-3">
                            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                                Add Staff
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Modal */}
                <Modal isOpen={showDeleteModal && selectedStaff} onClose={() => setShowDeleteModal(false)} size="sm">
                    {selectedStaff && (
                        <div className="text-center py-2">
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/10">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Delete Staff?</h3>
                            <p className="text-sm text-dark-400 mb-6">
                                Are you sure you want to delete <strong className="text-white">{selectedStaff.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-2.5">
                                <button onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-dark-400 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteStaff} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default AdminStaff;
