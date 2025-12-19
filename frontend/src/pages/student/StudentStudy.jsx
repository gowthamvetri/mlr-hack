import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import { MindMapPreview } from '../../components/MindMapViewer';
import { getExternalCourses, markExternalCourseComplete, getSubjectsForStudent } from '../../utils/api';
import {
  BookOpen, Video, FileText, Link as LinkIcon, Search, Filter, Star, Clock, ExternalLink,
  Award, Globe, CheckCircle, Sparkles, GraduationCap, Users, Calendar, File, Image, Brain, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

const StudentStudy = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('subjects');

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
      // Use student-specific endpoint that returns only approved materials from student's department
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
      case 'PDF': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'Video': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'Link': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'Document': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Image': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default: return 'bg-dark-700 text-dark-300 border border-dark-600';
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'Coursera': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'NPTEL': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      'Udemy': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      'edX': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'Google': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      'Microsoft': 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      'AWS': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    };
    return colors[provider] || 'bg-dark-700 text-dark-300 border border-dark-600';
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
      <div className="mb-8 animate-fade-in text-white">
        <h1 className="text-3xl font-bold tracking-tight">Study Support</h1>
        <p className="text-dark-400 mt-1 text-lg">Access your subjects, materials, and certifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-dark-800 border border-dark-700 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'subjects'
            ? 'bg-dark-700 text-white shadow-lg shadow-black/20'
            : 'text-dark-400 hover:text-white'
            }`}
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            My Subjects
            {subjects.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs font-bold rounded-full border border-primary-500/20">
                {subjects.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('certifications'); setSelectedCategory('all'); setSearchQuery(''); }}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'certifications'
            ? 'bg-dark-700 text-white shadow-lg shadow-black/20'
            : 'text-dark-400 hover:text-white'
            }`}
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Free Certifications
            {completedCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/20">
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
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg border border-primary-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-primary-100 font-medium">My Subjects</p>
                  <p className="text-3xl font-bold mt-2"><AnimatedNumber value={subjects.length} /></p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">Materials</p>
                  <p className="text-3xl font-bold text-white mt-2"><AnimatedNumber value={totalMaterials} /></p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">With Mind Maps</p>
                  <p className="text-3xl font-bold text-white mt-2"><AnimatedNumber value={materialsWithMindMaps} /></p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <Brain className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">Department</p>
                  <p className="text-2xl font-bold text-white mt-2 truncate">{user?.department || '-'}</p>
                </div>
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20">
                  <Users className="w-6 h-6 text-primary-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">Year</p>
                  <p className="text-3xl font-bold text-white mt-2">{user?.year || '-'}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Calendar className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg border border-primary-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-primary-100 font-medium">Available Courses</p>
                  <p className="text-3xl font-bold mt-2"><AnimatedNumber value={externalCourses.length} /></p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-white mt-2"><AnimatedNumber value={completedCount} /></p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-white mt-2"><AnimatedNumber value={externalCourses.length - completedCount} /></p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-dark-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 font-medium">Providers</p>
                  <p className="text-3xl font-bold text-white mt-2"><AnimatedNumber value={[...new Set(externalCourses.map(c => c.provider))].length} /></p>
                </div>
                <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center border border-accent-500/20">
                  <Award className="w-6 h-6 text-accent-500" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 p-5 mb-8 animate-slide-in-up">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder={activeTab === 'subjects' ? "Search subjects..." : "Search certifications..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-dark-700 bg-dark-900 rounded-xl focus:bg-dark-900 focus:outline-none focus:border-primary-500 text-white transition-all font-medium placeholder-dark-500"
            />
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'subjects' ? (
              <>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-3.5 bg-dark-900 border border-dark-700 hover:border-dark-600 rounded-xl focus:outline-none focus:border-primary-500 text-dark-200 font-semibold cursor-pointer transition-all"
                >
                  <option value="all">All Years</option>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="px-4 py-3.5 bg-dark-900 border border-dark-700 hover:border-dark-600 rounded-xl focus:outline-none focus:border-primary-500 text-dark-200 font-semibold cursor-pointer transition-all"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </>
            ) : (
              <>
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="px-4 py-3.5 bg-dark-900 border border-dark-700 hover:border-dark-600 rounded-xl focus:outline-none focus:border-primary-500 text-dark-200 font-semibold cursor-pointer transition-all"
                >
                  <option value="all">All Providers</option>
                  {providers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-10 py-3.5 bg-dark-900 border border-dark-700 hover:border-dark-600 rounded-xl focus:outline-none focus:border-primary-500 text-dark-200 font-semibold cursor-pointer transition-all appearance-none min-w-[180px]"
                  >
                    {extCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'subjects' ? (
        <>
          {loadingSubjects ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400 font-medium">Loading your subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-dark-400" />
              </div>
              <p className="text-xl font-bold text-white">No subjects found</p>
              <p className="text-dark-400 mt-2">
                {user?.department
                  ? `No subjects available for ${user.department} department yet.`
                  : 'Please update your profile with your department.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {filteredSubjects.map(subject => (
                <div
                  key={subject._id}
                  className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 overflow-hidden hover:shadow-xl hover:border-dark-600 transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-xs font-bold border border-primary-500/20">
                            {subject.code}
                          </span>
                          <span className="px-2 py-0.5 bg-dark-700 text-dark-300 rounded text-xs font-medium border border-dark-600">
                            Year {subject.year}, Sem {subject.semester}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-white group-hover:text-primary-400 transition-colors">
                          {subject.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                          {subject.credits} credits
                        </span>
                      </div>
                    </div>

                    {/* Staff Info */}
                    {subject.assignedStaff?.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-dark-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {subject.assignedStaff.map(s => s.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Materials */}
                    {subject.materials?.length > 0 ? (
                      <div className="border-t border-dark-700 pt-4">
                        <button
                          onClick={() => setExpandedSubject(expandedSubject === subject._id ? null : subject._id)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <span className="text-sm font-medium text-dark-200">
                            {subject.materials.length} Material{subject.materials.length !== 1 ? 's' : ''} Available
                          </span>
                          <span className={`text-xs text-primary-400 font-medium transition-transform ${expandedSubject === subject._id ? 'rotate-180' : ''}`}>
                            {expandedSubject === subject._id ? '▲ Hide' : '▼ Show'}
                          </span>
                        </button>

                        {expandedSubject === subject._id && (
                          <div className="mt-3 space-y-2 animate-fade-in">
                            {subject.materials.map((material, idx) => (
                              <div key={idx} className="space-y-2">
                                <a
                                  href={material.url?.startsWith('/') ? `${import.meta.env.VITE_API?.replace('/api/', '')}${material.url}` : material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 bg-dark-900/50 border border-dark-700 hover:border-dark-600 rounded-xl hover:bg-dark-900 transition-all group/item"
                                >
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getMaterialColor(material.type)}`}>
                                    {getMaterialIcon(material.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-white truncate group-hover/item:text-primary-400 transition-colors">
                                        {material.title}
                                      </p>
                                      {material.mindMap && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                          <Brain className="w-2.5 h-2.5" /> Mind Map
                                        </span>
                                      )}
                                    </div>
                                    {material.description && (
                                      <p className="text-xs text-dark-400 truncate">{material.description}</p>
                                    )}
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-dark-500 group-hover/item:text-primary-400" />
                                </a>
                                {/* Mind Map Display */}
                                {material.mindMap && (
                                  <div className="ml-3">
                                    <button
                                      onClick={() => setViewingMindMap(viewingMindMap === material._id ? null : material._id)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
                                    >
                                      {viewingMindMap === material._id ? <ChevronUp className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                                      {viewingMindMap === material._id ? 'Hide Mind Map' : 'View Mind Map'}
                                    </button>
                                    {viewingMindMap === material._id && (
                                      <div className="mt-3 animate-fade-in border border-dark-700 rounded-xl overflow-hidden bg-dark-900/50 relative" style={{ height: '400px' }}>
                                        <div className="absolute inset-0 z-0">
                                          <MindMapPreview markdown={material.mindMap} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-t border-dark-700 pt-4">
                        <p className="text-sm text-dark-500 text-center">No materials uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {loadingExternal ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400 font-medium">Loading certifications...</p>
            </div>
          ) : filteredExternalCourses.length === 0 ? (
            <div className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-dark-400" />
              </div>
              <p className="text-xl font-bold text-white">No certifications available</p>
              <p className="text-dark-400 mt-2">Check back later for new courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredExternalCourses.map(course => (
                <div key={course._id} className="bg-dark-800 rounded-2xl shadow-sm border border-dark-700 overflow-hidden hover:shadow-xl hover:border-dark-600 hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`h-2 ${isCompleted(course) ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-primary-500 to-primary-700'}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getProviderColor(course.provider)}`}>
                        {course.provider}
                      </span>
                      {isCompleted(course) && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2 group-hover:text-primary-400 transition-colors">{course.title}</h3>
                    <p className="text-sm text-dark-400 mb-4 line-clamp-2">{course.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-2 py-1 bg-dark-700 text-dark-300 rounded-lg font-medium border border-dark-600">{course.category}</span>
                      {course.postedBy && (
                        <span className="text-xs text-dark-500">by {course.postedBy.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-dark-700 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Course
                      </a>
                      {!isCompleted(course) && (
                        <button
                          onClick={() => handleMarkComplete(course._id)}
                          disabled={completingCourse === course._id}
                          className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-sm font-bold transition-all disabled:opacity-50 border border-emerald-500/20"
                        >
                          {completingCourse === course._id ? '...' : 'Done'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentStudy;
