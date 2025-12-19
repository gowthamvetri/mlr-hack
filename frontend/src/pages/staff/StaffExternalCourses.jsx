import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import { getExternalCourses, createExternalCourse, updateExternalCourse, deleteExternalCourse } from '../../utils/api';
import { Plus, Search, Edit2, Trash2, ExternalLink as LinkIcon, Award, BookOpen, Globe, CheckCircle, Loader } from 'lucide-react';
import Modal from '../../components/Modal';

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

const StaffExternalCourses = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', provider: 'Other', url: '', category: 'Other' });

    const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
    const categories = ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

    useEffect(() => { fetchCourses(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
            gsap.fromTo('.course-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.2, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data } = await getExternalCourses();
            const myCourses = Array.isArray(data) ? data.filter(c => c.postedBy?._id === user?._id) : [];
            setCourses(myCourses);
        } catch (error) { console.error('Error fetching courses:', error); }
        finally { setLoading(false); }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createExternalCourse({ ...formData, department: user?.department?._id || user?.department });
            setShowAddModal(false);
            resetForm();
            fetchCourses();
        } catch (error) { alert(error.response?.data?.message || 'Failed to create course'); }
        finally { setSubmitting(false); }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await updateExternalCourse(selectedCourse._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchCourses();
        } catch (error) { alert(error.response?.data?.message || 'Failed to update course'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteCourse = async () => {
        try {
            setSubmitting(true);
            await deleteExternalCourse(selectedCourse._id);
            setShowDeleteModal(false);
            setSelectedCourse(null);
            fetchCourses();
        } catch (error) { alert(error.response?.data?.message || 'Failed to delete course'); }
        finally { setSubmitting(false); }
    };

    const openEditModal = (course) => { setSelectedCourse(course); setFormData({ title: course.title, description: course.description || '', provider: course.provider, url: course.url, category: course.category }); setShowEditModal(true); };
    const resetForm = () => { setFormData({ title: '', description: '', provider: 'Other', url: '', category: 'Other' }); setSelectedCourse(null); };

    const filteredCourses = Array.isArray(courses) ? courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase())) : [];

    const getProviderColor = (provider) => {
        const colors = { 'Coursera': 'bg-blue-50 text-blue-700 border-blue-100', 'NPTEL': 'bg-orange-50 text-orange-700 border-orange-100', 'Udemy': 'bg-violet-50 text-violet-700 border-violet-100', 'edX': 'bg-red-50 text-red-700 border-red-100', 'Google': 'bg-emerald-50 text-emerald-700 border-emerald-100', 'Microsoft': 'bg-cyan-50 text-cyan-700 border-cyan-100', 'AWS': 'bg-amber-50 text-amber-700 border-amber-100' };
        return colors[provider] || 'bg-zinc-50 text-zinc-700 border-zinc-100';
    };

    const CourseForm = ({ onSubmit, isEdit = false }) => (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Course Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" placeholder="e.g., Python for Beginners" />
            </div>
            <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none" placeholder="Brief description..." />
            </div>
            <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Course URL *</label>
                <input type="url" required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Provider</label>
                    <select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                        {providers.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors">{submitting ? 'Saving...' : (isEdit ? 'Update' : 'Add Course')}</button>
            </div>
        </form>
    );

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Recommend Courses</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Share free certification links with your students</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Course
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="metric-card bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div><p className="text-violet-200 text-xs">My Courses</p><p className="text-2xl font-semibold mt-1"><AnimatedNumber value={courses.length} /></p></div>
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
                        </div>
                    </div>
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div><p className="text-zinc-500 text-xs">Total Completions</p><p className="text-2xl font-semibold text-emerald-600 mt-1"><AnimatedNumber value={courses.reduce((a, c) => a + (c.completedBy?.length || 0), 0)} /></p></div>
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Award className="w-5 h-5 text-emerald-500" /></div>
                        </div>
                    </div>
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center justify-between">
                            <div><p className="text-zinc-500 text-xs">Providers Used</p><p className="text-2xl font-semibold text-zinc-900 mt-1"><AnimatedNumber value={[...new Set(courses.map(c => c.provider))].length} /></p></div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Globe className="w-5 h-5 text-blue-500" /></div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl border border-zinc-100 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" placeholder="Search your courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader className="w-6 h-6 text-violet-500 animate-spin" /></div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
                        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="w-6 h-6 text-zinc-400" /></div>
                        <p className="text-zinc-900 font-medium">No Courses Yet</p>
                        <p className="text-zinc-500 text-sm mt-1">Start by adding a free certification course for your students.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCourses.map((course) => (
                            <div key={course._id} className="course-card bg-white rounded-xl border border-zinc-100 overflow-hidden hover:border-zinc-200 hover:shadow-sm transition-all flex flex-col">
                                <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-600"></div>
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getProviderColor(course.provider)}`}>{course.provider}</span>
                                        <div className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /><span className="text-xs font-medium">{course.completedBy?.length || 0}</span></div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-zinc-900 mb-2 line-clamp-1">{course.title}</h3>
                                    <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{course.description || 'No description'}</p>
                                </div>
                                <div className="p-4 border-t border-zinc-100 flex items-center gap-2">
                                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors"><LinkIcon className="w-3.5 h-3.5" /> Open</a>
                                    <button onClick={() => openEditModal(course)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-zinc-500" /></button>
                                    <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add External Course" size="lg"><CourseForm onSubmit={handleAddCourse} /></Modal>
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Course" size="lg"><CourseForm onSubmit={handleUpdateCourse} isEdit={true} /></Modal>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Course" size="sm">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
                    <p className="text-zinc-600 text-sm mb-6">Delete "{selectedCourse?.title}"?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">Cancel</button>
                        <button onClick={handleDeleteCourse} disabled={submitting} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">{submitting ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default StaffExternalCourses;
