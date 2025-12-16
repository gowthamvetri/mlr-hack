import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import {
    getExternalCourses,
    createExternalCourse,
    updateExternalCourse,
    deleteExternalCourse,
    getDepartments
} from '../../utils/api';
import {
    Plus, Search, Edit2, Trash2, ExternalLink as LinkIcon,
    Award, Filter, BookOpen, Globe, Users, CheckCircle, X
} from 'lucide-react';
import Modal from '../../components/Modal';

const AdminExternalCourses = () => {
    const user = useSelector(selectCurrentUser);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterProvider, setFilterProvider] = useState('all');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        provider: 'Other',
        url: '',
        category: 'Other',
        department: ''
    });

    const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
    const categories = ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

    useEffect(() => {
        fetchData();
    }, [filterCategory, filterProvider]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, deptsRes] = await Promise.all([
                getExternalCourses({ category: filterCategory, provider: filterProvider }),
                getDepartments()
            ]);
            setCourses(coursesRes.data);
            setDepartments(deptsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createExternalCourse(formData);
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error creating course:', error);
            alert(error.response?.data?.message || 'Failed to create course');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await updateExternalCourse(selectedCourse._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error updating course:', error);
            alert(error.response?.data?.message || 'Failed to update course');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async () => {
        try {
            setSubmitting(true);
            await deleteExternalCourse(selectedCourse._id);
            setShowDeleteModal(false);
            setSelectedCourse(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting course:', error);
            alert(error.response?.data?.message || 'Failed to delete course');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (course) => {
        setSelectedCourse(course);
        setFormData({
            title: course.title,
            description: course.description || '',
            provider: course.provider,
            url: course.url,
            category: course.category,
            department: course.department?._id || ''
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            provider: 'Other',
            url: '',
            category: 'Other',
            department: ''
        });
        setSelectedCourse(null);
    };

    const filteredCourses = courses.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.provider?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getProviderColor = (provider) => {
        const colors = {
            'Coursera': 'bg-blue-100 text-blue-700',
            'NPTEL': 'bg-orange-100 text-orange-700',
            'Udemy': 'bg-purple-100 text-purple-700',
            'edX': 'bg-red-100 text-red-700',
            'Google': 'bg-green-100 text-green-700',
            'Microsoft': 'bg-cyan-100 text-cyan-700',
            'AWS': 'bg-yellow-100 text-yellow-700',
        };
        return colors[provider] || 'bg-gray-100 text-gray-700';
    };

    const CourseForm = ({ onSubmit, isEdit = false }) => (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Title *</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Machine Learning Fundamentals"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Brief description of the course..."
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course URL *</label>
                <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://coursera.org/learn/..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                    <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department (Optional)</label>
                <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                    {submitting ? 'Saving...' : (isEdit ? 'Update Course' : 'Add Course')}
                </button>
            </div>
        </form>
    );

    return (
        <DashboardLayout title="External Courses">
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Free Certifications</h1>
                        <p className="text-gray-500 mt-1">Manage external course links for students</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-200"
                    >
                        <Plus className="w-5 h-5" />
                        Add Course
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 font-medium">Total Courses</p>
                                <p className="text-3xl font-bold mt-2">{courses.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium">Providers</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{[...new Set(courses.map(c => c.provider))].length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Globe className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium">Categories</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{[...new Set(courses.map(c => c.category))].length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Filter className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 font-medium">Completions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{courses.reduce((a, c) => a + (c.completedBy?.length || 0), 0)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <Award className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-primary-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-primary-500"
                        >
                            <option value="all">All Providers</option>
                            {providers.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-primary-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Courses Table */}
                {loading ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading courses...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-200" />
                        <p className="text-xl font-bold text-gray-900">No courses found</p>
                        <p className="text-gray-500 mt,2">Add your first external course to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Course</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Provider</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Category</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-700">Completions</th>
                                        <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredCourses.map((course) => (
                                        <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                                        <BookOpen className="w-5 h-5 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{course.title}</p>
                                                        <p className="text-sm text-gray-500 truncate max-w-[200px]">{course.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getProviderColor(course.provider)}`}>
                                                    {course.provider}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-gray-600">{course.category}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="font-medium">{course.completedBy?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={course.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                        title="Open Course"
                                                    >
                                                        <LinkIcon className="w-4 h-4" />
                                                    </a>
                                                    <button
                                                        onClick={() => openEditModal(course)}
                                                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }}
                                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add External Course" size="lg">
                <CourseForm onSubmit={handleAddCourse} />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit External Course" size="lg">
                <CourseForm onSubmit={handleUpdateCourse} isEdit={true} />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Course" size="sm">
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete <span className="font-bold">"{selectedCourse?.title}"</span>?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteCourse}
                            disabled={submitting}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50"
                        >
                            {submitting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminExternalCourses;
