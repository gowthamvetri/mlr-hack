import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../utils/api';
import gsap from 'gsap';
import {
    Building2, Plus, Search, Edit, Trash2, Users, GraduationCap,
    AlertTriangle, Eye, Save, X, BookOpen, Award, Target
} from 'lucide-react';

// Animated Counter
const AnimatedNumber = ({ value }) => {
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

    return <span className="tabular-nums">{displayValue}</span>;
};

const AdminDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        overview: '',
        mission: '',
        vision: '',
        image: ''
    });
    const [formError, setFormError] = useState('');
    const pageRef = useRef(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
            gsap.fromTo('.dept-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const { data } = await getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            overview: '',
            mission: '',
            vision: '',
            image: ''
        });
        setFormError('');
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name || !formData.code) {
            setFormError('Name and Code are required');
            return;
        }

        setSaving(true);
        try {
            await createDepartment(formData);
            setShowAddModal(false);
            resetForm();
            fetchDepartments();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error creating department');
        } finally {
            setSaving(false);
        }
    };

    const handleEditDepartment = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name || !formData.code) {
            setFormError('Name and Code are required');
            return;
        }

        setSaving(true);
        try {
            await updateDepartment(selectedDept._id, formData);
            setShowEditModal(false);
            setSelectedDept(null);
            resetForm();
            fetchDepartments();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error updating department');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDept) return;

        setSaving(true);
        try {
            await deleteDepartment(selectedDept._id);
            setShowDeleteModal(false);
            setSelectedDept(null);
            fetchDepartments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting department');
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (dept) => {
        setSelectedDept(dept);
        setFormData({
            name: dept.name || '',
            code: dept.code || '',
            description: dept.description || '',
            overview: dept.overview || '',
            mission: dept.mission || '',
            vision: dept.vision || '',
            image: dept.image || ''
        });
        setFormError('');
        setShowEditModal(true);
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = departments.reduce((sum, d) => sum + (d.totalStudents || 0), 0);
    const totalFaculty = departments.reduce((sum, d) => sum + (d.totalFaculty || 0), 0);

    return (
        <DashboardLayout>
            <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Department Management</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage college departments and their information</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Department
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-xl p-5 border border-zinc-100 animate-pulse">
                                    <div className="h-4 bg-zinc-200 rounded w-20 mb-3"></div>
                                    <div className="h-8 bg-zinc-200 rounded w-16"></div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-violet-600" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Departments</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={departments.length} /></p>
                            </div>

                            <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Students</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={totalStudents} /></p>
                            </div>

                            <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-emerald-600" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Faculty</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={totalFaculty} /></p>
                            </div>

                            <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-amber-600" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Avg Students/Dept</p>
                                <p className="text-2xl font-semibold text-zinc-900">
                                    <AnimatedNumber value={departments.length > 0 ? Math.round(totalStudents / departments.length) : 0} />
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl border border-zinc-100 p-4 mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                        />
                    </div>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl p-6 border border-zinc-100 animate-pulse">
                                <div className="h-6 bg-zinc-200 rounded w-32 mb-3"></div>
                                <div className="h-4 bg-zinc-200 rounded w-20 mb-4"></div>
                                <div className="h-16 bg-zinc-100 rounded mb-4"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 bg-zinc-100 rounded flex-1"></div>
                                    <div className="h-8 bg-zinc-100 rounded flex-1"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-7 h-7 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-700 mb-2">No Departments Found</h3>
                        <p className="text-sm text-zinc-500 mb-4">
                            {searchQuery ? 'No departments match your search.' : 'Get started by adding your first department.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => { resetForm(); setShowAddModal(true); }}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add Department
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredDepartments.map((dept) => (
                            <div
                                key={dept._id}
                                className="dept-card group bg-white rounded-xl p-6 border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-600 transition-colors">
                                            {dept.name}
                                        </h3>
                                        <span className="inline-block mt-1 text-xs font-mono font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                            {dept.code}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                                    {dept.description || 'No description available'}
                                </p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-50 rounded-lg px-3 py-2 text-center">
                                        <GraduationCap className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                                        <p className="text-sm font-semibold text-zinc-900">{dept.totalStudents || 0}</p>
                                        <p className="text-[10px] text-zinc-500">Students</p>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg px-3 py-2 text-center">
                                        <Users className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                                        <p className="text-sm font-semibold text-zinc-900">{dept.totalFaculty || 0}</p>
                                        <p className="text-[10px] text-zinc-500">Faculty</p>
                                    </div>
                                </div>

                                {/* HOD */}
                                {dept.headOfDepartment && (
                                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-zinc-50 rounded-lg">
                                        <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-medium text-zinc-600">
                                            {dept.headOfDepartment.name?.charAt(0) || 'H'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-zinc-700">{dept.headOfDepartment.name}</p>
                                            <p className="text-[10px] text-zinc-500">Head of Department</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-zinc-100">
                                    <button
                                        onClick={() => openEditModal(dept)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { setSelectedDept(dept); setShowDeleteModal(true); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Department Modal */}
                <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Department" size="lg">
                    <form onSubmit={handleAddDepartment} className="space-y-4">
                        {formError && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                    placeholder="e.g., Computer Science & Engineering"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Department Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                    placeholder="e.g., CSE"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Short Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                placeholder="Brief description of the department"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Overview</label>
                            <textarea
                                value={formData.overview}
                                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                placeholder="Detailed overview of the department..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Mission</label>
                                <textarea
                                    value={formData.mission}
                                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                    placeholder="Department mission statement..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Vision</label>
                                <textarea
                                    value={formData.vision}
                                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                    placeholder="Department vision statement..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Banner Image URL</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                                ) : (
                                    <><Plus className="w-4 h-4" /> Create Department</>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Edit Department Modal */}
                <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedDept(null); }} title="Edit Department" size="lg">
                    <form onSubmit={handleEditDepartment} className="space-y-4">
                        {formError && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {formError}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Department Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Short Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Overview</label>
                            <textarea
                                value={formData.overview}
                                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Mission</label>
                                <textarea
                                    value={formData.mission}
                                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Vision</label>
                                <textarea
                                    value={formData.vision}
                                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Banner Image URL</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                            />
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => { setShowEditModal(false); setSelectedDept(null); }}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={showDeleteModal && selectedDept} onClose={() => { setShowDeleteModal(false); setSelectedDept(null); }} size="sm">
                    {selectedDept && (
                        <div className="text-center py-2">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Delete Department?</h3>
                            <p className="text-sm text-zinc-500 mb-6">
                                Are you sure you want to delete <strong className="text-zinc-700">{selectedDept.name}</strong>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setSelectedDept(null); }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteDepartment}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {saving ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default AdminDepartments;
