import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
  getCareerProgress, updateCareerProgress, getSkills, updateSkill,
  submitCareerApproval, getMyApprovalStatus
} from '../../utils/api';
import {
  Briefcase, Target, Award, TrendingUp, CheckCircle, Circle,
  Sparkles, Code, Users, Brain, Plus, Trash2, X,
  User, ClipboardCheck, FileCheck, MessageSquare, Send,
  Clock, AlertCircle, Lock
} from 'lucide-react';

import { useSocket } from '../../context/SocketContext';

const StudentCareer = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('roadmap');
  const [loading, setLoading] = useState(true);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', category: 'Technical', deadline: '' });
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Technical' });

  const [approvalStatus, setApprovalStatus] = useState({});
  const [skills, setSkills] = useState([]);
  const [goals, setGoals] = useState([]);

  const roadmapSteps = [
    {
      id: 1,
      title: 'Complete Your Profile',
      description: 'Add your education, skills, and experience to your profile',
      icon: User,
      requirements: [
        'Upload profile photo',
        'Fill in all personal details',
        'Add education history',
        'Add at least 5 skills',
        'Write a bio/about section'
      ]
    },
    {
      id: 2,
      title: 'Skill Assessment',
      description: 'Complete assessments to validate and showcase your skills',
      icon: ClipboardCheck,
      requirements: [
        'Complete aptitude test',
        'Pass technical MCQ assessment',
        'Complete communication skills evaluation',
        'Pass logical reasoning test',
        'Complete coding challenge'
      ]
    },
    {
      id: 3,
      title: 'Build Your Resume',
      description: 'Create a professional resume that stands out',
      icon: FileCheck,
      requirements: [
        'Create resume using approved template',
        'Add all work experiences',
        'Include project descriptions',
        'Add certifications and achievements',
        'Get resume reviewed by mentor'
      ]
    },
    {
      id: 4,
      title: 'Interview Preparation',
      description: 'Practice and prepare for technical and HR interviews',
      icon: MessageSquare,
      requirements: [
        'Complete mock interview sessions',
        'Practice technical questions (50+)',
        'Prepare behavioral/HR answers',
        'Participate in group discussions',
        'Get feedback from career counselor'
      ]
    },
    {
      id: 5,
      title: 'Apply for Jobs',
      description: 'Start applying to your dream companies',
      icon: Send,
      requirements: [
        'Research and shortlist target companies',
        'Customize resume for each role',
        'Submit applications through portal',
        'Track application status',
        'Follow up on applications'
      ]
    },
  ];

  const recommendedPaths = [
    { id: 1, title: 'Full Stack Developer', match: 92, skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], avgSalary: '12-18 LPA', demand: 'High' },
    { id: 2, title: 'Data Scientist', match: 78, skills: ['Python', 'ML', 'Statistics', 'SQL'], avgSalary: '10-20 LPA', demand: 'Very High' },
    { id: 3, title: 'DevOps Engineer', match: 65, skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'], avgSalary: '12-22 LPA', demand: 'High' },
  ];

  useEffect(() => {
    fetchCareerData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('career_approval_updated', () => {
      fetchCareerData();
    });

    return () => {
      socket.off('career_approval_updated');
    };
  }, [socket]);

  const fetchCareerData = async () => {
    try {
      setLoading(true);
      const [careerRes, skillsRes, approvalRes] = await Promise.all([
        getCareerProgress().catch(() => null),
        getSkills().catch(() => null),
        getMyApprovalStatus().catch(() => null)
      ]);

      if (careerRes?.data?.goals) setGoals(careerRes.data.goals);
      if (skillsRes?.data?.skills) setSkills(skillsRes.data.skills);
      if (approvalRes?.data) setApprovalStatus(approvalRes.data);
    } catch (error) {
      console.error('Error fetching career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId) => {
    const approval = approvalStatus[stepId];
    if (approval?.status === 'approved') return 'approved';
    if (approval?.status === 'pending') return 'pending';
    if (approval?.status === 'rejected') return 'rejected';
    if (stepId === 1) return 'available';
    const prevApproval = approvalStatus[stepId - 1];
    if (prevApproval?.status === 'approved') return 'available';
    return 'locked';
  };

  const getCompletedStepsCount = () => {
    return Object.values(approvalStatus).filter(a => a?.status === 'approved').length;
  };

  const handleRequestApproval = async () => {
    if (!selectedStep) return;
    setSubmitting(true);
    try {
      await submitCareerApproval({
        step: selectedStep.id,
        stepTitle: selectedStep.title,
        requestMessage
      });
      const { data } = await getMyApprovalStatus();
      setApprovalStatus(data);
      setShowRequestModal(false);
      setSelectedStep(null);
      setRequestMessage('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const openRequestModal = (step) => {
    setSelectedStep(step);
    setRequestMessage('');
    setShowRequestModal(true);
  };

  const handleAddSkill = async () => {
    if (!newSkill.name) return;
    const skill = { id: Date.now(), ...newSkill, trend: '+0%' };
    setSkills([...skills, skill]);
    setShowAddSkillModal(false);
    setNewSkill({ name: '', level: 50, category: 'Technical' });
    try {
      await updateSkill({ skillName: newSkill.name, level: newSkill.level, category: newSkill.category });
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleUpdateSkillLevel = async (skillId, newLevel) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    const oldLevel = skill.level;
    const trend = newLevel > oldLevel ? `+${newLevel - oldLevel}%` : `${newLevel - oldLevel}%`;
    setSkills(skills.map(s => s.id === skillId ? { ...s, level: newLevel, trend } : s));
    try {
      await updateSkill({ skillName: skill.name, level: newLevel });
    } catch (error) {
      console.error('Error updating skill:', error);
    }
  };

  const handleDeleteSkill = (skillId) => {
    setSkills(skills.filter(s => s.id !== skillId));
  };

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.deadline) return;
    const goal = { id: Date.now(), ...newGoal, progress: 0, status: 'In Progress' };
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    setShowAddGoalModal(false);
    setNewGoal({ title: '', category: 'Technical', deadline: '' });
    try {
      await updateCareerProgress({ goals: updatedGoals });
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleUpdateGoalProgress = async (goalId, newProgress) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, progress: newProgress, status: newProgress >= 100 ? 'Completed' : 'In Progress' } : goal
    );
    setGoals(updatedGoals);
    try {
      await updateCareerProgress({ goals: updatedGoals });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    try {
      await updateCareerProgress({ goals: updatedGoals });
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Technical': return <Code className="w-4 h-4" />;
      case 'Soft Skills': return <Users className="w-4 h-4" />;
      case 'Projects': return <Briefcase className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'roadmap', label: 'Career Roadmap', icon: Target },
    { id: 'skills', label: 'Skills Tracker', icon: Brain },
    { id: 'goals', label: 'My Goals', icon: Sparkles },
    { id: 'paths', label: 'Career Paths', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Career Development">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Career Development">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-4 sm:p-5 text-white shadow-lg shadow-primary-900/20 border border-primary-500/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-primary-100 text-xs sm:text-sm font-medium uppercase tracking-wide">Steps Completed</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-white drop-shadow-sm"><AnimatedNumber value={getCompletedStepsCount()} />/5</p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Award className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 bg-black/20 rounded-full h-2 overflow-hidden border border-white/10">
              <div className="bg-white rounded-full h-2 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(getCompletedStepsCount() / 5) * 100}%` }}></div>
            </div>
          </div>

          <div className="glass-card-dark rounded-xl p-4 sm:p-5 tilt-card border border-dark-700 shadow-xl group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-xs sm:text-sm font-bold uppercase tracking-wide">Career Ready</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 drop-shadow-sm"><AnimatedNumber value={Math.round((getCompletedStepsCount() / 5) * 100)} suffix="%" /></p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="glass-card-dark rounded-xl p-4 sm:p-5 tilt-card border border-dark-700 shadow-xl group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-xs sm:text-sm font-bold uppercase tracking-wide">Skills Added</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 drop-shadow-sm"><AnimatedNumber value={skills.length} /></p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card-dark rounded-xl p-5 tilt-card border border-dark-700 shadow-xl group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm font-bold uppercase tracking-wide">Active Goals</p>
                <p className="text-3xl font-bold text-white mt-1 drop-shadow-sm"><AnimatedNumber value={goals.filter(g => g.status === 'In Progress').length} /></p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card-dark rounded-xl tilt-card border border-dark-700 shadow-xl overflow-hidden">
          <div className="border-b border-dark-700 bg-dark-800/30">
            <div className="flex overflow-x-auto custom-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                    : 'border-transparent text-dark-400 hover:text-white hover:bg-dark-700/50'
                    }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-dark-500'}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-dark-900/40">
            {/* Career Roadmap Tab */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Career Roadmap</h3>
                  <p className="text-sm text-dark-400 font-medium">Complete each step and request admin approval to unlock the next</p>
                </div>

                <div className="space-y-4">
                  {roadmapSteps.map((step) => {
                    const status = getStepStatus(step.id);
                    const approval = approvalStatus[step.id];

                    return (
                      <div
                        key={step.id}
                        className={`rounded-xl border p-6 transition-all ${status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/5' :
                          status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' :
                            status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                              status === 'available' ? 'border-primary-500/30 bg-primary-500/5 hover:border-primary-500/50' :
                                'border-dark-700 bg-dark-800/20 opacity-60'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-lg ${status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                              status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                status === 'available' ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' :
                                  'bg-dark-800 border-dark-700 text-dark-500'
                            }`}>
                            {status === 'approved' ? <CheckCircle className="w-6 h-6" /> :
                              status === 'locked' ? <Lock className="w-5 h-5" /> :
                                status === 'pending' ? <Clock className="w-5 h-5" /> :
                                  status === 'rejected' ? <AlertCircle className="w-5 h-5" /> :
                                    <step.icon className="w-6 h-6" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-white text-lg">{step.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    status === 'available' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' :
                                      'bg-dark-800 text-dark-400 border-dark-700'
                                }`}>
                                {status === 'approved' ? 'Approved' :
                                  status === 'pending' ? 'Pending Approval' :
                                    status === 'rejected' ? 'Rejected' :
                                      status === 'available' ? 'Available' : 'Locked'}
                              </span>
                            </div>
                            <p className="text-sm text-dark-300 mb-4 font-medium leading-relaxed">{step.description}</p>

                            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4 mb-4">
                              <p className="text-sm font-bold text-dark-200 mb-2 uppercase tracking-wide">Requirements to complete:</p>
                              <ul className="space-y-1">
                                {step.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-dark-400 font-medium">
                                    <Circle className="w-1.5 h-1.5 text-dark-500 fill-current" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {status === 'rejected' && approval?.adminComment && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                <p className="text-sm font-bold text-red-400 mb-1">Admin Feedback:</p>
                                <p className="text-sm text-red-300 font-medium">{approval.adminComment}</p>
                              </div>
                            )}

                            {(status === 'available' || status === 'rejected') && (
                              <button
                                onClick={() => openRequestModal(step)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 font-bold text-sm"
                              >
                                <Send className="w-4 h-4" />
                                {status === 'rejected' ? 'Re-submit Request' : 'Request Approval'}
                              </button>
                            )}

                            {status === 'pending' && (
                              <p className="text-sm text-amber-500 font-bold flex items-center gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 w-fit text-amber-400">
                                <Clock className="w-4 h-4" />
                                Waiting for admin to review your request...
                              </p>
                            )}

                            {status === 'locked' && (
                              <p className="text-sm text-dark-500 font-medium flex items-center gap-2 bg-dark-800/50 p-2 rounded-lg border border-dark-700 w-fit">
                                <Lock className="w-4 h-4" />
                                Complete previous steps to unlock
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Skills Tracker</h3>
                    <p className="text-sm text-dark-400 font-medium">Add and track your technical and soft skills</p>
                  </div>
                  <button onClick={() => setShowAddSkillModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 shadow-lg shadow-primary-500/20 font-bold text-sm transition-all">
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </button>
                </div>

                {skills.length === 0 ? (
                  <div className="text-center py-12 bg-dark-800/30 rounded-xl border border-dark-700 border-dashed">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                    <p className="font-bold text-white text-lg">No skills added yet</p>
                    <p className="text-sm text-dark-400 mb-4 font-medium">Start tracking your skills by adding them</p>
                    <button onClick={() => setShowAddSkillModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 shadow-lg shadow-primary-500/20 font-bold text-sm transition-all">
                      Add Your First Skill
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="bg-dark-800/40 rounded-xl p-4 hover:bg-dark-800/80 transition-all border border-dark-700 hover:border-primary-500/30 group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${skill.category === 'Technical' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
                              {skill.category === 'Technical' ? <Code className="w-5 h-5 text-blue-400" /> : <Users className="w-5 h-5 text-purple-400" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{skill.name}</h4>
                              <p className="text-xs text-dark-400 font-medium">{skill.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${skill.trend?.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{skill.trend}</span>
                            <button onClick={() => handleDeleteSkill(skill.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors border border-transparent hover:border-red-500/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-dark-700/50 rounded-full h-2 border border-dark-600">
                          <div className="bg-gradient-to-r from-primary-600 to-primary-400 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(var(--primary-500),0.3)]" style={{ width: `${skill.level}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-sm">
                          <span className="text-dark-500 font-medium uppercase tracking-wider text-xs">Proficiency</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{skill.level}%</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateSkillLevel(skill.id, Math.max(0, skill.level - 5))} className="w-6 h-6 flex items-center justify-center bg-dark-700 hover:bg-dark-600 rounded text-xs text-dark-300 font-bold border border-dark-600 transition-colors">-5</button>
                              <button onClick={() => handleUpdateSkillLevel(skill.id, Math.min(100, skill.level + 5))} className="w-6 h-6 flex items-center justify-center bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 rounded text-xs font-bold border border-primary-500/30 transition-colors">+5</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">My Career Goals</h3>
                    <p className="text-sm text-dark-400 font-medium">Set and track your personal career development goals</p>
                  </div>
                  <button onClick={() => setShowAddGoalModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 shadow-lg shadow-primary-500/20 font-bold text-sm transition-all">
                    <Plus className="w-4 h-4" />
                    Add Goal
                  </button>
                </div>

                {goals.length === 0 ? (
                  <div className="text-center py-12 bg-dark-800/30 rounded-xl border border-dark-700 border-dashed">
                    <Target className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                    <p className="font-bold text-white text-lg">No goals set yet</p>
                    <p className="text-sm text-dark-400 mb-4 font-medium">Define your career goals to stay focused</p>
                    <button onClick={() => setShowAddGoalModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 shadow-lg shadow-primary-500/20 font-bold text-sm transition-all">
                      Add Your First Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="bg-dark-800/40 rounded-xl p-5 hover:bg-dark-800/80 transition-all border border-dark-700 hover:border-primary-500/30 hover:shadow-lg group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${goal.category === 'Technical' ? 'bg-blue-500/10 border-blue-500/20' : goal.category === 'Projects' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-purple-500/10 border-purple-500/20'
                              }`}>
                              {getCategoryIcon(goal.category)}
                              {goal.category === 'Technical' && <span className="sr-only">Technical</span>}
                              {goal.category === 'Projects' && <span className="sr-only">Projects</span>}
                              {goal.category !== 'Technical' && goal.category !== 'Projects' && <span className="sr-only">{goal.category}</span>}
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{goal.title}</h4>
                              <p className="text-xs text-dark-400 font-medium">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${goal.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                              {goal.status}
                            </span>
                            <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors border border-transparent hover:border-red-500/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-dark-700/50 rounded-full h-2 mb-3 border border-dark-600">
                          <div className={`h-2 rounded-full transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)] ${goal.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary-600'}`} style={{ width: `${goal.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-dark-500 font-medium uppercase tracking-wider text-xs">Progress</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">{goal.progress}%</span>
                            {goal.status !== 'Completed' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleUpdateGoalProgress(goal.id, Math.max(0, goal.progress - 10))} className="w-6 h-6 flex items-center justify-center bg-dark-700 hover:bg-dark-600 rounded text-xs text-dark-300 font-bold border border-dark-600 transition-colors">-10</button>
                                <button onClick={() => handleUpdateGoalProgress(goal.id, Math.min(100, goal.progress + 10))} className="w-6 h-6 flex items-center justify-center bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 rounded text-xs font-bold border border-primary-500/30 transition-colors">+10</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Career Paths Tab */}
            {activeTab === 'paths' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Recommended Career Paths</h3>
                  <p className="text-sm text-dark-400 font-medium">Based on your skills and interests</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedPaths.map((path) => (
                    <div key={path.id} className="glass-card-dark rounded-xl p-5 hover:shadow-xl transition-all border border-dark-700 hover:border-primary-500/30 group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600/20 to-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/30 transition-colors">
                          <Briefcase className="w-6 h-6 text-primary-400 group-hover:text-primary-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-400">{path.match}%</p>
                          <p className="text-xs text-dark-400 font-bold uppercase tracking-wide">Match</p>
                        </div>
                      </div>
                      <h4 className="font-bold text-white mb-3 text-lg">{path.title}</h4>
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2 text-sm bg-dark-800/50 p-2 rounded-lg border border-dark-700/50">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-dark-300 font-medium">Demand: <span className="text-emerald-400 font-bold">{path.demand}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-dark-800/50 p-2 rounded-lg border border-dark-700/50">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span className="text-dark-300 font-medium">Salary: <span className="text-amber-400 font-bold">{path.avgSalary}</span></span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {path.skills?.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-dark-800 rounded-md text-xs text-dark-300 border border-dark-700 font-medium">{skill}</span>
                        ))}
                      </div>
                      <button className="w-full py-2.5 bg-dark-800 hover:bg-primary-600 text-primary-400 hover:text-white font-bold rounded-lg transition-all border border-dark-700 hover:border-primary-500 shadow-sm hover:shadow-lg hover:shadow-primary-500/20">
                        Explore Path →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Approval Modal */}
      <Modal
        isOpen={showRequestModal && selectedStep}
        onClose={() => setShowRequestModal(false)}
        title="Request Approval"
        size="md"
      >
        {selectedStep && (
          <>
            <p className="text-sm text-dark-400 mb-6 -mt-4 font-medium">{selectedStep.title}</p>
            <div className="space-y-4">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                <p className="text-sm text-primary-400 font-medium">
                  By submitting this request, you confirm that you have completed all the requirements for this step.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-dark-300 mb-1">Message to Admin (Optional)</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-white placeholder-dark-500 h-24 resize-none transition-all"
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-700 mt-2">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2.5 bg-dark-800 text-dark-300 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestApproval}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20 transition-all"
                >
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Submitting...</> : <><Send className="w-4 h-4" />Submit</>}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Add Skill Modal */}
      <Modal
        isOpen={showAddSkillModal}
        onClose={() => setShowAddSkillModal(false)}
        title="Add New Skill"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Skill Name *</label>
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-white placeholder-dark-500 transition-all"
              placeholder="e.g., Python, React"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Category</label>
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
            >
              <option className="bg-dark-800">Technical</option>
              <option className="bg-dark-800">Soft Skills</option>
              <option className="bg-dark-800">Tools</option>
              <option className="bg-dark-800">Languages</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Initial Proficiency: {newSkill.level}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={newSkill.level}
              onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-dark-700 mt-2">
            <button
              onClick={() => setShowAddSkillModal(false)}
              className="flex-1 px-4 py-2.5 bg-dark-800 text-dark-300 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSkill}
              disabled={!newSkill.name}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 font-bold shadow-lg shadow-primary-500/20 transition-all"
            >
              Add Skill
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        title="Add New Goal"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Goal Title *</label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-white placeholder-dark-500 transition-all"
              placeholder="e.g., Learn React Native"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Category</label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
            >
              <option className="bg-dark-800">Technical</option>
              <option className="bg-dark-800">Soft Skills</option>
              <option className="bg-dark-800">Projects</option>
              <option className="bg-dark-800">Certifications</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-dark-300 mb-1">Deadline *</label>
            <input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-lg text-white appearance-none transition-all min-h-[46px] color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-dark-700 mt-2">
            <button
              onClick={() => setShowAddGoalModal(false)}
              className="flex-1 px-4 py-2.5 bg-dark-800 text-dark-300 border border-dark-700 rounded-lg hover:bg-dark-700 hover:text-white font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGoal}
              disabled={!newGoal.title || !newGoal.deadline}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 font-bold shadow-lg shadow-primary-500/20 transition-all"
            >
              Add Goal
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default StudentCareer;
