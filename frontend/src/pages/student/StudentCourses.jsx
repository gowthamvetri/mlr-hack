import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getCourses, enrollInCourse, getCourseMaterials } from '../../utils/api';
import {
  BookOpen, Search, Users, Clock, Star,
  Play, CheckCircle, Filter, BookMarked, Award,
  FileText, Download, File, X, Folder, BrainCircuit
} from 'lucide-react';
import Modal from '../../components/Modal';
import MindMapPreview from '../../components/MindMapPreview';

const StudentCourses = () => {
  /* REMOVED: const { user } = useAuth(); */
  const user = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [enrolling, setEnrolling] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [courses, setCourses] = useState([]);

  // Mind Map State
  const [showMindMapModal, setShowMindMapModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await getCourses();
      setCourses(data);
      // Filter enrolled courses for current user
      const enrolled = data.filter(c =>
        c.enrolledStudents?.some(s => s._id === user?._id || s === user?._id)
      );
      setEnrolledCourses(enrolled.map(c => c._id));
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Use mock data as fallback
      setCourses([
        { _id: '1', name: 'Data Structures & Algorithms', code: 'CS301', department: 'CSE', credits: 4, students: 156, instructor: 'Dr. Rajesh Kumar', status: 'Active', rating: 4.8, description: 'Learn fundamental data structures and algorithms.' },
        { _id: '2', name: 'Machine Learning', code: 'CS401', department: 'CSE', credits: 4, students: 128, instructor: 'Prof. Priya Sharma', status: 'Active', rating: 4.7, description: 'Introduction to machine learning concepts and applications.' },
        { _id: '3', name: 'Digital Electronics', code: 'EC201', department: 'ECE', credits: 3, students: 98, instructor: 'Dr. Amit Singh', status: 'Active', rating: 4.5, description: 'Fundamentals of digital circuits and systems.' },
        { _id: '4', name: 'Database Management', code: 'CS302', department: 'CSE', credits: 3, students: 142, instructor: 'Prof. Meera Patel', status: 'Active', rating: 4.6, description: 'Learn SQL and database design principles.' },
        { _id: '5', name: 'Computer Networks', code: 'CS303', department: 'CSE', credits: 3, students: 134, instructor: 'Dr. Vikram Reddy', status: 'Active', rating: 4.4, description: 'Understanding network protocols and architecture.' },
        { _id: '6', name: 'Web Development', code: 'CS304', department: 'CSE', credits: 3, students: 112, instructor: 'Prof. Ananya Roy', status: 'Active', rating: 4.6, description: 'Full-stack web development with modern frameworks.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(courseId);
      await enrollInCourse(courseId);
      setEnrolledCourses([...enrolledCourses, courseId]);
      fetchCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      // For demo, just add to enrolled
      setEnrolledCourses([...enrolledCourses, courseId]);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => enrolledCourses.includes(courseId);

  const handleViewMaterials = async (course) => {
    setSelectedCourse(course);
    setShowMaterialsModal(true);
    setLoadingMaterials(true);
    try {
      const { data } = await getCourseMaterials(course._id);
      // Handle both response formats: { materials: [...] } or direct array
      setMaterials(data.materials || data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type?.includes('word') || type?.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (type?.includes('sheet') || type?.includes('excel')) return <FileText className="w-5 h-5 text-green-500" />;
    if (type?.includes('presentation') || type?.includes('powerpoint')) return <FileText className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const departments = ['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || c.department === filterDept || c.department?.code === filterDept;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'enrolled' && isEnrolled(c._id)) ||
      (filterStatus === 'available' && !isEnrolled(c._id));
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = {
    total: courses.length,
    enrolled: enrolledCourses.length,
    available: courses.filter(c => c.status === 'Active' && !isEnrolled(c._id)).length,
    completed: 0
  };

  return (
    <DashboardLayout title="My Courses">
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Course Catalog</h1>
            <p className="text-gray-500 mt-1 text-lg">Browse and enroll in available courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-200 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 font-medium">Total Courses</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Enrolled</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.enrolled}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <BookMarked className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-in-up hover-card">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search courses by name, code, or instructor..."
                  className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 text-gray-900 transition-all font-medium placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-6 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all appearance-none"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.slice(1).map(d => (
                <option key={d} value={d}>{d} Department</option>
              ))}
            </select>
            <select
              className="px-6 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Courses</option>
              <option value="enrolled">My Enrolled</option>
              <option value="available">Available for Enrollment</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {
          loading ? (
            <div className="text-center py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
              <p className="text-gray-500 font-medium text-lg">Loading your courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 animate-fade-in">
              <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-200" />
              <p className="text-xl font-bold text-gray-900">No courses found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredCourses.map((course) => (
                <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                  <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 tracking-wide">
                            {course.code}
                          </span>
                          {isEnrolled(course._id) && (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Enrolled
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">{course.name}</h3>
                        <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {course.instructor?.name || course.instructor || 'Instructor TBA'}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-1">
                      {course.description || 'No description available for this course.'}
                    </p>

                    <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-gray-50 mb-6 bg-gray-50/50 rounded-xl px-2">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{course.enrolledStudents?.length || course.students || 0}</p>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Students</p>
                      </div>
                      <div className="text-center border-l border-gray-100">
                        <p className="text-lg font-bold text-gray-900">{course.credits}</p>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Credits</p>
                      </div>
                      <div className="text-center border-l border-gray-100">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold text-gray-900">{course.rating || '4.5'}</span>
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</p>
                      </div>
                    </div>

                    <div>
                      {isEnrolled(course._id) ? (
                        <button
                          onClick={() => handleViewMaterials(course)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Continue Learning
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          disabled={enrolling === course._id}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {enrolling === course._id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              In Progress...
                            </>
                          ) : (
                            <>
                              <BookMarked className="w-5 h-5" />
                              Enroll Now
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Course Materials Modal */}
        <Modal
          isOpen={showMaterialsModal && selectedCourse}
          onClose={() => {
            setShowMaterialsModal(false);
            setSelectedCourse(null);
            setMaterials([]);
          }}
          title={selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : 'Course Materials'}
          size="xl"
        >
          {selectedCourse && (
            <div className="space-y-6">
              {loadingMaterials ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500 font-medium">Fetching course materials...</p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Folder className="w-6 h-6 text-primary-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">Available Files <span className="text-gray-400 font-medium text-base ml-1">({materials.length})</span></h4>
                  </div>
                  <div className="grid gap-3">
                    {materials.map((material) => (
                      <div
                        key={material._id}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary-50 transition-colors">
                            {getFileIcon(material.type)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{material.name}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{formatFileSize(material.size)}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Uploaded {new Date(material.uploadedAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`http://localhost:5000${material.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-900 text-gray-700 hover:text-white rounded-xl text-sm font-bold transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                        {material.mindMap && (
                          <button
                            onClick={() => {
                              setSelectedMaterial(material);
                              setShowMindMapModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all"
                          >
                            <BrainCircuit className="w-4 h-4" />
                            Mind Map
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-900 text-lg">No materials available yet</p>
                  <p className="text-gray-500 mt-1 max-w-xs mx-auto">The instructor hasn't uploaded any study materials for this course yet. Check back later!</p>
                </div>
              )}

              {/* Course Description */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  About This Course
                </h4>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-gray-600 leading-relaxed">
                    {selectedCourse.description || 'No description available for this course.'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{selectedCourse.credits}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Credits</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{selectedCourse.enrolledStudents?.length || 0}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Students</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <p className="text-lg font-bold text-gray-900 truncate px-2" title={selectedCourse.instructor?.name || 'TBA'}>
                        {selectedCourse.instructor?.name || 'TBA'}
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Instructor</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowMaterialsModal(false)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>

      {/* Mind Map Modal */}
      {showMindMapModal && selectedCourse && selectedMaterial && (
        <MindMapPreview
          courseId={selectedCourse._id}
          materialId={selectedMaterial._id}
          onClose={() => {
            setShowMindMapModal(false);
            setSelectedMaterial(null);
          }}
          readOnly={true}
          initialMarkdown={selectedMaterial.mindMap}
        />
      )}
    </DashboardLayout>
  );
};

export default StudentCourses;
