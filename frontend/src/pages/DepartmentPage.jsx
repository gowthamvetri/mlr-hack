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
      const response = await fetch(`${API_URL}departments/public/${slug}`);
      if (!response.ok) throw new Error('Department not found');
      const data = await response.json();
      setDepartment(data);
    } catch (error) {
      console.error('Error fetching department:', error);
      // Fallback to dummy data
      const dummyData = getDummyDepartment(slug);
      if (dummyData) {
        setDepartment(dummyData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDummyDepartment = (slug) => {
    // Common dummy data for structure
    const common = {
      name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: 'Excellence in education and innovation.',
      image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200',
      totalStudents: '1200+',
      totalFaculty: '85+',
      overview: 'The department at MLRIT with excellent infrastructure and state-of-the art laboratories provides an ideal ambience for its graduate for research and innovation. The dedicated faculty and passionate students share the vision of linking the fastest growing sector towards economic growth of our nation.',
      vision: 'To be a centre of excellence with emphasis on Research & Innovation to serve the needs of industry with human values to build strong nation.',
      mission: 'Consistently produce top quality engineers with core and multidisciplinary skills, who can become ace leaders and successful entrepreneurs with human values.',
      faculty: [
        { name: 'Dr. M.Satyanarayana Gupta', designation: 'HOD & Professor', profileImage: 'https://ui-avatars.com/api/?name=MSG&background=random' },
        { name: 'Dr. A Vivek Anand', designation: 'Professor & Associate Dean', profileImage: 'https://ui-avatars.com/api/?name=AVA&background=random' },
        { name: 'M. Ganesh', designation: 'Associate Professor', profileImage: 'https://ui-avatars.com/api/?name=MG&background=random' },
        { name: 'Dr Saiprakash', designation: 'Associate Professor', profileImage: 'https://ui-avatars.com/api/?name=DS&background=random' }
      ],
      activities: [
        { type: 'Faculty', description: 'Active learning session was conducted to aeronautical Engineering Staff by Mr. Prabhu kishore of Mechanical Department on 8th, 11th, 13th Feb. here he explained about various learning methods which will involve active participation of students in class.' },
        { type: 'Faculty', description: 'IUCEE in collaboration with MLRIT has conducted IIEECP-16 Precertification Program on 8,9,10th of June, 2016. In this workshop various methodologies of engineering education have been discussed by Dr. Siva Kumar Krishnan.' },
        { type: 'Student', description: 'Mr. Deepak Luthra is a veteran in International Students Admissions and has worked to guide students for over the world and especially from the Indian Subcontinent from the Last 16 years.' },
        { type: 'Student', description: 'Dr M. Satyanarayan Gupta, head of Aeronautical engineering along with Mr. M Venkateshwar Reddy, HOD Mechanical engineering welcomed Mr. Deepak Luthra on to the stage.' }
      ]
    };

    // Specific overrides for Aeronautical Engineering (as per screenshot)
    if (slug === 'aeronautical-engineering') {
      return {
        ...common,
        name: 'Aeronautical Engineering',
        overview: 'The department of aeronautical engineering at MLRIT with excellent infrastructure and state-of-the art laboratories provides an ideal ambience for its graduate for research and innovation in one of the most fascinating & challenging branch of engineering. The dedicated faculty and passionate students share the vision of linking the fastest growing aerospace sector towards economic growth of our nation.',
        vision: 'To be a centre of excellence in Aeronautical engineering with emphasis on Research & Innovation to serve the needs of industry with human values to build strong nation.',
        mission: 'Consistently produce top quality Aeronautical engineers with core and multidisciplinary skills, who can become ace leaders and successful entrepreneurs with human values.',
        faculty: [
          { name: 'Dr. M.Satyanarayana Gupta', designation: 'HOD & Professor', profileImage: 'https://mlrit.ac.in/assets/img/faculty/D-503.jpg' },
          // Note: Using placeholder or generic images if real URLs aren't known, but try to use something realistic
          { name: 'Dr. A Vivek Anand', designation: 'Professor & Associate Dean', profileImage: 'https://ui-avatars.com/api/?name=A+Vivek+Anand&background=0D8ABC&color=fff' },
          { name: 'M. Ganesh', designation: 'Associate Professor', profileImage: 'https://ui-avatars.com/api/?name=M+Ganesh&background=0D8ABC&color=fff' },
          { name: 'Dr Saiprakash', designation: 'Associate Professor', profileImage: 'https://ui-avatars.com/api/?name=Dr+Saiprakash&background=0D8ABC&color=fff' }
        ]
      };
    }

    // Specific overrides for Freshman Engineering (Scraped Data)
    if (slug === 'freshman') {
      return {
        ...common,
        name: 'Freshman Engineering',
        description: 'STEM: Science, Technology, Engineering And Math - Education For Global Leadership',
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200', // STEM/Classroom image
        overview: 'Engineering is all about applying science and mathematics practically to come up with solutions to problems we face in our daily lives. S.T.E.M. education is an important learning tool for today’s students. It encourages critical thinking, problem management skills, and uses real world applications to promote innovation. The Department’s program supports educators in providing students with more personalized learning—in which the pace of and approach to instruction are uniquely tailored to meet students’ individual needs and interests.',
        vision: 'To attain excellence in pedagogy in the areas of humanities & basic sciences, to face the emerging global challenges efficiently and to make the students expert professionals in their fields.',
        mission: 'To provide students with soft skills and behavioral training programs in order to develop their overall personality and social consciousness. Encourage the students to know the practical applications of concepts through experience and participation.',
        faculty: [
          { name: 'Dr. V.Radhika Devi', designation: 'Professor & Dean', profileImage: 'https://ui-avatars.com/api/?name=V+Radhika+Devi&background=random' },
          { name: 'Dr. JSVR. Krishna Prasad', designation: 'Professor', profileImage: 'https://ui-avatars.com/api/?name=JSVR+Krishna+Prasad&background=random' },
          { name: 'Dr. Ch Achi Reddy', designation: 'HOD & Professor', profileImage: 'https://ui-avatars.com/api/?name=Ch+Achi+Reddy&background=random' },
        ],
        labs: [
          { name: 'Engineering Physics Lab', code: 'MG212', description: 'State of the art physics laboratory.' },
          { name: 'Engineering Graphics & Design Lab', code: 'MG-004', description: 'Modern CAD/CAM facilities.' },
          { name: 'Chemistry Lab', code: 'MG 010', description: 'Advanced chemistry experimentation equipment.' },
          { name: 'Programming Problem Solving Lab', code: '008', description: 'High-performance computing systems.' },
          { name: 'Basic Electric Engineering Lab', code: 'MG-002', description: 'Fundamental electrical circuit testing.' },
          { name: 'English Language & Communcation Skills Lab', code: 'MG 005', description: 'Audio-visual aid supported language lab.' },
          { name: 'Workshop & Manufacturing Practices', code: 'MG-004', description: 'Hands-on manufacturing and tooling workshop.' }
        ],
        achievements: [
          { title: 'Introduction To Calculus', description: 'Academic achievement in fundamental mathematics.', link: 'https://mlrit.ac.in/achievements/introduction-to-calculus/' },
          { title: 'Presentation Skills: Designing Presentation Slides', description: 'Excellence in soft skills and communication.', link: 'https://mlrit.ac.in/achievements/presentation-skills-designing-presentation-slides/' },
          { title: 'Matrix Algebra For Engineers', description: 'Advanced proficiency in engineering mathematics.', link: 'https://mlrit.ac.in/achievements/matrix-algebra-for-engineers/' },
          { title: 'Solid State Physics', description: 'Research and theoretical mastery in physics.', link: 'https://mlrit.ac.in/achievements/solid-state-physics/' }
        ],
        activities: [
          { type: 'Faculty', description: 'Faculty development sessions conducted by Dr. Radhika Devi V, HoD S&H, MLRIT.' },
          { type: 'Faculty', description: 'Session by Sri Raju L Kanchibhotla, Director Logic Designers.' },
          { type: 'Faculty', description: 'Physics workshop by Dr. T. Arun, Prof. in Physics, MLRIT.' },
          { type: 'Student', description: '1st year students visited Sathish Dhawan Space Centre, ISRO, Sriharikota.' },
          { type: 'Student', description: 'A one day training programme on “LEADERSHIP SKILLS, STUDY SKILLS AND MEMORY SKILLS” by DR.C.S.VEPA, director of National school of Banking.' },
          { type: 'Student', description: 'Mr. Varun, Associate Territory manager for Cambridge gave an overview of BEC Certificate programme and its importance.' }
        ]
      };
    }

    return common;
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



      {/* Labs Section (Dynamic) */}
      {
        department.labs && department.labs.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-red-600 text-center mb-12 flex items-center justify-center gap-3">
                <Beaker className="w-8 h-8" />
                Department Laboratories
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {department.labs.map((lab, index) => (
                  <div key={index} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-red-600">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{lab.name}</h3>
                    {lab.code && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded mb-3">
                        Code: {lab.code}
                      </span>
                    )}
                    <p className="text-gray-600 text-sm">{lab.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      }

      {/* Achievements Section (Dynamic) */}
      {
        department.achievements && department.achievements.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 flex items-center justify-center gap-3">
                <Award className="w-8 h-8 text-red-600" />
                Achievements & Certifications
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {department.achievements.map((ach, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{ach.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{ach.description}</p>
                      {ach.link && (
                        <a href={ach.link} target="_blank" rel="noopener noreferrer" className="text-red-600 text-sm font-medium hover:underline flex items-center gap-1">
                          View Details <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      }

      {/* Key Differentiators Section (Dynamic) */}
      {
        department.keyDifferentiators && department.keyDifferentiators.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-red-600 text-center mb-12 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" />
                Key Differentiators
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {department.keyDifferentiators.map((diff, index) => (
                  <div key={index} className="bg-orange-50 rounded-xl p-6 border border-orange-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{diff.title}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{diff.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      }

      {/* Course Structure Section (Dynamic) */}
      {
        department.courseStructure && department.courseStructure.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 flex items-center justify-center gap-3">
                <BookOpen className="w-8 h-8 text-red-600" />
                First Year Course Structures
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {department.courseStructure.map((course, index) => (
                  <a
                    key={index}
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 group"
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <Download className="w-5 h-5 text-red-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{course.branch}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )
      }

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
        apiEndpoint="http://localhost:8000/api/v1/chat/"
        title="MLRIT Assistant"
        subtitle="Ask me anything about academics!"
        position="bottom-right"
      />
    </div >
  );
};

export default DepartmentPage;
