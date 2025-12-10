import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { getCourses, enrollInCourse, getCourseMaterials } from '../../utils/api';
import { 
  BookOpen, Search, Users, Clock, Star, 
  Play, CheckCircle, Filter, BookMarked, Award,
  FileText, Download, File, X, Folder
} from 'lucide-react';

const StudentCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
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
      setMaterials(data);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Course Catalog</h1>
            <p className="text-gray-500">Browse and enroll in available courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Total Courses</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <BookOpen className="w-10 h-10 text-primary-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Enrolled</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.enrolled}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Available</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.available}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses, instructors..."
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
            <select
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Courses</option>
              <option value="enrolled">My Enrolled</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                          {course.code}
                        </span>
                        {isEnrolled(course._id) && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Enrolled
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 mb-1">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.instructor?.name || course.instructor || 'TBA'}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description || 'No description available for this course.'}
                  </p>

                  <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-lg font-bold text-gray-800">{course.enrolledStudents?.length || course.students || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-800">{course.credits}</p>
                      <p className="text-xs text-gray-500">Credits</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold text-gray-800">{course.rating || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isEnrolled(course._id) ? (
                      <button 
                        onClick={() => handleViewMaterials(course)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Continue Learning
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrolling === course._id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {enrolling === course._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <BookMarked className="w-4 h-4" />
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
        )}

        {filteredCourses.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Course Materials Modal */}
        {showMaterialsModal && selectedCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedCourse.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCourse.code} - Course Materials</p>
                </div>
                <button
                  onClick={() => {
                    setShowMaterialsModal(false);
                    setSelectedCourse(null);
                    setMaterials([]);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingMaterials ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading materials...</p>
                  </div>
                ) : materials.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Folder className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-gray-800">Available Materials ({materials.length})</h4>
                    </div>
                    {materials.map((material) => (
                      <div
                        key={material._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(material.type)}
                          <div>
                            <p className="font-medium text-gray-800">{material.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(material.size)} • Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`http://localhost:5000${material.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No materials available</p>
                    <p className="text-sm text-gray-500">The instructor hasn't uploaded any materials yet.</p>
                  </div>
                )}

                {/* Course Description */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">About This Course</h4>
                  <p className="text-gray-600 text-sm">
                    {selectedCourse.description || 'No description available for this course.'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-primary-600">{selectedCourse.credits}</p>
                      <p className="text-xs text-gray-500">Credits</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-primary-600">{selectedCourse.enrolledStudents?.length || 0}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-primary-600">{selectedCourse.instructor?.name || 'TBA'}</p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
