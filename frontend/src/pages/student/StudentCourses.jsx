import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getCourses, enrollInCourse, getCourseMaterials, submitStaffRating, canRateStaff } from '../../utils/api';
import {
  BookOpen, Search, Users, Clock, Star, Play, CheckCircle, BookMarked, Award,
  FileText, Download, File, Folder, BrainCircuit, Grid3X3, List
} from 'lucide-react';
import Modal from '../../components/Modal';
import MindMapPreview from '../../components/MindMapPreview';
import gsap from 'gsap';

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

const StudentCourses = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
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

  // Staff Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingStatus, setRatingStatus] = useState({ canRate: false, hasRated: false, existingRating: 0 });
  const [submittingRating, setSubmittingRating] = useState(false);

  // GSAP Animations
  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.course-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
    }
  }, [loading, courses]);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Filter courses by student's department
      const params = {};
      if (user?.department) {
        params.department = user.department;
      }
      const { data } = await getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
      const enrolled = (data || []).filter(c => c.enrolledStudents?.some(s => s._id === user?._id || s === user?._id));
      setEnrolledCourses(enrolled.map(c => c._id));
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
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
      console.error('Error enrolling:', error);
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
      setMaterials(data.materials || data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (type?.includes('word') || type?.includes('document')) return <FileText className="w-4 h-4 text-blue-500" />;
    if (type?.includes('sheet') || type?.includes('excel')) return <FileText className="w-4 h-4 text-green-500" />;
    return <File className="w-4 h-4 text-zinc-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleOpenRating = async (course) => {
    if (!course.instructorId) { alert('Instructor not available'); return; }
    setShowRatingModal(true);
    setUserRating(0);
    setRatingComment('');
    try {
      const { data } = await canRateStaff(course.instructorId, course._id);
      setRatingStatus(data);
      if (data.existingRating) setUserRating(data.existingRating);
    } catch (error) {
      setRatingStatus({ canRate: true, hasRated: false, existingRating: 0 });
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedCourse || !userRating) return;
    setSubmittingRating(true);
    try {
      await submitStaffRating({ staffId: selectedCourse.instructorId, courseId: selectedCourse._id, rating: userRating, comment: ratingComment });
      alert('Rating submitted!');
      setShowRatingModal(false);
      fetchCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmittingRating(false);
    }
  };

  const StarRating = ({ rating, onRate, onHover, onLeave, size = 'lg', readonly = false }) => {
    const stars = [1, 2, 3, 4, 5];
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex gap-1" onMouseLeave={onLeave}>
        {stars.map((star) => (
          <button key={star} type="button" disabled={readonly} onClick={() => !readonly && onRate?.(star)} onMouseEnter={() => !readonly && onHover?.(star)}
            className={`${readonly ? '' : 'cursor-pointer hover:scale-110'} transition-transform`}>
            <Star className={`${sizeClass} ${star <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'} transition-colors`} />
          </button>
        ))}
      </div>
    );
  };

  const departments = ['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase());
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
    <DashboardLayout>
      <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Course Catalog</h1>
            <p className="text-sm text-zinc-500 mt-1">Browse and enroll in available courses</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-100 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <Grid3X3 className="w-4 h-4 text-zinc-600" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
                <List className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-violet-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Total Courses</p>
            <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stats.total} /></p>
          </div>

          <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookMarked className="w-4.5 h-4.5 text-blue-500" />
              </div>
              {stats.enrolled > 0 && (
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Active</span>
              )}
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Enrolled</p>
            <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stats.enrolled} /></p>
          </div>

          <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Play className="w-4.5 h-4.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Available</p>
            <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stats.available} /></p>
          </div>

          <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Award className="w-4.5 h-4.5 text-amber-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Completed</p>
            <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stats.completed} /></p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
            </div>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100">
              <option value="all">All Departments</option>
              {departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100">
              <option value="all">All Courses</option>
              <option value="enrolled">My Enrolled</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* Courses */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-500">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-zinc-200">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700">No courses found</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div key={course._id} className="course-card bg-white rounded-xl border border-zinc-100 overflow-hidden hover:border-zinc-200 hover:shadow-md transition-all">
                <div className="h-1.5 bg-gradient-to-r from-violet-500 to-violet-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{course.code}</span>
                        {isEnrolled(course._id) && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />Enrolled
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-zinc-900 text-sm mb-1">{course.name}</h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.instructor?.name || course.instructor || 'TBA'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                    {course.description || 'No description available.'}
                  </p>

                  <div className="flex items-center justify-between py-3 px-3 bg-zinc-50 rounded-lg mb-4 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-zinc-900">{course.enrolledStudents?.length || 0}</p>
                      <p className="text-zinc-400">Students</p>
                    </div>
                    <div className="text-center border-l border-zinc-200 pl-4">
                      <p className="font-semibold text-zinc-900">{course.credits}</p>
                      <p className="text-zinc-400">Credits</p>
                    </div>
                    <div className="text-center border-l border-zinc-200 pl-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-zinc-900">{course.rating || '4.5'}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </div>
                      <p className="text-zinc-400">Rating</p>
                    </div>
                  </div>

                  {isEnrolled(course._id) ? (
                    <button onClick={() => handleViewMaterials(course)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                      <Play className="w-4 h-4" />Continue
                    </button>
                  ) : (
                    <button onClick={() => handleEnroll(course._id)} disabled={enrolling === course._id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50">
                      {enrolling === course._id ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enrolling...</>
                      ) : (
                        <><BookMarked className="w-4 h-4" />Enroll</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="divide-y divide-zinc-50">
              {filteredCourses.map((course) => (
                <div key={course._id} className="course-card p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-zinc-900 text-sm">{course.name}</h3>
                        <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{course.code}</span>
                        {isEnrolled(course._id) && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Enrolled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.instructor?.name || 'TBA'}</span>
                        <span>{course.credits} credits</span>
                        <span className="flex items-center gap-1">{course.rating || '4.5'}<Star className="w-3 h-3 text-amber-400 fill-amber-400" /></span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isEnrolled(course._id) ? (
                        <button onClick={() => handleViewMaterials(course)}
                          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800">
                          Continue
                        </button>
                      ) : (
                        <button onClick={() => handleEnroll(course._id)} disabled={enrolling === course._id}
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50">
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Materials Modal */}
        <Modal isOpen={showMaterialsModal && selectedCourse} onClose={() => { setShowMaterialsModal(false); setSelectedCourse(null); setMaterials([]); }}
          title={selectedCourse ? `${selectedCourse.name}` : 'Materials'} size="xl">
          {selectedCourse && (
            <div className="space-y-6">
              {loadingMaterials ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Loading materials...</p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                    <Folder className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-zinc-900">Files ({materials.length})</span>
                  </div>
                  {materials.map((material) => (
                    <div key={material._id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-zinc-100">
                          {getFileIcon(material.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{material.name}</p>
                          <p className="text-xs text-zinc-500">{formatFileSize(material.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {material.mindMap && (
                          <button onClick={() => { setSelectedMaterial(material); setShowMindMapModal(true); }}
                            className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                            <BrainCircuit className="w-4 h-4" />
                          </button>
                        )}
                        <a href={`http://localhost:5000${material.url}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50 rounded-lg">
                  <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-700">No materials yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Check back later</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 flex gap-3">
                {selectedCourse?.instructorId && (
                  <button onClick={() => handleOpenRating(selectedCourse)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors">
                    <Star className="w-4 h-4" />Rate Instructor
                  </button>
                )}
                <button onClick={() => setShowMaterialsModal(false)}
                  className="flex-1 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Rating Modal */}
        <Modal isOpen={showRatingModal && selectedCourse} onClose={() => { setShowRatingModal(false); setUserRating(0); setRatingComment(''); }} title="Rate Instructor" size="md">
          {selectedCourse && (
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-zinc-100">
                <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="font-semibold text-zinc-900">{selectedCourse.instructor?.name || selectedCourse.instructor}</h3>
                <p className="text-xs text-zinc-500 mt-1">{selectedCourse.name}</p>
              </div>

              <div className="flex flex-col items-center py-4">
                <p className="text-sm text-zinc-600 mb-3">{ratingStatus.hasRated ? 'Update rating' : 'Rate this instructor'}</p>
                <StarRating rating={userRating} onRate={setUserRating} onHover={setHoverRating} onLeave={() => setHoverRating(0)} />
                <p className="text-xl font-semibold text-zinc-900 mt-3">{hoverRating || userRating || 0} / 5</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Comment (optional)</label>
                <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Share your experience..."
                  rows={3} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowRatingModal(false)} className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50">
                  Cancel
                </button>
                <button onClick={handleSubmitRating} disabled={!userRating || submittingRating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {submittingRating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Mind Map Modal */}
        {showMindMapModal && selectedCourse && selectedMaterial && (
          <MindMapPreview courseId={selectedCourse._id} materialId={selectedMaterial._id}
            onClose={() => { setShowMindMapModal(false); setSelectedMaterial(null); }}
            readOnly initialMarkdown={selectedMaterial.mindMap} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCourses;
