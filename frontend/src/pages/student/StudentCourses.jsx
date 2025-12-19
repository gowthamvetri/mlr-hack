import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getSubjectsForStudent, getSubjectMaterials, submitStaffRating, canRateStaff } from '../../utils/api';
import {
  BookOpen, Search, Users, Star, BookMarked, Award,
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
  const [viewMode, setViewMode] = useState('grid');
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);

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
  }, [loading, subjects]);

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Fetches subjects filtered by student's department and year
      const { data } = await getSubjectsForStudent();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterials = async (subject) => {
    setSelectedCourse(subject);
    setShowMaterialsModal(true);
    // Materials are already included in subject from getSubjectsForStudent
    setMaterials(subject.materials || []);
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
      fetchSubjects();
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


  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: subjects.length,
    withMaterials: subjects.filter(s => s.materials?.length > 0).length,
    totalMaterials: subjects.reduce((sum, s) => sum + (s.materials?.length || 0), 0),
    semesters: [...new Set(subjects.map(s => s.semester))].length
  };

  return (
    <DashboardLayout>
      <div ref={pageRef} className="min-h-screen bg-dark-900 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Subjects</h1>
            <p className="text-sm text-dark-400 mt-1">Subjects for your department with study materials</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-dark-700 shadow-sm text-white' : 'text-dark-400 hover:text-white'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-dark-700 shadow-sm text-white' : 'text-dark-400 hover:text-white'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-violet-500/30 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                <BookOpen className="w-4.5 h-4.5 text-violet-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Subjects</p>
            <p className="text-2xl font-bold text-white"><AnimatedNumber value={stats.total} /></p>
          </div>

          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-blue-500/30 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <BookMarked className="w-4.5 h-4.5 text-blue-400" />
              </div>
              {stats.withMaterials > 0 && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Active</span>
              )}
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">With Materials</p>
            <p className="text-2xl font-bold text-white"><AnimatedNumber value={stats.withMaterials} /></p>
          </div>

          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-emerald-500/30 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <FileText className="w-4.5 h-4.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Total Materials</p>
            <p className="text-2xl font-bold text-white"><AnimatedNumber value={stats.totalMaterials} /></p>
          </div>

          <div className="metric-card glass-card-dark rounded-xl p-5 border border-dark-700 hover:border-amber-500/30 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                <Award className="w-4.5 h-4.5 text-amber-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wide mb-1">Semesters</p>
            <p className="text-2xl font-bold text-white"><AnimatedNumber value={stats.semesters} /></p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card-dark rounded-xl border border-dark-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Subjects */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-dark-400">Loading subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-16 glass-card-dark rounded-xl border border-dashed border-dark-700">
            <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">No subjects found</p>
            <p className="text-xs text-dark-400 mt-1">Try adjusting your search</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <div key={subject._id} className="course-card glass-card-dark rounded-xl border border-dark-700 overflow-hidden hover:border-dark-600 hover:shadow-lg transition-all">
                <div className="h-1.5 bg-gradient-to-r from-primary-600 to-primary-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">{subject.code}</span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Sem {subject.semester}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm mb-1">{subject.name}</h3>
                      <p className="text-xs text-dark-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {subject.assignedStaff?.name || 'TBA'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 px-3 bg-dark-800/50 rounded-lg mb-4 text-xs border border-dark-700">
                    <div className="text-center">
                      <p className="font-bold text-white">{subject.materials?.length || 0}</p>
                      <p className="text-dark-500">Materials</p>
                    </div>
                    <div className="text-center border-l border-dark-700 pl-4">
                      <p className="font-bold text-white">{subject.credits || '-'}</p>
                      <p className="text-dark-500">Credits</p>
                    </div>
                    <div className="text-center border-l border-dark-700 pl-4">
                      <p className="font-bold text-white">Year {subject.year || '-'}</p>
                      <p className="text-dark-500">Year</p>
                    </div>
                  </div>

                  <button onClick={() => handleViewMaterials(subject)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-dark-800 text-white rounded-lg text-sm font-medium hover:bg-dark-700 transition-colors border border-dark-700">
                    <FileText className="w-4 h-4" />View Materials
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card-dark rounded-xl border border-dark-700 overflow-hidden">
            <div className="divide-y divide-dark-700">
              {filteredSubjects.map((subject) => (
                <div key={subject._id} className="course-card p-4 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                      <BookOpen className="w-6 h-6 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white text-sm">{subject.name}</h3>
                        <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">{subject.code}</span>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Sem {subject.semester}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{subject.assignedStaff?.name || 'TBA'}</span>
                        <span>{subject.materials?.length || 0} materials</span>
                        <span>{subject.credits || '-'} credits</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={() => handleViewMaterials(subject)}
                        className="px-4 py-2 bg-dark-800 text-white rounded-lg text-xs font-medium hover:bg-dark-700 border border-dark-700">
                        View Materials
                      </button>
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
                  <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-dark-400">Loading materials...</p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-dark-700">
                    <Folder className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium text-white">Files ({materials.length})</span>
                  </div>
                  {materials.map((material) => (
                    <div key={material._id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors border border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center border border-dark-600">
                          {getFileIcon(material.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{material.name}</p>
                          <p className="text-xs text-dark-500">{formatFileSize(material.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {material.mindMap && (
                          <button onClick={() => { setSelectedMaterial(material); setShowMindMapModal(true); }}
                            className="p-2 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                            <BrainCircuit className="w-4 h-4" />
                          </button>
                        )}
                        <a href={`http://localhost:5000${material.url}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-dark-400 hover:bg-dark-700 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-dark-800/50 rounded-lg border border-dark-700">
                  <FileText className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white">No materials yet</p>
                  <p className="text-xs text-dark-400 mt-1">Check back later</p>
                </div>
              )}

              <div className="pt-4 border-t border-dark-700 flex gap-3">
                {selectedCourse?.instructorId && (
                  <button onClick={() => handleOpenRating(selectedCourse)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors border border-violet-500/20">
                    <Star className="w-4 h-4" />Rate Instructor
                  </button>
                )}
                <button onClick={() => setShowMaterialsModal(false)}
                  className="flex-1 py-2.5 bg-dark-800 text-white rounded-lg text-sm font-medium hover:bg-dark-700 transition-colors border border-dark-700">
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
              <div className="text-center pb-4 border-b border-dark-700">
                <div className="w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-violet-500/20">
                  <Users className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="font-bold text-white">{selectedCourse.instructor?.name || selectedCourse.instructor}</h3>
                <p className="text-xs text-dark-400 mt-1">{selectedCourse.name}</p>
              </div>

              <div className="flex flex-col items-center py-4">
                <p className="text-sm text-dark-300 mb-3">{ratingStatus.hasRated ? 'Update rating' : 'Rate this instructor'}</p>
                <StarRating rating={userRating} onRate={setUserRating} onHover={setHoverRating} onLeave={() => setHoverRating(0)} />
                <p className="text-xl font-bold text-white mt-3">{hoverRating || userRating || 0} / 5</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-400 mb-1.5">Comment (optional)</label>
                <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Share your experience..."
                  rows={3} className="w-full px-4 py-2.5 bg-dark-900/50 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none placeholder-dark-500" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowRatingModal(false)} className="flex-1 py-2.5 bg-dark-800 border border-dark-700 text-dark-300 rounded-lg text-sm font-medium hover:bg-dark-700 hover:text-white">
                  Cancel
                </button>
                <button onClick={handleSubmitRating} disabled={!userRating || submittingRating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 disabled:opacity-50 shadow-lg shadow-primary-500/20">
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
