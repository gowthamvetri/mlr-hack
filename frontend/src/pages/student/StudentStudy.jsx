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
      case 'PDF': return 'bg-red-100 text-red-600';
      case 'Video': return 'bg-purple-100 text-purple-600';
      case 'Link': return 'bg-blue-100 text-blue-600';
      case 'Document': return 'bg-green-100 text-green-600';
      case 'Image': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getProviderColor = (provider) => {
    const colors = {
      'Coursera': 'bg-blue-100 text-blue-700',
      'NPTEL': 'bg-orange-100 text-orange-700',
      'Udemy': 'bg-purple-100 text-purple-700',
      'edX': 'bg-red-100 text-red-700',
      'Google': 'bg-green-100 text-green-700',
      'Microsoft': 'bg-cyan-100 text-cyan-700',
      'AWS': 'bg-yellow-100 text-yellow-700',
    };
    return colors[provider] || 'bg-gray-100 text-gray-700';
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
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Support</h1>
        <p className="text-gray-500 mt-1 text-lg">Access your subjects, materials, and certifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'subjects'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            My Subjects
            {subjects.length > 0 && (
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                {subjects.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('certifications'); setSelectedCategory('all'); setSearchQuery(''); }}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'certifications'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Free Certifications
            {completedCount > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
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
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 font-medium">My Subjects</p>
                  <p className="text-3xl font-bold mt-2"><AnimatedNumber value={subjects.length} /></p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">Materials</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2"><AnimatedNumber value={totalMaterials} /></p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">With Mind Maps</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2"><AnimatedNumber value={materialsWithMindMaps} /></p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">Department</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{user?.department || '-'}</p>
                </div>
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">Year</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{user?.year || '-'}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 font-medium">Available Courses</p>
                  <p className="text-3xl font-bold mt-2"><AnimatedNumber value={externalCourses.length} /></p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2"><AnimatedNumber value={completedCount} /></p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2"><AnimatedNumber value={externalCourses.length - completedCount} /></p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 font-medium">Providers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2"><AnimatedNumber value={[...new Set(externalCourses.map(c => c.provider))].length} /></p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 animate-slide-in-up hover-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder={activeTab === 'subjects' ? "Search subjects..." : "Search certifications..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-900 transition-all font-medium placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'subjects' ? (
              <>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all"
                >
                  <option value="all">All Years</option>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="px-4 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all"
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
                  className="px-4 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all"
                >
                  <option value="all">All Providers</option>
                  {providers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-10 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all appearance-none min-w-[180px]"
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
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading your subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-900">No subjects found</p>
              <p className="text-gray-500 mt-2">
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
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold">
                            {subject.code}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            Year {subject.year}, Sem {subject.semester}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                          {subject.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                          {subject.credits} credits
                        </span>
                      </div>
                    </div>

                    {/* Staff Info */}
                    {subject.assignedStaff?.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>
                          {subject.assignedStaff.map(s => s.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Materials */}
                    {subject.materials?.length > 0 ? (
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          onClick={() => setExpandedSubject(expandedSubject === subject._id ? null : subject._id)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {subject.materials.length} Material{subject.materials.length !== 1 ? 's' : ''} Available
                          </span>
                          <span className={`text-xs text-primary-600 font-medium transition-transform ${expandedSubject === subject._id ? 'rotate-180' : ''}`}>
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
                                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group/item"
                                >
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getMaterialColor(material.type)}`}>
                                    {getMaterialIcon(material.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-900 truncate group-hover/item:text-primary-600">
                                        {material.title}
                                      </p>
                                      {material.mindMap && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-black-600 border border-amber-100">
                                          <Brain className="w-2.5 h-2.5" /> Mind Map
                                        </span>
                                      )}
                                    </div>
                                    {material.description && (
                                      <p className="text-xs text-gray-500 truncate">{material.description}</p>
                                    )}
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover/item:text-primary-600" />
                                </a>
                                {/* Mind Map Display */}
                                {material.mindMap && (
                                  <div className="ml-3">
                                    <button
                                      onClick={() => setViewingMindMap(viewingMindMap === material._id ? null : material._id)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                                    >
                                      {viewingMindMap === material._id ? <ChevronUp className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                                      {viewingMindMap === material._id ? 'Hide Mind Map' : 'View Mind Map'}
                                    </button>
                                    {viewingMindMap === material._id && (
                                      <div className="mt-3 animate-fade-in" style={{ height: '400px' }}>
                                        <MindMapPreview markdown={material.mindMap} />
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
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-400 text-center">No materials uploaded yet</p>
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
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading certifications...</p>
            </div>
          ) : filteredExternalCourses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-900">No certifications available</p>
              <p className="text-gray-500 mt-2">Check back later for new courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredExternalCourses.map(course => (
                <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`h-2 ${isCompleted(course) ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-primary-500 to-primary-700'}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getProviderColor(course.provider)}`}>
                        {course.provider}
                      </span>
                      {isCompleted(course) && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">{course.category}</span>
                      {course.postedBy && (
                        <span className="text-xs text-gray-400">by {course.postedBy.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Course
                      </a>
                      {!isCompleted(course) && (
                        <button
                          onClick={() => handleMarkComplete(course._id)}
                          disabled={completingCourse === course._id}
                          className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
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
