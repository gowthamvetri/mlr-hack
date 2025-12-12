import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, ChevronLeft, ChevronRight, Play, Building2,
  ArrowLeft, Briefcase, TrendingUp, Users, Award
} from 'lucide-react';
import ChatBot from '../components/ChatBot';

const API_URL = import.meta.env.VITE_API;

const PlacementsPage = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [training, setTraining] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-advance slider
    const interval = setInterval(() => {
      if (slides.length > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const fetchData = async () => {
    try {
      const [slidesRes, recruitersRes, trainingRes] = await Promise.all([
        fetch(`${API_URL}placement-page/slides`),
        fetch(`${API_URL}placement-page/recruiters`),
        fetch(`${API_URL}placement-page/training`),
      ]);

      const [slidesData, recruitersData, trainingData] = await Promise.all([
        slidesRes.json(),
        recruitersRes.json(),
        trainingRes.json(),
      ]);

      console.log('Fetched Slides:', slidesData);

      setSlides(slidesData.length > 0 ? slidesData : defaultSlides);
      setRecruiters(recruitersData.length > 0 ? recruitersData : defaultRecruiters);
      setTraining(trainingData.length > 0 ? trainingData : defaultTraining);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use defaults on error
      setSlides(defaultSlides);
      setRecruiters(defaultRecruiters);
      setTraining(defaultTraining);
    } finally {
      setLoading(false);
    }
  };

  const defaultSlides = [
    { id: 1, title: 'Congrats!', studentName: 'N Vamshi Krishna', rollNumber: '21R21A05B1 CSE', company: 'Inovalon', package: '₹25 LPA', batch: 'Batch 2025', image: '/placeholder-placement.jpg' },
    { id: 2, title: '27 Students Selected', company: 'Eidiko', package: '₹4.7 LPA', batch: 'Batch 2025', image: '/placeholder-placement.jpg' },
    { id: 3, title: 'Our Graduate', studentName: 'MLRIT Student', company: 'NXT Wave', package: '₹11 LPA', batch: 'Batch 2025', image: '/placeholder-placement.jpg' },
    { id: 4, title: 'Our Student', company: 'Accelerize 360', package: '₹12 LPA', batch: 'Batch 2025', image: '/placeholder-placement.jpg' },
  ];

  const defaultRecruiters = [
    { id: 1, name: 'Capgemini', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Capgemini_Logo.svg/320px-Capgemini_Logo.svg.png' },
    { id: 2, name: 'Virtusa', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Virtusa_Logo.svg/320px-Virtusa_Logo.svg.png' },
    { id: 3, name: 'Tata Technologies', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/200px-Tata_logo.svg.png' },
    { id: 4, name: 'Tech Mahindra', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Tech_Mahindra_Logo.svg/320px-Tech_Mahindra_Logo.svg.png' },
    { id: 5, name: 'LTI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/LTIMindtree_logo.svg/320px-LTIMindtree_logo.svg.png' },
    { id: 6, name: 'TCS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/320px-Tata_Consultancy_Services_Logo.svg.png' },
    { id: 7, name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/320px-Infosys_logo.svg.png' },
    { id: 8, name: 'Wipro', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wipro_Primary_Logo_Color_RGB.svg/320px-Wipro_Primary_Logo_Color_RGB.svg.png' },
    { id: 9, name: 'Optum', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/United_Health_Group_logo.svg/320px-United_Health_Group_logo.svg.png' },
    { id: 10, name: 'Sonata Software', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Sonata_Software_logo.svg/250px-Sonata_Software_logo.svg.png' },
  ];

  const defaultTraining = [
    {
      type: 'Industry Ready',
      title: 'Industry Ready Training',
      points: [
        'Training on Aptitude, Logical reasoning, Technical skills, Verbal ability, Soft skills and Communication Skills.',
        'Our training and placement Team is well trained and has vast experience with the current industry with more than 10 years of average experience.',
        'Periodical assessments and Mock recruitments will be conducted by the expert teams from the Industry.',
        'We are associated with assessment partners like Cocubes, AMCAT, Btechguru etc for Pre and Post Training assessments.',
        'Our Technical trainers are trained and certified by major IT Companies like EPAM, Virtusa, Servicenow, MindTree, Techmahindra, LTI, Oracle and Cyient.',
        'We also have COE\'s with the reputed organizations like Epam, Virtusa and Cyient.',
      ],
    },
    {
      type: 'Domain',
      title: 'Domain Training',
      points: [
        'Computer Science and Engineering: C & C++, Java, Data Structures, MySql, Agile Practices, Android, Web Programming.',
        'Information Technology: C & C++, Java, Data Structures, MySql, Agile Practices, Android, Web Programming.',
        'Electronics and Communication Engineering: C & C++, Java, Data Structures, MySql, Agile Practices, Web Programming, Arm & Cortex Processor with app. In Robotics.',
        'Mechanical Engineering: CATIA, Hypermesh, Ansys.',
      ],
    },
  ];

  const stats = [
    { value: '500+', label: 'Companies', icon: Building2 },
    { value: '95%', label: 'Placement Rate', icon: TrendingUp },
    { value: '₹44 LPA', label: 'Highest Package', icon: Award },
    { value: '2000+', label: 'Students Placed', icon: Users },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

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
                <img
                  src="/mlrit-logo.png"
                  alt="MLRIT Logo"
                  className="h-10 w-auto object-contain"
                />
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

      {/* Hero with Stats */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">
            Placements at MLRIT
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <stat.icon className="w-8 h-8 text-white mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-red-100 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Slider */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-red-600 text-center mb-12">
            Recent Placements
          </h2>

          <div className="relative" ref={sliderRef}>
            {/* Slider Container */}
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <div key={slide.id || index} className="w-full flex-shrink-0">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-orange-600 font-bold text-lg mb-2">{slide.batch}</p>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{slide.title}</h3>
                        {slide.studentName && (
                          <p className="text-xl text-gray-700 mb-2">{slide.studentName}</p>
                        )}
                        {slide.rollNumber && (
                          <p className="text-gray-500 mb-4">{slide.rollNumber}</p>
                        )}
                        <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow">
                          <span className="text-gray-600">at</span>
                          <span className="font-bold text-lg text-gray-900">{slide.company}</span>
                        </div>
                        {slide.package && (
                          <p className="text-3xl font-bold text-green-600 mt-4">{slide.package}</p>
                        )}
                      </div>
                      <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-xl">
                        <img
                          src={slide.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Placement Highlights
          </h2>
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/NHZ3gwhY8VU?si=JRRLpVGQ-q53gykM"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Top Recruiters Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-red-600 text-center mb-12">
            Our Top Recruiters
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {recruiters.slice(0, 10).map((recruiter, index) => (
              <div
                key={recruiter.id || index}
                className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-center hover:shadow-lg transition-shadow h-24"
              >
                <img
                  src={recruiter.logo}
                  alt={recruiter.name}
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
              VIEW ALL COMPANIES
            </button>
          </div>
        </div>
      </section>

      {/* Training Section */}
      <section className="py-16 bg-gradient-to-b from-gray-100 to-gray-200 relative">
        <div className="absolute inset-0 opacity-5 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200)' }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-red-600 text-center mb-12">
            Training
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {training.map((item, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className={`py-4 px-6 ${item.type === 'Industry Ready' ? 'bg-red-600' : 'bg-gray-900'} text-white`}>
                  <h3 className="text-xl font-bold text-center">{item.title}</h3>
                </div>
                <div className="p-6">
                  {item.type === 'Domain' && (
                    <p className="text-gray-600 mb-4 text-sm">
                      We, at MLR Institute of Technology emphasize in training the students on domain technologies so that the students will be able to secure placements in the core companies also.
                    </p>
                  )}
                  <ul className="space-y-3">
                    {item.points.map((point, idx) => (
                      <li key={idx} className="flex gap-3">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-red-100 text-lg mb-8">
            Join MLRIT and get access to top companies and excellent placement opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-red-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/mlrit-logo.png"
                alt="MLRIT Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-gray-500 text-sm">© 2025 MLRIT. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ChatBot */}
      <ChatBot
        apiEndpoint="http://localhost:8000/api/v1/chat/"
        title="MLRIT Assistant"
        subtitle="Ask me about placements!"
        position="bottom-right"
      />
    </div>
  );
};

export default PlacementsPage;
