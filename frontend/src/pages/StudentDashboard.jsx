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
import {
  ClipboardList, Calendar, BookOpen, Award, Download, MapPin,
  Flame, Trophy, Target, Brain, Sparkles, MessageCircle,
  ArrowRight, CheckCircle, Briefcase, TrendingUp,
  Lightbulb, Zap, Code, Users, GraduationCap, Clock,
  ChevronRight, Star, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

// Premium Animated Counter - Smooth count-up with easing
const AnimatedNumber = ({ value, suffix = '', prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const duration = 600;
    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newVal = start + (end - start) * eased;
      setDisplayValue(suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value, suffix]);

  return <span className="tabular-nums tracking-tight">{prefix}{displayValue}{suffix}</span>;
};

// Progress Ring Component
const ProgressRing = ({ percentage, size = 56, strokeWidth = 4, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-zinc-700">{percentage}%</span>
      </div>
    </div>
  );
};

// Skeleton Loader
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-5 border border-zinc-100 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="w-9 h-9 bg-zinc-100 rounded-lg" />
      <div className="w-12 h-4 bg-zinc-100 rounded" />
    </div>
    <div className="w-20 h-3 bg-zinc-100 rounded mb-2" />
    <div className="w-16 h-8 bg-zinc-100 rounded" />
  </div>
);

const StudentDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
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
  const [skills, setSkills] = useState([]);
  const [careerRoadmap, setCareerRoadmap] = useState([
    { step: 1, title: 'Complete Profile', progress: 0, completed: false },
    { step: 2, title: 'Skill Assessment', progress: 0, completed: false },
    { step: 3, title: 'Resume Building', progress: 0, completed: false },
    { step: 4, title: 'Interview Prep', progress: 0, completed: false },
    { step: 5, title: 'Job Applications', progress: 0, completed: false },
  ]);

  const pageRef = useRef(null);

  // GSAP Entry Animations
  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      gsap.fromTo('.section-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, delay: 0.2, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [examsRes, eventsRes, seatsRes, subjectsRes] = await Promise.all([
          getStudentExams(),
          getEvents('Approved'),
          getMySeat(),
          getSubjects()
        ]);

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

        try {
          const [streakRes, skillsRes, careerRes, approvalRes] = await Promise.all([
            getStreak().catch(() => ({ data: null })),
            getSkills().catch(() => ({ data: null })),
            getCareerProgress().catch(() => ({ data: null })),
            getMyApprovalStatus().catch(() => ({ data: {} }))
          ]);

          if (streakRes?.data) {
            setStreak(streakRes.data.currentStreak || 0);
            await updateStreak();
          }

          if (skillsRes?.data) {
            setSkillsGained(skillsRes.data.totalSkills || 0);
            setSkillsTracked(skillsRes.data.skills?.length || 0);
            const formattedSkills = (skillsRes.data.skills || []).slice(0, 4).map(skill => ({
              name: skill.name,
              level: skill.progress || 0,
              trend: `+${Math.floor(Math.random() * 15) + 1}%`
            }));
            setSkills(formattedSkills.length > 0 ? formattedSkills : [
              { name: 'JavaScript', level: 0, trend: '+0%' },
              { name: 'React', level: 0, trend: '+0%' },
              { name: 'Python', level: 0, trend: '+0%' },
              { name: 'SQL', level: 0, trend: '+0%' },
            ]);
          }

          if (careerRes?.data) {
            setProfileScore(careerRes.data.profileScore || 0);
            setCareerReadiness(careerRes.data.careerReadiness || 0);
            setActiveGoals(careerRes.data.activeGoals || 0);
          }

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
          console.log('Progress data not available:', progressError.message);
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

  const getSeatForExam = (examId) => seats.find(s => s?.exam?._id === examId || s?.exam === examId);

  const notices = events.slice(0, 5).map(e => ({
    title: e.title,
    author: e.coordinator?.name || 'Event Team',
    date: e.date
  }));

  const completedSteps = careerRoadmap.filter(s => s.completed).length;
  const overallProgress = Math.round((completedSteps / careerRoadmap.length) * 100);

  return (
    <DashboardLayout title="Dashboard">
      <div ref={pageRef} className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                {user?.name?.split(' ')[0]} 👋
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </div>
              <span className="text-xs text-zinc-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</>
          ) : (
            <>
              {/* Daily Streak */}
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Flame className="w-4.5 h-4.5 text-orange-500" />
                  </div>
                  {streak > 7 && (
                    <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">🔥 Hot!</span>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Daily Streak</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={streak} /> <span className="text-sm font-normal text-zinc-400">days</span>
                </p>
              </div>

              {/* Skills Gained */}
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Award className="w-4.5 h-4.5 text-violet-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Skills Gained</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={skillsGained} />
                </p>
              </div>

              {/* Upcoming Exams */}
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ClipboardList className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  {exams.length > 0 && (
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Upcoming</span>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Exams</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={exams.length} />
                </p>
              </div>

              {/* Profile Score */}
              <div className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Profile Score</p>
                <p className="text-2xl font-semibold text-zinc-900">
                  <AnimatedNumber value={profileScore} suffix="%" />
                </p>
                <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${profileScore}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Twin & Career Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Twin Card */}
            <div className="section-card bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900">AI Twin</h3>
                      <p className="text-sm text-violet-600">Your Digital Mentor</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                </div>

                {/* Career Readiness */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600">Career Readiness</span>
                    <span className="text-sm font-semibold text-violet-600">{careerReadiness}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${careerReadiness}%` }} />
                  </div>
                </div>

                {/* Today's Insight */}
                <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900 mb-0.5">Today's Insight</p>
                      <p className="text-xs text-zinc-600">Your JavaScript skills improved 15% this week! Consider taking the advanced assessment.</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-zinc-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-zinc-900">{activeGoals}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Active Goals</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-semibold text-violet-600">{skillsTracked}+</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Skills Tracked</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Quick Chat
                  </button>
                  <button
                    onClick={() => navigate('/student/ai-twin')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Career Roadmap */}
            <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Career Roadmap</h3>
                    <p className="text-xs text-zinc-500">{completedSteps} of {careerRoadmap.length} steps completed</p>
                  </div>
                </div>
                <ProgressRing percentage={overallProgress} size={48} strokeWidth={4} />
              </div>

              <div className="space-y-3">
                {careerRoadmap.map((step, index) => (
                  <div key={step.step} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${step.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
                      }`}>
                      {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${step.completed ? 'text-zinc-900' : 'text-zinc-500'}`}>{step.title}</p>
                    </div>
                    <div className="w-20">
                      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${step.completed ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${step.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-zinc-400 w-8">{step.progress}%</span>
                  </div>
                ))}
              </div>

              {/* Next Milestone CTA */}
              <div className="mt-6 bg-gradient-to-r from-violet-600 to-violet-500 rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Next: Complete your resume</p>
                  <p className="text-xs text-violet-200">Unlock interview opportunities</p>
                </div>
                <button className="px-4 py-2 bg-white text-violet-600 rounded-lg text-xs font-medium hover:bg-violet-50 transition-colors">
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Skills Progress */}
            <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-zinc-900">Skills Progress</h3>
                <button className="text-xs text-violet-600 font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-zinc-700">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{skill.trend}</span>
                        <span className="text-xs font-medium text-zinc-600">{skill.level}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${skill.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
              <h3 className="font-semibold text-zinc-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'View Courses', icon: BookOpen, path: '/student/courses', color: 'violet' },
                  { label: 'Career Portal', icon: Briefcase, path: '/student/career', color: 'blue' },
                  { label: 'Study Support', icon: GraduationCap, path: '/student/study', color: 'emerald' },
                  { label: 'Hall Tickets', icon: ClipboardList, path: '/student/hall-tickets', color: 'amber' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${action.color}-50 flex items-center justify-center`}>
                      <action.icon className={`w-4 h-4 text-${action.color}-500`} />
                    </div>
                    <span className="flex-1 text-sm text-zinc-700 text-left">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900">
                  {new Date().toLocaleString('default', { month: 'long' })}
                </h3>
                <Calendar className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-zinc-400 font-medium py-1">{day}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1;
                  const isToday = day === new Date().getDate();
                  const isValid = day > 0 && day <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                  const hasExam = exams.some(e => new Date(e.date).getDate() === day && new Date(e.date).getMonth() === new Date().getMonth());

                  return (
                    <div
                      key={i}
                      className={`aspect-square flex items-center justify-center rounded-md text-xs transition-all ${isToday ? 'bg-zinc-900 text-white font-medium' :
                          hasExam ? 'bg-violet-50 text-violet-700 font-medium' :
                            isValid ? 'text-zinc-600 hover:bg-zinc-50' : 'text-zinc-300'
                        }`}
                    >
                      {isValid ? day : ''}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-zinc-900 rounded" />
                  Today
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-violet-50 border border-violet-200 rounded" />
                  Exam Day
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Exams & Study Support */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Exams */}
          <div className="lg:col-span-2 section-card bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="p-5 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Upcoming Exams</h3>
                <span className="text-xs text-zinc-500">{exams.length} scheduled</span>
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {exams.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500">No exams scheduled</p>
                </div>
              ) : (
                exams.slice(0, 5).map((exam) => {
                  const seat = getSeatForExam(exam._id);
                  return (
                    <div key={exam._id} className="p-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900">{exam.courseName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(exam.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exam.startTime}
                            </span>
                            {seat && (
                              <span className="text-xs text-violet-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Room {seat.roomNumber}, Seat {seat.seatNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exam.hallTicketsGenerated ? (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Ready</span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded">Pending</span>
                          )}
                          {exam.hallTicketsGenerated && (
                            <button className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notice Board / Study Support */}
          <div className="section-card bg-white rounded-xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-zinc-900">Study Support</h3>
            </div>
            <div className="relative mb-4">
              <select
                className="w-full px-4 py-2.5 pl-10 bg-zinc-50 border border-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300"
                onChange={(e) => setSelectedSubject(subjects.find(s => s._id === e.target.value))}
              >
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
              <BookOpen className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowMindMap(!showMindMap)}
              className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-lg text-sm text-zinc-500 font-medium hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {showMindMap ? 'Hide Mind Map' : 'View Mind Map'}
            </button>
            {showMindMap && selectedSubject && (
              <div className="mt-4 h-[300px] bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100">
                <MindMapViewer subject={selectedSubject} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
