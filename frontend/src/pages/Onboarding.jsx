import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import { 
  GraduationCap, Building2, Compass, ClipboardCheck, 
  LineChart, Calendar, Users, Award, ArrowRight, 
  CheckCircle, Play, Sparkles, BookOpen, Target,
  TrendingUp, Shield, Zap, Globe, ChevronRight, Star, Check
} from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');

  const stats = [
    { value: '10K+', label: 'Active Students', icon: Users },
    { value: '500+', label: 'Partner Institutes', icon: Building2 },
    { value: '95%', label: 'Placement Rate', icon: Target },
    { value: '24/7', label: 'Support Available', icon: Shield },
  ];

  const features = [
    {
      icon: Compass,
      title: 'AI-Powered Career Guidance',
      description: 'Personalized career roadmaps based on your skills, interests, and market trends',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: ClipboardCheck,
      title: 'Smart Exam Management',
      description: 'Automated hall tickets, seating allocation, and schedule management',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: LineChart,
      title: 'Real-time Analytics',
      description: 'Track progress, identify gaps, and optimize learning outcomes',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Calendar,
      title: 'Event & Club Management',
      description: 'Organize events, manage approvals, and engage with student communities',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: BookOpen,
      title: 'Study Resources',
      description: 'Access curated learning materials and track your study streak',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: TrendingUp,
      title: 'Placement Tracking',
      description: 'Monitor placement drives, applications, and success rates',
      color: 'from-cyan-500 to-cyan-600',
    },
  ];

  const portalTypes = [
    {
      title: 'Student Portal',
      description: 'Access exams, study resources, and career guidance',
      icon: GraduationCap,
      features: ['View exam schedules & hall tickets', 'Track learning streaks', 'Career roadmap access', 'Club participation'],
      cta: 'Join as Student',
      action: () => navigate('/register'),
      primary: true,
    },
    {
      title: 'Admin Portal',
      description: 'Complete institutional management and oversight',
      icon: Shield,
      features: ['Student & faculty management', 'Analytics dashboard', 'Placement tracking', 'Event approvals'],
      cta: 'Admin Login',
      action: () => navigate('/login'),
      primary: false,
    },
    {
      title: 'Staff Portals',
      description: 'Specialized access for coordinators and managers',
      icon: Users,
      features: ['Club event management', 'Seating allocation', 'Room management', 'Reports & exports'],
      cta: 'Staff Login',
      action: () => navigate('/login'),
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Full-Screen Hero Section with Video Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/GQecKPAIzKE?autoplay=1&mute=1&loop=1&playlist=GQecKPAIzKE&controls=0&showinfo=0&modestbranding=1" 
            title="MLRIT Academic Portal Introduction" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full object-cover scale-150"
            style={{ pointerEvents: 'none' }}
          />
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50"></div>
        
        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-xl">MLRIT</span>
                  <span className="hidden sm:inline text-gray-300 ml-2">Academic Portal</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white hover:text-primary-300 font-medium transition-colors"
                >
                  Register
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg"
                >
                  Login
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center min-h-[calc(100vh-5rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-8 border border-white/20">
                <Sparkles className="w-4 h-4 text-primary-400" />
                Integrated Academic & Examination System
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">
                  Academic Journey
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-xl">
                One unified platform for students, faculty, and administrators. 
                Manage exams, track progress, and explore career paths.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of tools designed for modern academic institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Types Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-4">
              <Globe className="w-4 h-4" />
              Access Portals
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Portal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tailored experiences for every role in your institution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {portalTypes.map((portal, index) => (
              <div 
                key={index}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl ${
                  portal.primary 
                    ? 'bg-gradient-to-br from-primary-600 to-primary-800 text-white' 
                    : 'bg-white border border-gray-200 hover:border-primary-200'
                }`}
              >
                {portal.primary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  portal.primary 
                    ? 'bg-white/20' 
                    : 'bg-primary-50'
                }`}>
                  <portal.icon className={`w-8 h-8 ${portal.primary ? 'text-white' : 'text-primary-600'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${portal.primary ? 'text-white' : 'text-gray-900'}`}>
                  {portal.title}
                </h3>
                <p className={`mb-6 ${portal.primary ? 'text-primary-100' : 'text-gray-600'}`}>
                  {portal.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {portal.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                        portal.primary ? 'text-green-300' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${portal.primary ? 'text-primary-100' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={portal.action}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    portal.primary 
                      ? 'bg-white text-primary-600 hover:bg-gray-100' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {portal.cta}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Institution?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of students and educators already using MLRIT Academic Portal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg">MLRIT</span>
                  <span className="text-gray-400 ml-1 hidden sm:inline">Academic Portal</span>
                </div>
              </div>
              <p className="text-gray-400 max-w-md text-sm sm:text-base">
                Integrated Academic and Examination Management System for modern educational institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Student Login</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Admin Portal</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Club Coordinator</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Seating Manager</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>MLRIT, Hyderabad</li>
                <li>info@mlrit.ac.in</li>
                <li>+91 40 2345 6789</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs sm:text-sm">© 2025 MLRIT. All rights reserved.</p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ChatBot Component */}
      <ChatBot 
        apiEndpoint="http://localhost:8000/chat"
        title="MLRIT Assistant"
        subtitle="Ask me anything about academics!"
        position="bottom-right"
      />
    </div>
  );
};

export default Onboarding;
