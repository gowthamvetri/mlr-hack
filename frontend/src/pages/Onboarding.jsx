import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedNumber from '../components/AnimatedNumber';
import {
  GraduationCap, Building2, Users, ArrowRight,
  CheckCircle, Sparkles, Target, Shield, Globe, ChevronRight, Briefcase,
  ChevronDown, ExternalLink, ChevronUp
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API;

const Onboarding = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const departmentsRef = useRef(null);
  const portalsRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP Animations for vertical scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Hero entrance animations
      const heroTl = gsap.timeline({ delay: 0.3 });
      heroTl
        .fromTo('.hero-title-1', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
        .fromTo('.hero-title-2', { opacity: 0, y: 60, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, '-=0.6')
        .fromTo('.hero-subtitle', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .fromTo('.hero-cta > *', { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' }, '-=0.4')
        .fromTo('.hero-stats > div', { opacity: 0, y: 40, rotateX: 45 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, '-=0.3');

      // Floating animation
      gsap.to('.float-slow', { y: -20, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.float-fast', { y: -15, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });

      // Section reveal animations on scroll
      const sections = [departmentsRef.current, portalsRef.current, contactRef.current];
      sections.forEach((section) => {
        if (!section) return;

        gsap.fromTo(section.querySelectorAll('.animate-card'),
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, [departments]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}departments/public`);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      setDepartments(defaultDepartments);
    }
  };

  const defaultDepartments = [
    { name: 'Aeronautical Engineering', slug: 'aeronautical-engineering', image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=400' },
    { name: 'Computer Science Engineering', slug: 'computer-science-and-engineering', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400' },
    { name: 'CSE - Cyber Security', slug: 'computer-science-engineering-cyber-security', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400' },
    { name: 'CSE - Data Science', slug: 'computer-science-engineering-data-science', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' },
    { name: 'CSE AI & ML', slug: 'cse-ai-ml', image: 'https://images.unsplash.com/photo-1677442135136-760c813a743d?w=400' },
    { name: 'Electronics & Communication', slug: 'electronics-and-communication-engineering', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400' },
    { name: 'Electrical & Electronics', slug: 'electrical-and-electronics-engineering', image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400' },
    { name: 'Information Technology', slug: 'information-technology', image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400' },
    { name: 'Mechanical Engineering', slug: 'mechanical-engineering', image: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=400' },
    { name: 'MBA', slug: 'master-of-business-administration', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
    { name: 'Freshman', slug: 'freshman', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400' },
    { name: 'CSIT', slug: 'computer-science-and-information-technology', image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400' },
  ];

  const stats = [
    { value: 10000, label: 'Active Students', icon: Users, suffix: '+', color: 'from-primary-500 to-primary-600' },
    { value: 500, label: 'Partner Institutes', icon: Building2, suffix: '+', color: 'from-purple-500 to-indigo-500' },
    { value: 95, label: 'Placement Rate', icon: Target, suffix: '%', color: 'from-green-500 to-emerald-500' },
    { value: 24, label: 'Hour Support', icon: Shield, suffix: '/7', color: 'from-orange-500 to-amber-500' },
  ];

  const portalTypes = [
    {
      title: 'Student Portal',
      description: 'Your complete academic companion with AI-powered features',
      icon: GraduationCap,
      features: ['Digital hall tickets & exam schedules', 'AI career guidance assistant', 'Learning streak tracking', 'Club & event participation'],
      cta: 'Join as Student',
      action: () => navigate('/login'),
      primary: true,
    },
    {
      title: 'Admin Portal',
      description: 'Complete institutional management and oversight',
      icon: Shield,
      features: ['Student & faculty management', 'Advanced analytics dashboard', 'Placement tracking system', 'Event approval workflow'],
      cta: 'Admin Login',
      action: () => navigate('/login'),
      primary: false,
    },
    {
      title: 'Staff Portals',
      description: 'Specialized tools for coordinators and managers',
      icon: Users,
      features: ['Club event management', 'Seating allocation tools', 'Room management system', 'Reports & data exports'],
      cta: 'Staff Login',
      action: () => navigate('/login'),
      primary: false,
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="mesh-gradient-bg min-h-screen overflow-x-hidden">
      {/* Fixed Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 bg-white/80 backdrop-blur-lg shadow-sm ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <img src="/mlrit-logo.png" alt="MLRIT" className="h-14 w-auto drop-shadow-lg" />
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection(heroRef)} className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</button>
              <button onClick={() => scrollToSection(departmentsRef)} className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Departments</button>
              <button onClick={() => scrollToSection(portalsRef)} className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Portals</button>
              <button onClick={() => scrollToSection(contactRef)} className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Contact</button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all font-semibold hover:scale-105 shadow-lg shadow-primary-500/25">
                Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[100] p-4 bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/30 hover:bg-primary-600 hover:scale-110 transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* ===== SECTION 1: HERO ===== */}
      <section
        ref={heroRef}
        className="min-h-screen relative flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/GQecKPAIzKE?autoplay=1&mute=1&loop=1&playlist=GQecKPAIzKE&controls=0&showinfo=0&modestbranding=1"
            title="MLRIT"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-full object-cover scale-150"
            style={{ pointerEvents: 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/50 to-white/50" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="float-slow absolute top-1/4 left-[10%] w-32 h-32 bg-gradient-to-br from-primary-500/10 to-orange-500/10 rounded-full blur-2xl" />
          <div className="float-fast absolute top-1/3 right-[15%] w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-2xl" />
          <div className="float-slow absolute bottom-1/3 left-[20%] w-20 h-20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h1 className="mb-6">
            <span className="hero-title-1 block text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Transform Your
            </span>
            <span className="hero-title-2 block mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold gradient-text">
              Academic Journey
            </span>
          </h1>

          <p className="hero-subtitle text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            One unified platform for students, faculty, and administrators with
            <span className="text-gray-900 font-medium"> AI-powered</span> exam management and career guidance.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-bold text-lg shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-1 hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/placements')}
              className="group flex items-center justify-center gap-3 px-8 py-4 glass-card text-gray-700 rounded-full font-bold text-lg hover:bg-white/80 transition-all hover:scale-105 shadow-lg"
            >
              <Briefcase className="w-5 h-5" />
              View Placements
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group glass-card rounded-2xl p-5 tilt-card hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  <AnimatedNumber value={stat.value} duration={2000} />{stat.suffix}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown className="w-5 h-5 text-gray-400 animate-bounce" />
        </div>
      </section>

      {/* ===== SECTION 2: DEPARTMENTS ===== */}
      <section
        ref={departmentsRef}
        className="py-24 mesh-gradient-bg relative overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="animate-card inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-sm font-medium mb-6 text-purple-600">
              <Building2 className="w-4 h-4" />
              Explore Programs
            </span>
            <h2 className="animate-card text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Our <span className="gradient-text">Departments</span>
            </h2>
            <p className="animate-card text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of undergraduate and postgraduate programs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(departments.length > 0 ? departments : defaultDepartments).map((dept, index) => {
              // Generate slug from name if not available
              const deptSlug = dept.slug || dept.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return (
                <Link
                  key={dept._id || index}
                  to={`/departments/${deptSlug}`}
                  className="animate-card group glass-card rounded-2xl overflow-hidden tilt-card hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={dept.image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=400'}
                      alt={dept.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 bg-white/80">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm text-center leading-tight line-clamp-2">
                      {dept.name}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/register')}
              className="animate-card inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all hover:scale-105 shadow-xl"
            >
              Explore All Programs
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: PORTALS ===== */}
      <section
        ref={portalsRef}
        className="py-24 mesh-gradient-bg relative overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="animate-card inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-sm font-medium mb-6 text-green-600">
              <Globe className="w-4 h-4" />
              Access Portals
            </span>
            <h2 className="animate-card text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Choose Your <span className="gradient-text">Portal</span>
            </h2>
            <p className="animate-card text-lg text-gray-600 max-w-2xl mx-auto">
              Tailored experiences designed for every role in your academic institution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {portalTypes.map((portal, index) => (
              <div
                key={index}
                className={`animate-card group relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-3 ${portal.primary
                  ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-2xl shadow-primary-500/30'
                  : 'glass-card tilt-card'
                  }`}
              >
                {portal.primary && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold rounded-full shadow-lg uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${portal.primary ? 'bg-white/20' : 'bg-gradient-to-br from-primary-500/10 to-orange-500/10'
                  }`}>
                  <portal.icon className={`w-8 h-8 ${portal.primary ? 'text-white' : 'text-primary-600'}`} />
                </div>

                <h3 className={`text-2xl font-bold mb-3 ${portal.primary ? 'text-white' : 'text-gray-900'}`}>{portal.title}</h3>
                <p className={`mb-6 ${portal.primary ? 'text-white/80' : 'text-gray-600'}`}>
                  {portal.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {portal.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${portal.primary ? 'text-green-300' : 'text-green-500'
                        }`} />
                      <span className={`text-sm ${portal.primary ? 'text-white/80' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={portal.action}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${portal.primary
                    ? 'bg-white text-primary-600 hover:bg-gray-100 shadow-xl'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40'
                    }`}
                >
                  {portal.cta}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: FOOTER ===== */}
      <section
        ref={contactRef}
        className="py-24 bg-gray-900 relative overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - CTA */}
            <div className="text-center lg:text-left">
              <span className="animate-card inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500/20 border border-primary-500/30 rounded-full text-sm font-medium mb-6 text-primary-300">
                <Sparkles className="w-4 h-4" />
                Get Started Today
              </span>
              <h2 className="animate-card text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">Transform</span> Your Institution?
              </h2>
              <p className="animate-card text-lg text-gray-400 mb-10 max-w-lg">
                Join thousands of students and educators already using MLRIT Academic Portal for a seamless educational experience.
              </p>
              <div className="animate-card flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/register')}
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-bold text-lg shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:scale-105"
                >
                  Start Free Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Right - Contact Info */}
            <div className="animate-card grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-white mb-5 text-lg">Quick Links</h4>
                <ul className="space-y-3 text-sm">
                  <li><button onClick={() => navigate('/placements')} className="text-gray-400 hover:text-white transition-colors">Placements</button></li>
                  <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Student Login</button></li>
                  <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Admin Portal</button></li>
                  <li><button onClick={() => navigate('/register')} className="text-gray-400 hover:text-white transition-colors">Register</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-5 text-lg">Contact</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li>MLRIT, Hyderabad</li>
                  <li>info@mlrit.ac.in</li>
                  <li>+91 40 2345 6789</li>
                </ul>
              </div>
              <div className="col-span-2 pt-6 border-t border-white/10">
                <img src="/mlrit-logo.png" alt="MLRIT" className="h-12 w-auto mb-4" />
                <p className="text-gray-500 text-sm">© 2025 MLRIT. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ChatBot */}
      <ChatBot
        apiEndpoint="http://localhost:8000/api/v1/chat/"
        title="MLRIT Assistant"
        subtitle="Ask me anything about academics!"
        position="bottom-right"
      />
    </div>
  );
};

export default Onboarding;
