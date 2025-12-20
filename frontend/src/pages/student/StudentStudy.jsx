import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import MindMapPreview from '../../components/MindMapPreview';
import { getExternalCourses, markExternalCourseComplete, getSubjectsForStudent } from '../../utils/api';
import {
  BookOpen, Video, FileText, Link as LinkIcon, Search, Filter, Star, Clock, ExternalLink,
  Award, Globe, CheckCircle, Sparkles, GraduationCap, Users, Calendar, File, Image, Brain, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

const StudentStudy = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('certifications');

  // My Subjects state
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [expandedSubject, setExpandedSubject] = useState(null);

  // External courses state
  const [externalCourses, setExternalCourses] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [filterProvider, setFilterProvider] = useState('all');
  const [completingCourse, setCompletingCourse] = useState(null);

  const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
  const extCategories = ['all', 'AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchSubjects();
    } else if (activeTab === 'certifications') {
      fetchExternalCourses();
    }
  }, [activeTab, filterYear, filterSemester, filterProvider, selectedCategory]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const { data } = await getSubjectsForStudent();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Debounced search for subjects
  useEffect(() => {
    if (activeTab === 'subjects') {
      const timer = setTimeout(() => {
        fetchSubjects();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchExternalCourses = async () => {
    try {
      setLoadingExternal(true);
      const params = {};
      if (filterProvider !== 'all') params.provider = filterProvider;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      const { data } = await getExternalCourses(params);
      setExternalCourses(data);
    } catch (error) {
      console.error('Error fetching external courses:', error);
    } finally {
      setLoadingExternal(false);
    }
  };

  const handleMarkComplete = async (courseId) => {
    try {
      setCompletingCourse(courseId);
      await markExternalCourseComplete(courseId);
      setExternalCourses(prev => prev.map(c =>
        c._id === courseId
          ? { ...c, completedBy: [...(c.completedBy || []), { student: user._id }] }
          : c
      ));
    } catch (error) {
      console.error('Error marking course complete:', error);
      alert(error.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setCompletingCourse(null);
    }
  };

  const isCompleted = (course) => {
    return course.completedBy?.some(c => c.student === user?._id || c.student?._id === user?._id);
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'Video': return <Video className="w-4 h-4" />;
      case 'Link': return <LinkIcon className="w-4 h-4" />;
      case 'Document': return <File className="w-4 h-4" />;
      case 'Image': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getMaterialColor = (type) => {
    switch (type) {
      case 'PDF': return 'bg-red-50 text-red-600 border border-red-100';
      case 'Video': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'Link': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Document': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Image': return 'bg-amber-50 text-amber-600 border border-amber-100';
      default: return 'bg-zinc-100 text-zinc-600 border border-zinc-200';
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'Coursera': 'bg-blue-50 text-blue-600 border border-blue-100',
      'NPTEL': 'bg-orange-50 text-orange-600 border border-orange-100',
      'Udemy': 'bg-purple-50 text-purple-600 border border-purple-100',
      'edX': 'bg-red-50 text-red-600 border border-red-100',
      'Google': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'Microsoft': 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      'AWS': 'bg-amber-50 text-amber-600 border border-amber-100',
    };
    return colors[provider] || 'bg-zinc-100 text-zinc-600 border border-zinc-200';
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExternalCourses = externalCourses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = externalCourses.filter(c => isCompleted(c)).length;
  const totalMaterials = subjects.reduce((sum, s) => sum + (s.materials?.length || 0), 0);
  const materialsWithMindMaps = subjects.reduce((sum, s) => sum + (s.materials?.filter(m => m.mindMap).length || 0), 0);
  const [viewingMindMap, setViewingMindMap] = useState(null);

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Study Support</h1>
          <p className="text-zinc-500 mt-1">Access your subjects, materials, and certifications</p>
        </div>

        {/* Single Tab - Free Certifications Only */}
        <div className="flex gap-2 mb-6 bg-white border border-zinc-200 p-1.5 rounded-xl w-fit shadow-sm">
          <button className="px-6 py-2.5 rounded-lg font-bold transition-all bg-zinc-900 text-white shadow-md">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Free Certifications
              {completedCount > 0 && (
                <span className="px-2 py-0.5 bg-zinc-700 text-zinc-100 text-xs font-bold rounded-full border border-zinc-600">
                  {completedCount} done
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-slide-in-up">
          {activeTab === 'subjects' ? (
            <>
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-zinc-300 font-medium uppercase tracking-wide text-xs">My Subjects</p>
                    <p className="text-3xl font-bold mt-2"><AnimatedNumber value={subjects.length} /></p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-blue-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">Materials</p>
                    <p className="text-3xl font-bold text-zinc-900 mt-2"><AnimatedNumber value={totalMaterials} /></p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-amber-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">With Mind Maps</p>
                    <p className="text-3xl font-bold text-zinc-900 mt-2"><AnimatedNumber value={materialsWithMindMaps} /></p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Brain className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-violet-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">Year & Dept</p>
                    <div className="mt-2">
                      <p className="text-xl font-bold text-zinc-900 truncate">{user?.department || '-'}</p>
                      <p className="text-sm text-violet-600 font-bold">Year {user?.year || '-'}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Calendar className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-zinc-300 font-medium uppercase tracking-wide text-xs">Available Courses</p>
                    <p className="text-3xl font-bold mt-2"><AnimatedNumber value={externalCourses.length} /></p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-emerald-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">Completed</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2"><AnimatedNumber value={completedCount} /></p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-blue-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">In Progress</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2"><AnimatedNumber value={externalCourses.length - completedCount} /></p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-purple-300 transition-all shadow-sm hover:shadow-md group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 font-medium uppercase tracking-wide text-xs">Providers</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2"><AnimatedNumber value={[...new Set(externalCourses.map(c => c.provider))].length} /></p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 mb-8 animate-slide-in-up">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
              <input type="text" placeholder={activeTab === 'subjects' ? "Search subjects..." : "Search certifications..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-zinc-900 transition-all font-medium placeholder-zinc-400" />
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'subjects' ? (
                <>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-4 py-3.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700 font-bold cursor-pointer transition-all">
                    <option value="all">All Years</option>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                  <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="px-4 py-3.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700 font-bold cursor-pointer transition-all">
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="px-4 py-3.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700 font-bold cursor-pointer transition-all">
                    <option value="all">All Providers</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-3.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700 font-bold cursor-pointer transition-all">
                    {extCategories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'certifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in-up">
            {loadingExternal ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-zinc-100 rounded-2xl animate-pulse border border-zinc-200"></div>
              ))
            ) : filteredExternalCourses.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
                <Globe className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-900 text-xl font-bold">No Certifications Found</p>
                <p className="text-zinc-500 mt-2">Try searching for something else or change filters</p>
              </div>
            ) : (
              filteredExternalCourses.map((course) => {
                const completed = isCompleted(course);
                return (
                  <div key={course._id} className={`group bg-white rounded-2xl border p-5 transition-all hover:shadow-lg relative overflow-hidden flex flex-col h-full ${completed ? 'border-emerald-200 hover:border-emerald-300' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getProviderColor(course.provider)}`}>
                        {course.provider}
                      </span>
                      {completed ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5" />Completed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold border border-zinc-200">
                          <Clock className="w-3.5 h-3.5" />{course.duration}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 mb-6 flex-grow">{course.description}</p>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 border-t border-zinc-100 pt-3">
                        <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                          <Users className="w-3.5 h-3.5" />{course.completedBy?.length || 0} students
                        </span>
                        <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />4.8
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <a href={course.link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all shadow-md">
                          <ExternalLink className="w-4 h-4" />Enroll Now
                        </a>
                        {!completed && (
                          <button onClick={() => handleMarkComplete(course._id)} disabled={completingCourse === course._id} className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                            {completingCourse === course._id ? <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {viewingMindMap && (
        <MindMapPreview mindMap={viewingMindMap} onClose={() => setViewingMindMap(null)} />
      )}
    </DashboardLayout>
  );
};

export default StudentStudy;
