import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  getStudentExams, getEvents, getMySeat, getSubjects,
  getStreak, getSkills, getCareerProgress, updateStreak,
  getMyApprovalStatus
} from '../utils/api';
import MindMapViewer from '../components/MindMapViewer';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import NoticeBoard from '../components/NoticeBoard';
import useAnimatedCounter from '../hooks/useAnimatedCounter';
import {
  ClipboardList, Calendar, BookOpen, Award, Download, MapPin,
  Flame, Trophy, Target, Brain, Sparkles, MessageCircle,
  ArrowRight, CheckCircle2, Circle, Briefcase, TrendingUp,
  Lightbulb, Zap, Code, Palette, Database, Users
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import gsap from 'gsap';

const StudentDashboard = () => {
  /* REMOVED: const { user } = useAuth(); */
  const user = useSelector(selectCurrentUser);
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showMindMap, setShowMindMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic data states
  const [streak, setStreak] = useState(0);
  const [skillsGained, setSkillsGained] = useState(0);
  const [profileScore, setProfileScore] = useState(0);
  const [careerReadiness, setCareerReadiness] = useState(0);
  const [activeGoals, setActiveGoals] = useState(0);
  const [skillsTracked, setSkillsTracked] = useState(0);
  const [exploredCareers, setExploredCareers] = useState({ current: 0, total: 6 });
  const [skills, setSkills] = useState([]);
  const [careerRoadmap, setCareerRoadmap] = useState([
    { step: 1, title: 'Complete Profile', progress: 0, completed: false },
    { step: 2, title: 'Skill Assessment', progress: 0, completed: false },
    { step: 3, title: 'Resume Building', progress: 0, completed: false },
    { step: 4, title: 'Interview Preparation', progress: 0, completed: false },
    { step: 5, title: 'Job Applications', progress: 0, completed: false },
  ]);

  // GSAP Animation Refs
  const pageRef = useRef(null);
  const statsRef = useRef(null);
  const sectionsRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (!pageRef.current) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Stats cards animation
        if (statsRef.current) {
          const cards = statsRef.current.querySelectorAll('.stat-card');
          gsap.fromTo(cards,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
          );
        }

        // Sections animation
        if (sectionsRef.current) {
          const sections = sectionsRef.current.children;
          gsap.fromTo(sections,
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.3 }
          );
        }
      }, pageRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]); // Re-run when loading completes


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch core data
        const [examsRes, eventsRes, seatsRes, subjectsRes] = await Promise.all([
          getStudentExams(),
          getEvents('Approved'),
          getMySeat(),
          getSubjects()
        ]);

        // Ensure all responses are arrays
        const examsData = examsRes.data;
        const eventsData = eventsRes.data;
        const seatsData = seatsRes.data;
        const subjectsData = subjectsRes.data;

        setExams(Array.isArray(examsData) ? examsData : (examsData?.exams || []));
        setEvents(Array.isArray(eventsData) ? eventsData : (eventsData?.events || []));
        setSeats(Array.isArray(seatsData) ? seatsData : (seatsData?.seats || []));
        setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []));

        const subjectsArray = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []);
        if (subjectsArray.length > 0) setSelectedSubject(subjectsArray[0]);

        // Fetch student progress data (streak, skills, career)
        try {
          const [streakRes, skillsRes, careerRes, approvalRes] = await Promise.all([
            getStreak().catch(() => ({ data: null })),
            getSkills().catch(() => ({ data: null })),
            getCareerProgress().catch(() => ({ data: null })),
            getMyApprovalStatus().catch(() => ({ data: {} }))
          ]);

          // Update streak and trigger daily streak
          if (streakRes?.data) {
            setStreak(streakRes.data.currentStreak || 0);
            // Update streak on login
            await updateStreak();
          }

          // Update skills data
          if (skillsRes?.data) {
            setSkillsGained(skillsRes.data.totalSkills || 0);
            setSkillsTracked(skillsRes.data.skills?.length || 0);
            const formattedSkills = (skillsRes.data.skills || []).slice(0, 4).map(skill => ({
              name: skill.name,
              level: skill.progress || 0,
              trend: `+${Math.floor(Math.random() * 15) + 1}%` // TODO: Calculate from actual data
            }));
            setSkills(formattedSkills.length > 0 ? formattedSkills : [
              { name: 'JavaScript', level: 0, trend: '+0%' },
              { name: 'React', level: 0, trend: '+0%' },
              { name: 'Python', level: 0, trend: '+0%' },
              { name: 'SQL', level: 0, trend: '+0%' },
            ]);
          }

          // Update career progress and roadmap
          if (careerRes?.data) {
            setProfileScore(careerRes.data.profileScore || 0);
            setCareerReadiness(careerRes.data.careerReadiness || 0);
            setActiveGoals(careerRes.data.activeGoals || 0);
          }

          // Update roadmap steps based on approval status
          if (approvalRes?.data) {
            setCareerRoadmap(prev => prev.map(step => {
              const approval = approvalRes.data[step.step];
              const isCompleted = approval?.status === 'approved';
              return {
                ...step,
                progress: isCompleted ? 100 : (approval?.status === 'pending' ? 50 : 0),
                completed: isCompleted
              };
            }));
          }
        } catch (progressError) {
          console.log('Progress data not available yet:', progressError.message);
          // Set default values for new users
          setStreak(0);
          setSkillsGained(0);
          setSkillsTracked(0);
          setProfileScore(0);
          setCareerReadiness(0);
          setActiveGoals(0);
          setSkills([
            { name: 'JavaScript', level: 0, trend: '+0%' },
            { name: 'React', level: 0, trend: '+0%' },
            { name: 'Python', level: 0, trend: '+0%' },
            { name: 'SQL', level: 0, trend: '+0%' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSeatForExam = (examId) => {
    return seats.find(s => s?.exam?._id === examId || s?.exam === examId);
  };

  const examColumns = [
    {
      header: 'Subject', accessor: 'courseName', render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.courseName}</p>
          <p className="text-xs text-gray-500">{row.courseCode}</p>
        </div>
      )
    },
    {
      header: 'Date & Time', render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{new Date(row.date).toLocaleDateString()}</p>
          <p className="text-xs font-medium text-gray-500">{row.startTime} - {row.endTime}</p>
        </div>
      )
    },
    {
      header: 'Status', render: (row) => (
        row.hallTicketsGenerated ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            Ready
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
            Pending
          </span>
        )
      )
    },
    {
      header: 'Seating', render: (row) => {
        const seat = getSeatForExam(row._id);
        return seat ? (
          <div className="flex items-center gap-2 text-primary-600 font-medium">
            <MapPin size={14} />
            <span>Room {seat.roomNumber}, Seat {seat.seatNumber}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic font-medium">Not allocated</span>
        );
      }
    },
    {
      header: 'Action', render: (row) => (
        row.hallTicketsGenerated ? (
          <button
            onClick={() => alert(`Downloading Hall Ticket for ${row.courseName}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm active:scale-95"
          >
            <Download size={14} />
            Download
          </button>
        ) : null
      )
    },
  ];

  const notices = events.slice(0, 5).map(e => ({
    title: e.title,
    author: e.coordinator?.name || 'Event Team',
    date: e.date
  }));

  const navigate = useNavigate();

  // Animated counters for stat cards
  const animatedStreak = useAnimatedCounter(streak, 1200, 200);
  const animatedSkills = useAnimatedCounter(skillsGained, 1200, 300);
  const animatedExams = useAnimatedCounter(exams.length, 1200, 400);
  const animatedProfileScore = useAnimatedCounter(profileScore, 1200, 500);

  return (
    <DashboardLayout title="Dashboard">
      {/* Mesh gradient background wrapper */}
      <div ref={pageRef} className="mesh-gradient-bg min-h-screen -m-6 p-6">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋</h1>
          <p className="text-gray-500 text-lg">Here's what's happening with your academic progress.</p>
        </div>

        {/* Top Stats Row - Modern Glassmorphism Cards with 3D Tilt */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Daily Streak Card - Glassmorphism */}
          <div className="stat-card glass-card tilt-card rounded-3xl p-6 group relative overflow-hidden">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Daily Streak</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center icon-container animate-float">
                  <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold text-gray-900 tracking-tight stat-number">{animatedStreak}</p>
                <span className="text-base text-gray-500 font-medium">days</span>
              </div>
              <p className="text-gray-500 text-sm mt-3 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Keep the momentum!
              </p>
            </div>
          </div>

          {/* Skills Gained - Glassmorphism with gradient accent */}
          <div className="stat-card glass-card tilt-card rounded-3xl p-6 group relative overflow-hidden">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Skills Gained</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 rounded-2xl flex items-center justify-center icon-container">
                  <Award className="w-7 h-7" />
                </div>
              </div>
              <p className="text-5xl font-bold text-gray-900 tracking-tight stat-number">{animatedSkills}</p>
              <p className="text-gray-500 text-sm mt-3 font-medium">New skills this month</p>
            </div>
          </div>

          {/* Upcoming Exams - Glassmorphism with accent */}
          <div className="stat-card glass-card tilt-card rounded-3xl p-6 group relative overflow-hidden">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Exams</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 text-accent-600 rounded-2xl flex items-center justify-center icon-container">
                  <ClipboardList className="w-7 h-7" />
                </div>
              </div>
              <p className="text-5xl font-bold text-gray-900 tracking-tight stat-number">{animatedExams}</p>
              <p className="text-gray-500 text-sm mt-3 font-medium">Upcoming scheduled</p>
            </div>
          </div>

          {/* Profile Score - Glassmorphism with progress indicator */}
          <div className="stat-card glass-card tilt-card rounded-3xl p-6 group relative overflow-hidden">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wider">Profile Score</h3>
                <div className="w-14 h-14 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl flex items-center justify-center icon-container">
                  <TrendingUp className="w-7 h-7 text-success-600" />
                </div>
              </div>
              <p className="text-5xl font-bold text-gray-900 tracking-tight stat-number">{animatedProfileScore}<span className="text-2xl text-gray-400">%</span></p>
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success-500 to-success-400 rounded-full progress-bar progress-bar-animated"
                    style={{ width: `${animatedProfileScore}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs mt-2 font-medium">Complete your profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Learning Section */}
        <div className="mb-8 animate-fade-in delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AI-Powered Learning</h2>
            <span className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wide rounded-full">
              <Zap className="w-3 h-3" />
              New Features
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Twin - Digital Mentor */}
            <div className="glass-card tilt-card rounded-3xl overflow-hidden group">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform">
                      <Brain className="w-8 h-8 text-primary-600" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <span className="text-[10px] text-white font-black">AI</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">AI Twin</h3>
                      <p className="text-primary-600 font-medium">Your Digital Mentor</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-accent-50 text-accent-600 text-xs font-bold uppercase tracking-wide rounded-full">
                    Advanced Learner
                  </span>
                </div>

                {/* Career Readiness */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-600">Career Readiness</span>
                    </div>
                    <span className="text-sm font-bold text-primary-600">{careerReadiness}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${careerReadiness}%` }}
                    />
                  </div>
                </div>

                {/* Today's Insight */}
                <div className="bg-amber-50 rounded-2xl p-5 mb-8 border border-amber-100">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Today's Insight</p>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">Your JavaScript skills have improved 15% this week! Consider taking the advanced assessment.</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center transition-colors">
                    <p className="text-2xl font-bold text-gray-900 mb-1">{activeGoals}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Goals</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center transition-colors">
                    <p className="text-2xl font-bold text-primary-600 mb-1">{skillsTracked}+</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Skills Tracked</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95">
                    <MessageCircle className="w-4 h-4" />
                    Quick Chat
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 group/btn" onClick={() => { navigate('/student/ai-twin') }}>
                    View Details
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Career Lab */}
            <div className="glass-card tilt-card gradient-border rounded-3xl overflow-hidden group">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Briefcase className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">AI Career Lab</h3>
                      <p className="text-blue-600 font-medium">Explore Career Paths</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wide rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Active
                  </span>
                </div>

                {/* Exploration Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-600">Exploration Progress</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{exploredCareers.current}/{exploredCareers.total} careers</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(exploredCareers.current / exploredCareers.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Best Performance */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Best Performance</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Palette className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-bold text-gray-900">UX Designer</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-green-600">92%</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Match Score</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">Recent Activity</p>
                  <p className="text-sm font-medium text-gray-700">Completed Software Engineer simulation</p>
                </div>

                {/* Suggested Careers */}
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-3 ml-1">Suggested Next</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <Code className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-gray-700">Full Stack Dev</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-gray-700">Data Analyst</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Career Roadmap Section */}
        <div className="glass-card rounded-3xl p-8 mb-8 tilt-card animate-fade-in delay-300">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-primary-600" />
            <h3 className="text-xl font-bold text-gray-900">Your Personalized Career Roadmap</h3>
          </div>
          <p className="text-gray-500 text-sm mb-8 font-medium ml-9">Follow these steps to achieve your career goals in your field</p>

          <div className="space-y-8 pl-4">
            {careerRoadmap.map((item, index) => (
              <div key={item.step} className="flex items-start gap-6 group">
                {/* Step Indicator */}
                <div className="flex flex-col items-center relative">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 z-10 ${item.completed
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="font-bold text-lg">{item.step}</span>
                    )}
                  </div>
                  {index < careerRoadmap.length - 1 && (
                    <div className="absolute top-12 bottom-[-32px] w-0.5 bg-gray-100">
                      <div className={`w-full transition-all duration-1000 ${item.completed ? 'h-full bg-primary-200' : 'h-0'
                        }`} />
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1.5 pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-bold text-lg transition-colors ${item.completed ? 'text-gray-900' : 'text-gray-500'}`}>{item.title}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${item.completed ? 'bg-green-500' : 'bg-primary-600'
                        }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Milestone CTA */}
          <div className="mt-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl text-white">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-bold text-xl mb-1">Next Milestone</h4>
              <p className="text-primary-100 font-medium">Complete your resume to unlock interview opportunities with top companies.</p>
            </div>
            <button className="px-6 py-3 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-colors whitespace-nowrap shadow-sm active:scale-95">
              Continue Building Resume
            </button>
          </div>
        </div>

        {/* Skills Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-fade-in delay-500">
          <div className="lg:col-span-2 glass-card rounded-3xl p-8 tilt-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl text-gray-900">Skills Progress</h3>
              <button className="text-primary-600 text-sm font-bold hover:underline">View All</button>
            </div>

            <div className="space-y-6">
              {skills.map((skill) => (
                <div key={skill.name} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">{skill.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">{skill.trend}</span>
                      <span className="text-sm font-bold text-gray-900">{skill.level}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-1000 group-hover:bg-primary-500"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="glass-card rounded-3xl p-8 tilt-card h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-7 gap-3 text-center text-sm">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-gray-400 font-bold py-2 text-xs uppercase tracking-wide">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1;
                const isToday = day === new Date().getDate();
                const isValid = day > 0 && day <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                const hasExam = exams.some(e => new Date(e.date).getDate() === day && new Date(e.date).getMonth() === new Date().getMonth());

                return (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-all ${isToday ? 'bg-gray-900 text-white font-bold shadow-lg shadow-gray-200' :
                      hasExam ? 'bg-primary-50 text-primary-700 font-bold border border-primary-100' :
                        isValid ? 'text-gray-700 font-medium hover:bg-gray-50 cursor-pointer' : 'text-gray-300'
                      }`}
                  >
                    {isValid ? day : ''}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                Today
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-3 h-3 bg-primary-50 border border-primary-100 rounded-full"></div>
                Exam Day
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Exams and Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Exam Table */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Exams</h2>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden">
              <DataTable
                columns={examColumns}
                data={exams}
                emptyMessage="No exams scheduled"
              />
            </div>

            {/* Study Support Section */}
            <div className="glass-card rounded-3xl p-8 tilt-card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Study Support</h2>
                <div className="relative">
                  <select
                    className="px-4 py-2.5 pl-10 bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[200px]"
                    onChange={(e) => setSelectedSubject(subjects.find(s => s._id === e.target.value))}
                  >
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                  <BookOpen className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={() => setShowMindMap(!showMindMap)}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                {showMindMap ? 'Hide Mind Map' : 'View Mind Map & Track Progress'}
              </button>
              {showMindMap && selectedSubject && (
                <div className="mt-6 h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                  <MindMapViewer subject={selectedSubject} />
                </div>
              )}
            </div>
          </div>

          {/* Right - Sidebar */}
          <div className="space-y-8">
            {/* Notice Board */}
            <NoticeBoard notices={notices} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
