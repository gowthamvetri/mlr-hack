import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import gsap from 'gsap';
import { getExternalCourses, createExternalCourse, updateExternalCourse, deleteExternalCourse } from '../../utils/api';
import { Plus, Search, Edit2, Trash2, ExternalLink as LinkIcon, Award, BookOpen, Globe, CheckCircle, Loader, RefreshCw, ArrowUpRight, Users, TrendingUp } from 'lucide-react';
import Modal from '../../components/Modal';

// Premium Animated Counter
const AnimatedNumber = ({ value, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);
    useEffect(() => {
        const duration = 600;
        const start = prevValue.current;
        const end = typeof value === 'number' ? value : parseInt(value) || 0;
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
    return <span className="tabular-nums tracking-tight">{displayValue}{suffix}</span>;
};

// Radial Progress
const RadialProgress = ({ value, size = 44, thickness = 4, color = '#8b5cf6' }) => {
    const radius = (size - thickness) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-zinc-100" />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color }}>{value}%</span>
            </div>
        </div>
    );
};

const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
const categories = ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

const CourseForm = ({ formData, setFormData, onSubmit, onCancel, submitting, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-5">
        <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Course Title *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" placeholder="e.g., Python for Beginners" />
        </div>
        <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none placeholder-zinc-400 font-medium" placeholder="Brief description..." />
        </div>
        <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Course URL *</label>
            <input type="url" required value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Provider</label>
                <select value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer font-medium">
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer font-medium">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:opacity-60 transition-colors shadow-md">{submitting ? 'Saving...' : (isEdit ? 'Update' : 'Add Course')}</button>
        </div>
    </form>
);

const StaffExternalCourses = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [courses, setCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', provider: 'Other', url: '', category: 'Other' });

    useEffect(() => { fetchCourses(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.hero-section', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
            gsap.fromTo('.metric-card', { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, delay: 0.15, ease: 'power2.out' });
            gsap.fromTo('.section-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.25, ease: 'power2.out' });
            gsap.fromTo('.course-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.35, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data } = await getExternalCourses();
            setAllCourses(data || []);
            const myCourses = data.filter(c => c.postedBy?._id === user?._id);
            setCourses(myCourses);
        } catch (error) { console.error('Error fetching courses:', error); }
        finally { setLoading(false); }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCourses();
        setTimeout(() => setRefreshing(false), 400);
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

    const filteredCourses = courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalCompletions = courses.reduce((a, c) => a + (c.completedBy?.length || 0), 0);
    const providersUsed = [...new Set(courses.map(c => c.provider))].length;
    const completionRate = courses.length > 0 ? Math.round((totalCompletions / (courses.length * 10)) * 100) : 0;

    const getProviderColor = (provider) => {
        const colors = {
            'Coursera': 'bg-blue-50 text-blue-600 border-blue-100',
            'NPTEL': 'bg-orange-50 text-orange-600 border-orange-100',
            'Udemy': 'bg-purple-50 text-purple-600 border-purple-100',
            'edX': 'bg-red-50 text-red-600 border-red-100',
            'Google': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'Microsoft': 'bg-cyan-50 text-cyan-600 border-cyan-100',
            'AWS': 'bg-amber-50 text-amber-600 border-amber-100'
        };
        return colors[provider] || 'bg-zinc-100 text-zinc-600 border-zinc-200';
    };

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6 text-zinc-900">
                {/* Hero Section */}
                <div className="hero-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 lg:p-8 border border-zinc-200 shadow-sm">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-blue-600 rounded-full text-[11px] font-bold border border-blue-100 shadow-sm">
                                    <BookOpen className="w-3 h-3" />
                                    External Courses
                                </span>
                            </div>
                            <h1 className="text-xl lg:text-2xl font-bold text-zinc-900 mb-1.5 tracking-tight">
                                Recommend Courses
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Share free certification links with your students • {allCourses.length} total courses in system
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button onClick={handleRefresh} disabled={refreshing}
                                className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-all disabled:opacity-50 shadow-sm">
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button onClick={() => { resetForm(); setShowAddModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all shadow-md">
                                <Plus className="w-4 h-4" />
                                Add Course
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <BookOpen className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                                <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">My Courses</p>
                        <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={courses.length} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Courses you've shared</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <Award className="w-4.5 h-4.5 text-emerald-600" strokeWidth={2} />
                            </div>
                            <RadialProgress value={Math.min(completionRate, 100)} color="#10b981" />
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Completions</p>
                        <p className="text-2xl font-bold text-emerald-600"><AnimatedNumber value={totalCompletions} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Students completed</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                <Globe className="w-4.5 h-4.5 text-violet-600" strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-violet-600">
                                <TrendingUp className="w-3 h-3" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Providers</p>
                        <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={providersUsed} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Different platforms</p>
                        </div>
                    </div>

                    <div className="metric-card bg-white rounded-xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-300 group shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <Users className="w-4.5 h-4.5 text-amber-600" strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                <CheckCircle className="w-3 h-3" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Avg/Course</p>
                        <p className="text-2xl font-bold text-zinc-900"><AnimatedNumber value={courses.length > 0 ? Math.round(totalCompletions / courses.length) : 0} /></p>
                        <div className="mt-4 pt-3 border-t border-zinc-100">
                            <p className="text-[10px] text-zinc-400 font-medium">Completions per course</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="section-card bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" placeholder="Search your courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder-zinc-400 font-medium" />
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="w-8 h-8 text-zinc-300 animate-spin" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                            <BookOpen className="w-7 h-7 text-zinc-300" />
                        </div>
                        <p className="text-zinc-900 font-bold">No Courses Yet</p>
                        <p className="text-zinc-500 text-sm mt-1 mb-4 font-medium">Start by adding a free certification course for your students.</p>
                        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-md">
                            <Plus className="w-4 h-4" />Add Course
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCourses.map((course) => (
                            <div key={course._id} className="course-card bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all duration-300 flex flex-col group shadow-sm">
                                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-500"></div>
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getProviderColor(course.provider)}`}>{course.provider}</span>
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{course.completedBy?.length || 0}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-sm text-zinc-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2 font-medium">{course.description || 'No description provided'}</p>
                                    <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold border border-zinc-200">{course.category}</span>
                                </div>
                                <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-bold transition-all shadow-sm">
                                        <LinkIcon className="w-3.5 h-3.5" /> Open Course
                                    </a>
                                    <button onClick={() => openEditModal(course)} className="p-2 hover:bg-white hover:text-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 hover:shadow-sm text-zinc-400">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 text-zinc-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {filteredCourses.length > 0 && (
                    <div className="text-center">
                        <p className="text-xs text-zinc-400 font-bold">
                            Showing <span className="text-zinc-600">{filteredCourses.length}</span> of <span className="text-zinc-600">{courses.length}</span> courses
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add External Course" size="lg">
                <CourseForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleAddCourse}
                    onCancel={() => { setShowAddModal(false); resetForm(); }}
                    submitting={submitting}
                />
            </Modal>
            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Course" size="lg">
                <CourseForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleUpdateCourse}
                    onCancel={() => { setShowEditModal(false); resetForm(); }}
                    submitting={submitting}
                    isEdit={true}
                />
            </Modal>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Course" size="sm">
                <div className="text-center py-4">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 className="w-6 h-6 text-red-500" /></div>
                    <p className="text-zinc-900 text-sm font-bold mb-1">Delete "{selectedCourse?.title}"?</p>
                    <p className="text-zinc-500 text-xs font-medium mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors">Cancel</button>
                        <button onClick={handleDeleteCourse} disabled={submitting} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors shadow-md">{submitting ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default StaffExternalCourses;
