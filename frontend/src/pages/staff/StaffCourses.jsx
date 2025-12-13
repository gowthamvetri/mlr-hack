import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyTaughtCourses, uploadTeacherMaterial } from '../../utils/api';
import { BookOpen, Search, Upload, FileText, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import Modal from '../../components/Modal';
import MindMapPreview from '../../components/MindMapPreview';

const StaffCourses = () => {
    const user = useSelector(selectCurrentUser);
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

    // Mind Map State
    const [showMindMapModal, setShowMindMapModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

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
        if (!uploadFile) {
            setFormError('Please select a file');
            return;
        }

        try {
            setUploadLoading(true);
            setFormError('');

            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('name', uploadName || uploadFile.name);

            await uploadTeacherMaterial(selectedCourse._id, formData);

            setFormSuccess('Material uploaded successfully!');
            setTimeout(() => {
                setShowUploadModal(false);
                setUploadFile(null);
                setUploadName('');
                setFormSuccess('');
                fetchCourses();
            }, 1500);
        } catch (error) {
            setFormError(error.response?.data?.message || 'Error uploading material');
        } finally {
            setUploadLoading(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
                    <p className="text-gray-500">Manage your assigned courses and materials</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.map(course => (
                    <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                                <p className="text-sm text-primary-600 font-medium">{course.code}</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                {course.department}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {course.materialsCount || 0} Materials
                            </span>
                            <span>{course.students} Students</span>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-auto">
                            <button
                                onClick={() => { setSelectedCourse(course); setShowUploadModal(true); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Material
                            </button>
                        </div>

                        {/* Materials List Preview */}
                        {course.materialsCount > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Recent Materials</p>
                                {course.materials?.slice(0, 3).map(material => (
                                    <div key={material._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{material.name}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setSelectedMaterial(material);
                                                setShowMindMapModal(true);
                                            }}
                                            className="p-1 hover:bg-purple-100 text-purple-600 rounded"
                                            title="Generate Mind Map"
                                        >
                                            <BrainCircuit className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {course.materialsCount > 3 && (
                                    <p className="text-xs text-center text-gray-500">+{course.materialsCount - 3} more</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredCourses.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No courses found</p>
                    <p className="text-sm">You haven't been assigned any courses yet</p>
                </div>
            )}

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Course Material"
                size="md"
            >
                <form onSubmit={handleUpload} className="space-y-4">
                    {formError && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {formError}
                        </div>
                    )}
                    {formSuccess && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {formSuccess}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            placeholder="e.g., Unit 1 Lecture Notes"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            onChange={(e) => setUploadFile(e.target.files[0])}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PDF, DOC, PPT up to 10MB</p>
                                {uploadFile && (
                                    <p className="text-sm font-medium text-gray-800 mt-2">
                                        Selected: {uploadFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploadLoading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {uploadLoading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Mind Map Modal */}
            {showMindMapModal && selectedCourse && selectedMaterial && (
                <MindMapPreview
                    courseId={selectedCourse._id}
                    materialId={selectedMaterial._id}
                    onClose={() => {
                        setShowMindMapModal(false);
                        setSelectedMaterial(null);
                    }}
                    onSave={() => {
                        setShowMindMapModal(false);
                    }}
                    initialMarkdown={selectedMaterial.mindMap}
                />
            )}
        </DashboardLayout>
    );
};

export default StaffCourses;
