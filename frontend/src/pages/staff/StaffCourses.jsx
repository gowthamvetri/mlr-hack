import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyTaughtCourses, uploadTeacherMaterial } from '../../utils/api';
import { BookOpen, Search, Upload, FileText, AlertTriangle, CheckCircle, BrainCircuit, Users, Loader, X } from 'lucide-react';
import Modal from '../../components/Modal';
import MindMapPreview from '../../components/MindMapPreview';
import gsap from 'gsap';

const StaffCourses = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadName, setUploadName] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [showMindMapModal, setShowMindMapModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.course-card', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data } = await getMyTaughtCourses();
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) { setFormError('Please select a file'); return; }
        try {
            setUploadLoading(true); setFormError('');
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('name', uploadName || uploadFile.name);
            await uploadTeacherMaterial(selectedCourse._id, formData);
            setFormSuccess('Material uploaded successfully!');
            setTimeout(() => { setShowUploadModal(false); setUploadFile(null); setUploadName(''); setFormSuccess(''); fetchCourses(); }, 1500);
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error uploading material');
        } finally {
            setUploadLoading(false);
        }
    };

    const filteredCourses = Array.isArray(courses) ? courses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase())) : [];

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">My Courses</h1>
                        <p className="text-dark-400 text-sm mt-0.5">Manage your assigned courses and materials</p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="glass-card-dark rounded-xl border border-dark-700 p-12 text-center">
                        <div className="w-14 h-14 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-700">
                            <BookOpen className="w-6 h-6 text-dark-400" />
                        </div>
                        <p className="text-white font-medium">No Courses Found</p>
                        <p className="text-dark-400 text-sm mt-1">You haven't been assigned any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCourses.map(course => (
                            <div key={course._id} className="course-card glass-card-dark rounded-xl border border-dark-700 hover:border-dark-600 hover:shadow-lg transition-all duration-300 flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-white line-clamp-1">{course.name}</h3>
                                            <p className="text-xs font-bold text-primary-400 mt-0.5">{course.code}</p>
                                        </div>
                                        <span className="flex-shrink-0 px-2 py-0.5 bg-dark-800 text-dark-300 border border-dark-700 rounded text-[10px] font-bold uppercase tracking-wide">{course.department}</span>
                                    </div>
                                    <p className="text-xs text-dark-400 line-clamp-2 mb-4">{course.description || 'No description available.'}</p>
                                    <div className="flex items-center gap-4 text-xs text-dark-400">
                                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{course.materialsCount || 0} Materials</span>
                                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{course.students || 0} Students</span>
                                    </div>
                                </div>

                                {/* Materials Preview */}
                                {course.materialsCount > 0 && (
                                    <div className="px-5 pb-4">
                                        <p className="text-[10px] font-medium text-dark-500 uppercase tracking-wide mb-2">Recent Materials</p>
                                        <div className="space-y-1.5">
                                            {course.materials?.slice(0, 2).map(material => (
                                                <div key={material._id} className="flex items-center justify-between p-2 bg-dark-800/50 border border-dark-700 rounded-lg">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-300 truncate">{material.name}</span>
                                                    </div>
                                                    <button onClick={() => { setSelectedCourse(course); setSelectedMaterial(material); setShowMindMapModal(true); }} className="p-1.5 hover:bg-primary-500/10 text-primary-400 rounded-md transition-colors" title="Generate Mind Map">
                                                        <BrainCircuit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {course.materialsCount > 2 && <p className="text-[10px] text-center text-dark-500 pt-1">+{course.materialsCount - 2} more</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Action */}
                                <div className="p-4 border-t border-dark-700 mt-auto">
                                    <button onClick={() => { setSelectedCourse(course); setShowUploadModal(true); setFormError(''); setFormSuccess(''); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20">
                                        <Upload className="w-4 h-4" /> Upload Material
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Course Material" size="md">
                <form onSubmit={handleUpload} className="space-y-5">
                    {formError && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-xs flex items-center gap-2 border border-red-500/20">
                            <AlertTriangle className="w-4 h-4" />{formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs flex items-center gap-2 border border-emerald-500/20">
                            <CheckCircle className="w-4 h-4" />{formSuccess}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-dark-400 mb-1.5">Material Name</label>
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            placeholder="e.g., Unit 1 Lecture Notes"
                            className="w-full px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 placeholder-dark-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-dark-400 mb-1.5">File</label>
                        <div className="flex justify-center px-6 py-8 border-2 border-dashed border-dark-700 rounded-lg hover:border-primary-500/50 transition-colors bg-dark-900/30">
                            <div className="text-center">
                                <FileText className="mx-auto h-10 w-10 text-dark-500" />
                                <div className="mt-3 text-xs text-dark-400">
                                    <label className="cursor-pointer font-medium text-primary-400 hover:text-primary-300">
                                        <span>Upload a file</span>
                                        <input type="file" className="sr-only" onChange={(e) => setUploadFile(e.target.files[0])} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                    </label>
                                    <span className="ml-1">or drag and drop</span>
                                </div>
                                <p className="text-[10px] text-dark-500 mt-1">PDF, DOC, PPT up to 10MB</p>
                                {uploadFile && <p className="text-xs font-medium text-white mt-3 bg-dark-700 inline-block px-2 py-1 rounded border border-dark-600">Selected: {uploadFile.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-dark-700">
                        <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={uploadLoading} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 disabled:opacity-60 transition-colors shadow-lg shadow-primary-500/20">
                            {uploadLoading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Mind Map Modal */}
            {showMindMapModal && selectedCourse && selectedMaterial && (
                <MindMapPreview courseId={selectedCourse._id} materialId={selectedMaterial._id} onClose={() => { setShowMindMapModal(false); setSelectedMaterial(null); }} onSave={() => setShowMindMapModal(false)} initialMarkdown={selectedMaterial.mindMap} />
            )}
        </DashboardLayout>
    );
};

export default StaffCourses;
