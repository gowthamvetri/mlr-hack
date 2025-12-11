import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, Target, Eye, Users, Award, 
  BookOpen, Calendar, ChevronRight, Mail, Phone, ExternalLink
} from 'lucide-react';
import ChatBot from '../components/ChatBot';

const API_URL = import.meta.env.VITE_API;

const DepartmentPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDepartment();
  }, [slug]);

  const fetchDepartment = async () => {
    try {
      const response = await fetch(`${API_URL}/departments/public/${slug}`);
      if (!response.ok) throw new Error('Department not found');
      const data = await response.json();
      setDepartment(data);
    } catch (error) {
      console.error('Error fetching department:', error);
    } finally {
      setLoading(false);
    }
  };

  // Default accreditation logos
  const defaultAccreditations = [
    { name: 'AICTE', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png' },
    { name: 'JNTUH', logo: 'https://upload.wikimedia.org/wikipedia/en/9/97/Jawaharlal_Nehru_Technological_University%2C_Hyderabad_logo.png' },
    { name: 'NAAC', logo: 'https://upload.wikimedia.org/wikipedia/en/8/80/National_Assessment_and_Accreditation_Council_logo.png' },
    { name: 'NBA', logo: 'https://www.nbaind.org/Views/Home/images/logo.png' },
    { name: 'NIRF', logo: 'https://www.nirfindia.org/Images/NIRFlogo.png' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Department Not Found</h1>
        <button 
          onClick={() => navigate('/')}
          className="text-red-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'activities', label: 'Activities', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">MLRIT</span>
                  <span className="text-gray-500 ml-2 hidden sm:inline">Academic Portal</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-100 to-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 italic">
                {department.name}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                {department.description || 'Excellence in education and research.'}
              </p>
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{department.totalStudents || 0}</p>
                  <p className="text-sm text-gray-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{department.totalFaculty || 0}</p>
                  <p className="text-sm text-gray-500">Faculty</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src={department.image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=600'}
                alt={department.name}
                className="rounded-2xl shadow-xl w-full h-72 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-red-600 text-center mb-8 underline decoration-2 underline-offset-8">
            Overview
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-4xl mx-auto text-center mb-12">
            {department.overview || `The department of ${department.name.toLowerCase()} at MLRIT with excellent infrastructure and state-of-the art laboratories provides an ideal ambience for its graduate for research and innovation. The dedicated faculty and passionate students share the vision of linking the fastest growing sector towards economic growth of our nation.`}
          </p>

          {/* Vision & Mission Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-red-600 text-white rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center">Vision</h3>
              <p className="text-red-50 leading-relaxed text-center">
                {department.vision || `To be a centre of excellence in ${department.name} with emphasis on Research & Innovation to serve the needs of industry with human values to build strong nation.`}
              </p>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center">Mission</h3>
              <p className="text-gray-300 leading-relaxed text-center">
                {department.mission || `Consistently produce top quality engineers with core and multidisciplinary skills, who can become ace leaders and successful entrepreneurs with human values.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Faculty Profiles
          </h2>
          
          {department.faculty && department.faculty.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {department.faculty.slice(0, 8).map((member, index) => (
                <div key={member._id || index} className="bg-gray-100 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-red-600 overflow-hidden">
                    <img 
                      src={member.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=128&background=dc2626&color=fff`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{member.designation || 'Faculty'}</p>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors">
                    VIEW PROFILE
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Faculty information coming soon.</p>
          )}
          
          {department.faculty && department.faculty.length > 8 && (
            <div className="text-center mt-8">
              <button className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                VIEW ALL
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Accreditations/Rankings Section */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {(department.accreditations?.length > 0 ? department.accreditations : defaultAccreditations).map((acc, index) => (
              <div key={index} className="flex items-center justify-center">
                <img 
                  src={acc.logo}
                  alt={acc.name}
                  className="h-12 md:h-16 object-contain grayscale hover:grayscale-0 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-200 relative">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200)' }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-red-600 text-center mb-12">
            Activities
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Faculty Activities */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 text-white py-4 px-6">
                <h3 className="text-xl font-bold text-center">Faculty Activities</h3>
              </div>
              <div className="p-6 space-y-4">
                {department.activities?.filter(a => a.type === 'Faculty').slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {activity.description || activity.title}
                    </p>
                  </div>
                )) || (
                  <>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Active learning sessions conducted for faculty development and enhancement of teaching methodologies.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Workshops and certification programs in collaboration with industry experts.
                      </p>
                    </div>
                  </>
                )}
                <button className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors">
                  READ MORE
                </button>
              </div>
            </div>

            {/* Student Activities */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gray-900 text-white py-4 px-6">
                <h3 className="text-xl font-bold text-center">Students Activities</h3>
              </div>
              <div className="p-6 space-y-4">
                {department.activities?.filter(a => a.type === 'Student').slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {activity.description || activity.title}
                    </p>
                  </div>
                )) || (
                  <>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Guest lectures and industry interaction sessions to guide students on career opportunities.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Technical symposiums and project exhibitions showcasing student innovations.
                      </p>
                    </div>
                  </>
                )}
                <button className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors">
                  READ MORE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-white">MLRIT</span>
                <span className="text-gray-400 ml-2">Academic Portal</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">© 2025 MLRIT. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ChatBot */}
      <ChatBot 
        apiEndpoint="http://localhost:8000/chat"
        title="MLRIT Assistant"
        subtitle="Ask me anything about academics!"
        position="bottom-right"
      />
    </div>
  );
};

export default DepartmentPage;
