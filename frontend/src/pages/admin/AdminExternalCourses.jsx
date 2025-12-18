import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getExternalCourses, createExternalCourse, updateExternalCourse, deleteExternalCourse, getDepartments } from '../../utils/api';
import gsap from 'gsap';
import { Plus, Search, Edit2, Trash2, ExternalLink as LinkIcon, Award, Filter, BookOpen, Globe, CheckCircle, X } from 'lucide-react';
import Modal from '../../components/Modal';

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

const AdminExternalCourses = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterProvider, setFilterProvider] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', provider: 'Other', url: '', category: 'Other', department: '' });

    const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
    const categories = ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

    useEffect(() => { fetchData(); }, [filterCategory, filterProvider]);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, deptsRes] = await Promise.all([
                getExternalCourses({ category: filterCategory, provider: filterProvider }),
                getDepartments()
            ]);
            setCourses(coursesRes.data);
            setDepartments(deptsRes.data);
        } catch (error) { console.error('Error:', error); }
        finally { setLoading(false); }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createExternalCourse(formData);
            setShowAddModal(false);
            resetForm();
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await updateExternalCourse(selectedCourse._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteCourse = async () => {
        try {
            setSubmitting(true);
            await deleteExternalCourse(selectedCourse._id);
            setShowDeleteModal(false);
            setSelectedCourse(null);
            fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const openEditModal = (course) => {
        setSelectedCourse(course);
        setFormData({ title: course.title, description: course.description || '', provider: course.provider, url: course.url, category: course.category, department: course.department?._id || '' });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', provider: 'Other', url: '', category: 'Other', department: '' });
        setSelectedCourse(null);
    };

    const filteredCourses = courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.provider?.toLowerCase().includes(searchQuery.toLowerCase()));

    const getProviderColor = (provider) => {
        const colors = {
            'Coursera': 'bg-blue-50 text-blue-600', 'NPTEL': 'bg-orange-50 text-orange-600', 'Udemy': 'bg-violet-50 text-violet-600',
            'edX': 'bg-red-50 text-red-600', 'Google': 'bg-emerald-50 text-emerald-600', 'Microsoft': 'bg-cyan-50 text-cyan-600', 'AWS': 'bg-amber-50 text-amber-600',
        };
        return colors[provider] || 'bg-zinc-100 text-zinc-600';
    };

    const hasActiveFilters = searchQuery || filterCategory !== 'all' || filterProvider !== 'all';
    const clearFilters = () => { setSearchQuery(''); setFilterCategory('all'); setFilterProvider('all'); };

    const CourseForm = ({ onSubmit, isEdit = false }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" placeholder="ML Fundamentals" />
            </div>
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none" placeholder="Brief description..." />
            </div>
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL *</label>
                <input type="url" required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Provider</label>
                    <select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white">
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">{submitting ? 'Saving...' : (isEdit ? 'Update' : 'Add')}</button>
            </div>
        </form>
    );

    return (
        <DashboardLayout title="External Courses">
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Free Certifications</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage external course links for students</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowAddModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all">
                        <Plus className="w-4 h-4" />Add Course
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'violet' },
                        { label: 'Providers', value: [...new Set(courses.map(c => c.provider))].length, icon: Globe, color: 'blue' },
                        { label: 'Categories', value: [...new Set(courses.map(c => c.category))].length, icon: Filter, color: 'amber' },
                        { label: 'Completions', value: courses.reduce((a, c) => a + (c.completedBy?.length || 0), 0), icon: Award, color: 'emerald' },
                    ].map((stat, i) => {
                        const colorMap = { violet: 'bg-violet-50 text-violet-500', blue: 'bg-blue-50 text-blue-500', amber: 'bg-amber-50 text-amber-500', emerald: 'bg-emerald-50 text-emerald-500' };
                        return (
                            <div key={i} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center`}>
                                        <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stat.value} /></p>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-100 p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input type="text" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 text-zinc-700" />
                        </div>
                        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                            <option value="all">All Providers</option>
                            {providers.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="p-2.5 text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">Loading...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-zinc-100">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                        <p className="font-medium text-zinc-600">No courses found</p>
                        <p className="text-xs text-zinc-400 mt-1">Add your first course to get started</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-100">
                                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Course</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Provider</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Category</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Completions</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {filteredCourses.map(course => (
                                    <tr key={course._id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                                                    <BookOpen className="w-4 h-4 text-violet-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900 text-sm">{course.title}</p>
                                                    <p className="text-xs text-zinc-500 truncate max-w-[180px]">{course.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${getProviderColor(course.provider)}`}>{course.provider}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-600">{course.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="font-medium text-zinc-700">{course.completedBy?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <a href={course.url} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <LinkIcon className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => openEditModal(course)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Results */}
                {filteredCourses.length > 0 && (
                    <div className="text-center">
                        <p className="text-xs text-zinc-500">Showing <span className="font-medium text-zinc-700">{filteredCourses.length}</span> courses</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Course" size="lg">
                <CourseForm onSubmit={handleAddCourse} />
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Course" size="lg">
                <CourseForm onSubmit={handleUpdateCourse} isEdit />
            </Modal>

            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Course" size="sm">
                <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-zinc-600 mb-4">Delete "{selectedCourse?.title}"?</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                        <button onClick={handleDeleteCourse} disabled={submitting} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{submitting ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminExternalCourses;
