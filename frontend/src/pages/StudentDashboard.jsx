import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getStudentExams, getEvents, getMySeat, getSubjects,
  getStreak, getSkills, getCareerProgress, updateStreak
} from '../utils/api';
import MindMapViewer from '../components/MindMapViewer';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import NoticeBoard from '../components/NoticeBoard';
import { 
  ClipboardList, Calendar, BookOpen, Award, Download, MapPin, 
  Flame, Trophy, Target, Brain, Sparkles, MessageCircle, 
  ArrowRight, CheckCircle2, Circle, Briefcase, TrendingUp,
  Lightbulb, Zap, Code, Palette, Database, Users
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
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
        
        setExams(examsRes.data);
        setEvents(eventsRes.data);
        setSeats(seatsRes.data);
        setSubjects(subjectsRes.data);
        if (subjectsRes.data.length > 0) setSelectedSubject(subjectsRes.data[0]);

        // Fetch student progress data (streak, skills, career)
        try {
          const [streakRes, skillsRes, careerRes] = await Promise.all([
            getStreak(),
            getSkills(),
            getCareerProgress()
          ]);

          // Update streak and trigger daily streak
          if (streakRes.data) {
            setStreak(streakRes.data.currentStreak || 0);
            // Update streak on login
            await updateStreak();
          }

          // Update skills data
          if (skillsRes.data) {
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

          // Update career progress
          if (careerRes.data) {
            setProfileScore(careerRes.data.profileScore || 0);
            setCareerReadiness(careerRes.data.careerReadiness || 0);
            setActiveGoals(careerRes.data.activeGoals || 0);
            
            // Update career roadmap steps
            if (careerRes.data.roadmapSteps?.length > 0) {
              setCareerRoadmap(careerRes.data.roadmapSteps.map((step, index) => ({
                step: index + 1,
                title: step.title,
                progress: step.progress,
                completed: step.status === 'completed'
              })));
            }
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
    return seats.find(s => s.exam._id === examId || s.exam === examId);
  };

  const examColumns = [
    { header: 'Subject', accessor: 'courseName', render: (row) => (
      <div>
        <p className="font-semibold text-gray-800">{row.courseName}</p>
        <p className="text-xs text-gray-500">{row.courseCode}</p>
      </div>
    )},
    { header: 'Date & Time', render: (row) => (
      <div>
        <p className="font-medium">{new Date(row.date).toLocaleDateString()}</p>
        <p className="text-xs text-gray-500">{row.startTime} - {row.endTime}</p>
      </div>
    )},
    { header: 'Status', render: (row) => (
      row.hallTicketsGenerated ? (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Ready
        </span>
      ) : (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Pending
        </span>
      )
    )},
    { header: 'Seating', render: (row) => {
      const seat = getSeatForExam(row._id);
      return seat ? (
        <div className="flex items-center gap-2 text-primary-600">
          <MapPin size={14} />
          <span>Room {seat.roomNumber}, Seat {seat.seatNumber}</span>
        </div>
      ) : (
        <span className="text-gray-400 italic">Not allocated</span>
      );
    }},
    { header: 'Action', render: (row) => (
      row.hallTicketsGenerated ? (
        <button 
          onClick={() => alert(`Downloading Hall Ticket for ${row.courseName}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Download size={14} />
          Download
        </button>
      ) : null
    )},
  ];

  const notices = events.slice(0, 5).map(e => ({
    title: e.title,
    author: e.coordinator?.name || 'Event Team',
    date: e.date
  }));

  return (
    <DashboardLayout title="Dashboard">
      {/* Top Stats Row - Daily Streak, Skills, Applications, Profile Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Daily Streak Card - Featured with gradient */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Daily Streak</h3>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-bold mb-1">{streak}</p>
          <p className="text-primary-100 text-sm">Days in a row!</p>
        </div>

        {/* Skills Gained */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Skills Gained</h3>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-1">{skillsGained}</p>
          <p className="text-gray-500 text-sm">New skills this month</p>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Exams</h3>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-1">{exams.length}</p>
          <p className="text-gray-500 text-sm">Upcoming exams</p>
        </div>

        {/* Profile Score */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Profile Score</h3>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800 mb-1">{profileScore}%</p>
          <p className="text-gray-500 text-sm">Complete your profile</p>
        </div>
      </div>

      {/* AI-Powered Learning Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">AI-Powered Learning</h2>
          <span className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
            <Zap className="w-3 h-3" />
            New Features
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Twin - Digital Mentor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center relative">
                    <Brain className="w-7 h-7 text-primary-600" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">AI</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">AI Twin</h3>
                    <p className="text-primary-600 text-sm">Your Digital Mentor</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  Advanced Learner
                </span>
              </div>

              {/* Career Readiness */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Career Readiness</span>
                  </div>
                  <span className="text-sm font-bold text-primary-600">{careerReadiness}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${careerReadiness}%` }}
                  />
                </div>
              </div>

              {/* Today's Insight */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Today's Insight</p>
                    <p className="text-sm text-gray-600">Your JavaScript skills have improved 15% this week!</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{activeGoals}</p>
                  <p className="text-xs text-gray-500">Active Goals</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{skillsTracked}+</p>
                  <p className="text-xs text-gray-500">Skills Tracked</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Quick Chat
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Career Lab */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">AI Career Lab</h3>
                    <p className="text-blue-600 text-sm">Explore Career Paths</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Active
                </span>
              </div>

              {/* Exploration Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Exploration Progress</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{exploredCareers.current}/{exploredCareers.total} careers</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(exploredCareers.current / exploredCareers.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Best Performance */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Best Performance</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-gray-800">UX Designer</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">92%</span>
                </div>
                <p className="text-xs text-gray-400 text-right">Score</p>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-primary-600 font-medium mb-1">Recent Activity</p>
                <p className="text-sm text-gray-700">Completed Software Engineer simulation</p>
              </div>

              {/* Suggested Careers */}
              <div>
                <p className="text-sm text-gray-500 mb-3">Suggested Next</p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Code className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-700">Full Stack Dev</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-700">Data Analyst</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Roadmap Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-800">Your Personalized Career Roadmap</h3>
        </div>
        <p className="text-gray-500 text-sm mb-6">Follow these steps to achieve your career goals in your field</p>

        <div className="space-y-6">
          {careerRoadmap.map((item, index) => (
            <div key={item.step} className="flex items-start gap-4">
              {/* Step Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.completed 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="font-bold">{item.step}</span>
                  )}
                </div>
                {index < careerRoadmap.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    item.completed ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-gray-800 mb-2">{item.title}</h4>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.completed ? 'bg-green-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.progress}% complete</p>
              </div>
            </div>
          ))}
        </div>

        {/* Next Milestone CTA */}
        <div className="mt-8 bg-primary-50 rounded-xl p-4 flex items-center gap-4">
          <Trophy className="w-6 h-6 text-primary-600" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">Next Milestone</h4>
            <p className="text-sm text-gray-600">Complete your resume to unlock interview opportunities with top companies.</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
            Continue Building Resume
          </button>
        </div>
      </div>

      {/* Skills Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Skills Progress</h3>
            <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
          </div>

          <div className="space-y-5">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">{skill.trend}</span>
                    <span className="text-sm font-bold text-gray-800">{skill.level}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-gray-400 font-medium py-2">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1;
              const isToday = day === new Date().getDate();
              const isValid = day > 0 && day <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
              const hasExam = exams.some(e => new Date(e.date).getDate() === day && new Date(e.date).getMonth() === new Date().getMonth());
              
              return (
                <div 
                  key={i} 
                  className={`py-2 rounded-lg text-sm ${
                    isToday ? 'bg-primary-600 text-white font-bold' : 
                    hasExam ? 'bg-primary-100 text-primary-700 font-medium' :
                    isValid ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'
                  }`}
                >
                  {isValid ? day : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid - Exams and Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Exam Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Upcoming Exams</h2>
          </div>
          
          <DataTable 
            columns={examColumns} 
            data={exams} 
            emptyMessage="No exams scheduled" 
          />

          {/* Study Support Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Study Support</h2>
              <select 
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={(e) => setSelectedSubject(subjects.find(s => s._id === e.target.value))}
              >
                {subjects.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setShowMindMap(!showMindMap)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              {showMindMap ? 'Hide Mind Map' : 'View Mind Map & Track Progress'}
            </button>
            {showMindMap && selectedSubject && (
              <div className="mt-4 h-[500px] bg-gray-50 rounded-xl overflow-hidden">
                <MindMapViewer subject={selectedSubject} />
              </div>
            )}
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-6">
          {/* Notice Board */}
          <NoticeBoard notices={notices} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
