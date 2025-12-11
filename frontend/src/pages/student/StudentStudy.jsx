import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { BookOpen, Video, FileText, Link as LinkIcon, Search, Filter, Star, Clock, ExternalLink } from 'lucide-react';

const StudentStudy = () => {
  const { user } = useAuth();
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Study Support</h1>
        <p className="text-sm sm:text-base text-gray-500">Access learning resources and study materials</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm sm:text-base"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">12</p>
              <p className="text-xs sm:text-sm text-gray-500">Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">48</p>
              <p className="text-xs sm:text-sm text-gray-500">Videos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">25</p>
              <p className="text-xs sm:text-sm text-gray-500">Notes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">5</p>
              <p className="text-sm text-gray-500">Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                  {resource.category}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{resource.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{resource.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {resource.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {resource.rating}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <a 
                href={resource.link}
                className="flex items-center justify-center gap-2 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Access Resource
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No resources found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentStudy;
