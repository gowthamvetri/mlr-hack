import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">MLRIT</span>
                <span className="hidden sm:inline text-gray-500 ml-1">Academic Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Register
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg hover:shadow-primary-200 transition-all font-medium"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Video */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-100/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Integrated Academic & Examination System
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
                  Academic Journey
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                One unified platform for students, faculty, and administrators. 
                Manage exams, track progress, explore career paths, and connect 
                with opportunities – all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary-200 transition-all transform hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-primary-300 hover:text-primary-600 transition-all"
                >
                  Sign In
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Video */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Video container with decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl opacity-10 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-1 shadow-2xl shadow-primary-300/30">
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    {/* Video Header Bar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-lg text-xs text-gray-400">
                          <Play className="w-3 h-3" />
                          Watch Introduction
                        </div>
                      </div>
                    </div>
                    {/* YouTube Video */}
                    <div className="aspect-video">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/GQecKPAIzKE?si=EYlc45JK133mW22g" 
                        title="MLRIT Academic Portal Introduction" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerPolicy="strict-origin-when-cross-origin" 
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg p-3 hidden lg:flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Verified</p>
                    <p className="text-xs text-gray-500">Institution</p>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-lg p-3 hidden lg:flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">4.9 Rating</p>
                    <p className="text-xs text-gray-500">User Reviews</p>
                  </div>
                </div>
              </div>
            </div>
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
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg">MLRIT</span>
                  <span className="text-gray-400 ml-1">Academic Portal</span>
                </div>
              </div>
              <p className="text-gray-400 max-w-md">
                Integrated Academic and Examination Management System for modern educational institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Student Login</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Admin Portal</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Club Coordinator</button></li>
                <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Seating Manager</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>MLRIT, Hyderabad</li>
                <li>info@mlrit.ac.in</li>
                <li>+91 40 2345 6789</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2025 MLRIT. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
