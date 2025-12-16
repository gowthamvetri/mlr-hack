import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import { getUsers, getDepartments, registerUser, deleteUser } from '../../utils/api';
import {
    Users, Search, UserPlus, Download, Mail, Phone,
    School, Building, Award, MoreVertical, Star, BookOpen, X, Trash2, Edit, AlertTriangle, CheckCircle
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useSocket } from '../../context/SocketContext';

const AdminStaff = () => {
    const user = useSelector(selectCurrentUser);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('all');
    const [departments, setDepartments] = useState(['all']);
    const [stats, setStats] = useState({
        total: 0,
        professors: 0,
        avgRating: 0,
        totalCourses: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', department: 'CSE', designation: 'Assistant Professor', experience: '', phone: '', subjects: [] });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const socket = useSocket();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleStaffUpdate = () => {
            fetchStaff();
        };

        socket.on('staff_created', handleStaffUpdate);
        socket.on('staff_deleted', handleStaffUpdate);

        return () => {
            socket.off('staff_created', handleStaffUpdate);
            socket.off('staff_deleted', handleStaffUpdate);
        };
    }, [socket, filterDept]);

    useEffect(() => {
        fetchStaff();
    }, [filterDept]);

    const fetchInitialData = async () => {
        try {
            // Fetch departments
            const { data } = await getDepartments();
            const deptCodes = data.map(d => d.code);
            setDepartments(['all', ...deptCodes]);
        } catch (error) {
            console.log('Using default departments');
            setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
            // If department fetch fails, still try to fetch staff
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

            // Calculate stats from enriched data
            const staffData = data || [];
            const total = staffData.length;
            const professors = staffData.filter(f => f.designation?.includes('Professor')).length;
            // Calculate average rating from staff with ratings
            const ratedStaff = staffData.filter(f => f.rating != null);
            const avgRating = ratedStaff.length > 0
                ? (ratedStaff.reduce((acc, f) => acc + f.rating, 0) / ratedStaff.length).toFixed(1)
                : 0;
            // Calculate total courses from enriched data
            const totalCourses = staffData.reduce((acc, f) => acc + (f.courses || 0), 0);
            setStats({ total, professors, avgRating, totalCourses });
            return staffData;
        } catch (error) {
            console.error('Error fetching staff:', error);
            setStaff([]);
            setStats({
                total: 0,
                professors: 0,
                avgRating: 0,
                totalCourses: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault(); setFormError(''); setFormSuccess('');
        if (!formData.name || !formData.email || !formData.password) { setFormError('Please fill in all required fields (Name, Email, Password)'); return; }
        if (formData.password.length < 6) { setFormError('Password must be at least 6 characters'); return; }
        try {
            // Register as Staff user
            await registerUser({ ...formData, role: 'Staff' });
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

    const filteredStaff = staff.filter(f => {
        const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDept === 'all' || f.department === filterDept || f.department?.code === filterDept;
        return matchesSearch && matchesDept;
    });

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Staff Management</h1>
                    <p className="text-sm sm:text-base text-gray-500">Manage teaching staff and their assignments</p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base">
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Total Staff</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={stats.total} /></p>
                        </div>
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <School className="w-5 h-5 text-primary-600" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Professors</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={stats.professors} /></p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Avg. Rating</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={parseFloat(stats.avgRating) || 0} /></p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 sm:p-5 tilt-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Active Courses</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1"><AnimatedNumber value={stats.totalCourses} /></p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search staff by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <select
                        className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {departments.slice(1).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaff.map((member) => (
                    <div key={member._id} className="glass-card rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                                    <span className="text-primary-600 font-bold text-xl">
                                        {member.name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{member.name || 'Unknown'}</h3>
                                    <p className="text-sm text-gray-500">{member.designation || member.role || 'Staff'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); }}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                                title="Delete Staff"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span>{member.department || 'Not Assigned'} Department</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{member.email || 'No email'}</span>
                            </div>
                            {member.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{member.phone}</span>
                                </div>
                            )}
                            {member.experience && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    <span>{member.experience} experience</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            {member.rating ? (
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-semibold text-gray-800">{member.rating}</span>
                                    <span className="text-gray-400 text-sm">/5.0</span>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">No rating</span>
                            )}
                            <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{member.courses || member.subjects?.length || 0} courses</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${(member.status === 'Active' || !member.status)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {member.status || 'Active'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredStaff.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                    <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No staff found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Staff"
                size="md"
            >
                <form onSubmit={handleAddStaff} className="space-y-4">
                    {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
                    {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Staff Name" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="staff@mlrit.ac.in" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Min 6 characters" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Department *</label><select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><select value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience</label><input type="text" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 10 years" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="Phone number" /></div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Staff</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal && selectedStaff}
                onClose={() => setShowDeleteModal(false)}
                size="sm"
            >
                {selectedStaff && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Staff?</h3>
                        <p className="text-gray-500 mb-6">Are you sure you want to delete <strong>{selectedStaff.name}</strong>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDeleteStaff} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default AdminStaff;
