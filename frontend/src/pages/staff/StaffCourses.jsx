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
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Courses</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage your assigned courses and materials</p>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
                        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-6 h-6 text-zinc-400" />
                        </div>
                        <p className="text-zinc-900 font-medium">No Courses Found</p>
                        <p className="text-zinc-500 text-sm mt-1">You haven't been assigned any courses yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredCourses.map(course => (
                            <div key={course._id} className="course-card bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300 flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">{course.name}</h3>
                                            <p className="text-xs font-medium text-violet-600 mt-0.5">{course.code}</p>
                                        </div>
                                        <span className="flex-shrink-0 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium uppercase tracking-wide">{course.department}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{course.description || 'No description available.'}</p>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{course.materialsCount || 0} Materials</span>
                                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{course.students || 0} Students</span>
                                    </div>
                                </div>

                                {/* Materials Preview */}
                                {course.materialsCount > 0 && (
                                    <div className="px-5 pb-4">
                                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mb-2">Recent Materials</p>
                                        <div className="space-y-1.5">
                                            {course.materials?.slice(0, 2).map(material => (
                                                <div key={material._id} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                                                        <span className="text-xs text-zinc-700 truncate">{material.name}</span>
                                                    </div>
                                                    <button onClick={() => { setSelectedCourse(course); setSelectedMaterial(material); setShowMindMapModal(true); }} className="p-1.5 hover:bg-violet-100 text-violet-600 rounded-md transition-colors" title="Generate Mind Map">
                                                        <BrainCircuit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {course.materialsCount > 2 && <p className="text-[10px] text-center text-zinc-400 pt-1">+{course.materialsCount - 2} more</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Action */}
                                <div className="p-4 border-t border-zinc-100 mt-auto">
                                    <button onClick={() => { setSelectedCourse(course); setShowUploadModal(true); setFormError(''); setFormSuccess(''); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
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
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2 border border-red-100">
                            <AlertTriangle className="w-4 h-4" />{formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center gap-2 border border-emerald-100">
                            <CheckCircle className="w-4 h-4" />{formSuccess}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Material Name</label>
                        <input type="text" value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="e.g., Unit 1 Lecture Notes" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1.5">File</label>
                        <div className="flex justify-center px-6 py-8 border-2 border-dashed border-zinc-200 rounded-lg hover:border-violet-300 transition-colors bg-zinc-50/50">
                            <div className="text-center">
                                <FileText className="mx-auto h-10 w-10 text-zinc-300" />
                                <div className="mt-3 text-xs text-zinc-500">
                                    <label className="cursor-pointer font-medium text-violet-600 hover:text-violet-700">
                                        <span>Upload a file</span>
                                        <input type="file" className="sr-only" onChange={(e) => setUploadFile(e.target.files[0])} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                    </label>
                                    <span className="ml-1">or drag and drop</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1">PDF, DOC, PPT up to 10MB</p>
                                {uploadFile && <p className="text-xs font-medium text-zinc-800 mt-3 bg-zinc-100 inline-block px-2 py-1 rounded">Selected: {uploadFile.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                        <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={uploadLoading} className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors">
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
