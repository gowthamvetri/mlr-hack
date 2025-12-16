import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import { getExternalCourses, markExternalCourseComplete } from '../../utils/api';
import {
  BookOpen, Video, FileText, Link as LinkIcon, Search, Filter, Star, Clock, ExternalLink,
  Award, Globe, CheckCircle, Sparkles
} from 'lucide-react';

const StudentStudy = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('resources');

  // External courses state
  const [externalCourses, setExternalCourses] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [filterProvider, setFilterProvider] = useState('all');
  const [completingCourse, setCompletingCourse] = useState(null);

  // Mock study resources
  const resources = [
    { id: 1, title: 'Data Structures & Algorithms', description: 'Complete guide to DSA concepts with practice problems', category: 'Computer Science', type: 'course', duration: '40 hours', rating: 4.8, link: '#' },
    { id: 2, title: 'Database Management Systems', description: 'Learn SQL, normalization, and database design', category: 'Computer Science', type: 'video', duration: '25 hours', rating: 4.6, link: '#' },
    { id: 3, title: 'Operating Systems Notes', description: 'Comprehensive notes covering all OS concepts', category: 'Computer Science', type: 'notes', duration: 'PDF', rating: 4.5, link: '#' },
    { id: 4, title: 'Computer Networks', description: 'TCP/IP, OSI Model, and networking fundamentals', category: 'Computer Science', type: 'course', duration: '30 hours', rating: 4.7, link: '#' },
    { id: 5, title: 'Software Engineering', description: 'SDLC, Agile, and software development practices', category: 'Computer Science', type: 'video', duration: '20 hours', rating: 4.4, link: '#' },
    { id: 6, title: 'Machine Learning Basics', description: 'Introduction to ML algorithms and applications', category: 'AI/ML', type: 'course', duration: '35 hours', rating: 4.9, link: '#' }
  ];

  const categories = ['all', 'Computer Science', 'AI/ML', 'Mathematics', 'Electronics'];
  const providers = ['Coursera', 'NPTEL', 'Udemy', 'edX', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];
  const extCategories = ['all', 'AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'Soft Skills', 'Programming', 'Database', 'Other'];

  useEffect(() => {
    if (activeTab === 'certifications') {
      fetchExternalCourses();
    }
  }, [activeTab, filterProvider, selectedCategory]);

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
      // Update local state
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'notes': return <FileText className="w-5 h-5" />;
      default: return <LinkIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      case 'notes': return 'bg-green-100 text-green-600';
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

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredExternalCourses = externalCourses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = externalCourses.filter(c => isCompleted(c)).length;

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Support</h1>
        <p className="text-gray-500 mt-1 text-lg">Access learning resources and free certifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('resources'); setSelectedCategory('all'); }}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === 'resources'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Study Materials
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('certifications'); setSelectedCategory('all'); }}
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
        {activeTab === 'resources' ? (
          <>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900"><AnimatedNumber value={12} /></p>
                  <p className="text-sm font-medium text-gray-500">Active Courses</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900"><AnimatedNumber value={48} /></p>
                  <p className="text-sm font-medium text-gray-500">Video Tutorials</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900"><AnimatedNumber value={156} /></p>
                  <p className="text-sm font-medium text-gray-500">Study Notes</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 tilt-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">24h</p>
                  <p className="text-sm font-medium text-gray-500">Learning Time</p>
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
              placeholder={activeTab === 'resources' ? "Search resources..." : "Search certifications..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-900 transition-all font-medium placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'certifications' && (
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="px-4 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all"
              >
                <option value="all">All Providers</option>
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-10 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all appearance-none min-w-[180px]"
              >
                {(activeTab === 'resources' ? categories : extCategories).map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'resources' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col hover-card">
                <div className="p-7 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getTypeColor(resource.type)} shadow-sm group-hover:scale-110 transition-transform`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                        {resource.category}
                      </span>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                        <span className="text-xs font-bold text-gray-800">{resource.rating}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">{resource.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed flex-1">{resource.description}</p>
                  <div className="pt-6 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {resource.duration}
                      </span>
                    </div>
                    <a href={resource.link} className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 group/btn">
                      <span>Start Learning</span>
                      <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredResources.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center mt-8 animate-fade-in">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-900">No resources found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
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

