import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { BookOpen, Video, FileText, Link as LinkIcon, Search, Filter, Star, Clock, ExternalLink } from 'lucide-react';

const StudentStudy = () => {
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock study resources - in production, these would come from an API
  const resources = [
    {
      id: 1,
      title: 'Data Structures & Algorithms',
      description: 'Complete guide to DSA concepts with practice problems',
      category: 'Computer Science',
      type: 'course',
      duration: '40 hours',
      rating: 4.8,
      link: '#'
    },
    {
      id: 2,
      title: 'Database Management Systems',
      description: 'Learn SQL, normalization, and database design',
      category: 'Computer Science',
      type: 'video',
      duration: '25 hours',
      rating: 4.6,
      link: '#'
    },
    {
      id: 3,
      title: 'Operating Systems Notes',
      description: 'Comprehensive notes covering all OS concepts',
      category: 'Computer Science',
      type: 'notes',
      duration: 'PDF',
      rating: 4.5,
      link: '#'
    },
    {
      id: 4,
      title: 'Computer Networks',
      description: 'TCP/IP, OSI Model, and networking fundamentals',
      category: 'Computer Science',
      type: 'course',
      duration: '30 hours',
      rating: 4.7,
      link: '#'
    },
    {
      id: 5,
      title: 'Software Engineering',
      description: 'SDLC, Agile, and software development practices',
      category: 'Computer Science',
      type: 'video',
      duration: '20 hours',
      rating: 4.4,
      link: '#'
    },
    {
      id: 6,
      title: 'Machine Learning Basics',
      description: 'Introduction to ML algorithms and applications',
      category: 'AI/ML',
      type: 'course',
      duration: '35 hours',
      rating: 4.9,
      link: '#'
    }
  ];

  const categories = ['all', 'Computer Science', 'AI/ML', 'Mathematics', 'Electronics'];

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

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Support</h1>
        <p className="text-gray-500 mt-1 text-lg">Access learning resources and study materials</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 animate-slide-in-up">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">12</p>
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">48</p>
              <p className="text-sm font-medium text-gray-500">Video Tutorials</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">156</p>
              <p className="text-sm font-medium text-gray-500">Study Notes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover-card">
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
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 animate-slide-in-up hover-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search resources by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-900 transition-all font-medium placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-10 py-3.5 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary-500 text-gray-700 font-semibold cursor-pointer transition-all appearance-none min-w-[180px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Resources Grid */}
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

                <a
                  href={resource.link}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 group/btn"
                >
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
          <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentStudy;
