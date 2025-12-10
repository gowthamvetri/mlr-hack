import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
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

const StudentCareer = () => {
  const { user } = useAuth();
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
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Career Development">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm">Steps Completed</p>
                <p className="text-3xl font-bold mt-1">{getCompletedStepsCount()}/5</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: `${(getCompletedStepsCount() / 5) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Career Readiness</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{Math.round((getCompletedStepsCount() / 5) * 100)}%</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Skills Added</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{skills.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Goals</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{goals.filter(g => g.status === 'In Progress').length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Career Roadmap Tab */}
            {activeTab === 'roadmap' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Career Roadmap</h3>
                  <p className="text-sm text-gray-500">Complete each step and request admin approval to unlock the next</p>
                </div>

                <div className="space-y-4">
                  {roadmapSteps.map((step) => {
                    const status = getStepStatus(step.id);
                    const approval = approvalStatus[step.id];
                    
                    return (
                      <div 
                        key={step.id} 
                        className={`rounded-xl border-2 p-6 transition-all ${
                          status === 'approved' ? 'border-green-200 bg-green-50' :
                          status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                          status === 'rejected' ? 'border-red-200 bg-red-50' :
                          status === 'available' ? 'border-primary-200 bg-white hover:shadow-md' :
                          'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            status === 'approved' ? 'bg-green-500' :
                            status === 'pending' ? 'bg-yellow-500' :
                            status === 'rejected' ? 'bg-red-500' :
                            status === 'available' ? 'bg-primary-600' :
                            'bg-gray-300'
                          }`}>
                            {status === 'approved' ? <CheckCircle className="w-6 h-6 text-white" /> :
                             status === 'locked' ? <Lock className="w-5 h-5 text-white" /> :
                             status === 'pending' ? <Clock className="w-5 h-5 text-white" /> :
                             status === 'rejected' ? <AlertCircle className="w-5 h-5 text-white" /> :
                             <step.icon className="w-6 h-6 text-white" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-800">{step.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                status === 'approved' ? 'bg-green-100 text-green-700' :
                                status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                status === 'rejected' ? 'bg-red-100 text-red-700' :
                                status === 'available' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {status === 'approved' ? 'Approved' :
                                 status === 'pending' ? 'Pending Approval' :
                                 status === 'rejected' ? 'Rejected' :
                                 status === 'available' ? 'Available' : 'Locked'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{step.description}</p>

                            <div className="bg-white/50 rounded-lg p-4 mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Requirements to complete:</p>
                              <ul className="space-y-1">
                                {step.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <Circle className="w-2 h-2 text-gray-400" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {status === 'rejected' && approval?.adminComment && (
                              <div className="bg-red-100 rounded-lg p-3 mb-4">
                                <p className="text-sm font-medium text-red-700">Admin Feedback:</p>
                                <p className="text-sm text-red-600">{approval.adminComment}</p>
                              </div>
                            )}

                            {(status === 'available' || status === 'rejected') && (
                              <button
                                onClick={() => openRequestModal(step)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <Send className="w-4 h-4" />
                                {status === 'rejected' ? 'Re-submit Request' : 'Request Approval'}
                              </button>
                            )}

                            {status === 'pending' && (
                              <p className="text-sm text-yellow-700 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Waiting for admin to review your request...
                              </p>
                            )}

                            {status === 'locked' && (
                              <p className="text-sm text-gray-500 flex items-center gap-2">
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
                    <h3 className="text-lg font-bold text-gray-800">Skills Tracker</h3>
                    <p className="text-sm text-gray-500">Add and track your technical and soft skills</p>
                  </div>
                  <button onClick={() => setShowAddSkillModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </button>
                </div>

                {skills.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No skills added yet</p>
                    <p className="text-sm text-gray-500 mb-4">Start tracking your skills by adding them</p>
                    <button onClick={() => setShowAddSkillModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Add Your First Skill
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${skill.category === 'Technical' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                              {skill.category === 'Technical' ? <Code className="w-5 h-5 text-blue-600" /> : <Users className="w-5 h-5 text-purple-600" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">{skill.name}</h4>
                              <p className="text-xs text-gray-500">{skill.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${skill.trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{skill.trend}</span>
                            <button onClick={() => handleDeleteSkill(skill.id)} className="p-1 hover:bg-red-100 rounded text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${skill.level}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-500">Proficiency</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{skill.level}%</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateSkillLevel(skill.id, Math.max(0, skill.level - 5))} className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs">-5</button>
                              <button onClick={() => handleUpdateSkillLevel(skill.id, Math.min(100, skill.level + 5))} className="px-2 py-0.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-xs">+5</button>
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
                    <h3 className="text-lg font-bold text-gray-800">My Career Goals</h3>
                    <p className="text-sm text-gray-500">Set and track your personal career development goals</p>
                  </div>
                  <button onClick={() => setShowAddGoalModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Plus className="w-4 h-4" />
                    Add Goal
                  </button>
                </div>

                {goals.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No goals set yet</p>
                    <p className="text-sm text-gray-500 mb-4">Define your career goals to stay focused</p>
                    <button onClick={() => setShowAddGoalModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      Add Your First Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              goal.category === 'Technical' ? 'bg-blue-100' : goal.category === 'Projects' ? 'bg-green-100' : 'bg-purple-100'
                            }`}>
                              {getCategoryIcon(goal.category)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">{goal.title}</h4>
                              <p className="text-xs text-gray-500">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${goal.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {goal.status}
                            </span>
                            <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 hover:bg-red-100 rounded text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 mb-2">
                          <div className={`h-2 rounded-full ${goal.status === 'Completed' ? 'bg-green-500' : 'bg-primary-600'}`} style={{ width: `${goal.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Progress</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{goal.progress}%</span>
                            {goal.status !== 'Completed' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleUpdateGoalProgress(goal.id, Math.max(0, goal.progress - 10))} className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs">-10</button>
                                <button onClick={() => handleUpdateGoalProgress(goal.id, Math.min(100, goal.progress + 10))} className="px-2 py-0.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-xs">+10</button>
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
                  <h3 className="text-lg font-bold text-gray-800">Recommended Career Paths</h3>
                  <p className="text-sm text-gray-500">Based on your skills and interests</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedPaths.map((path) => (
                    <div key={path.id} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">{path.match}%</p>
                          <p className="text-xs text-gray-500">Match</p>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-2">{path.title}</h4>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600">Demand: {path.demand}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-600">Salary: {path.avgSalary}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {path.skills?.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">{skill}</span>
                        ))}
                      </div>
                      <button className="w-full py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors">
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
      {showRequestModal && selectedStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Request Approval</h2>
                <p className="text-sm text-gray-500">{selectedStep.title}</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  By submitting this request, you confirm that you have completed all the requirements for this step.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to Admin (Optional)</label>
                <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 h-24 resize-none" placeholder="Add any notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowRequestModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleRequestApproval} disabled={submitting} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Submitting...</> : <><Send className="w-4 h-4" />Submit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New Skill</h2>
              <button onClick={() => setShowAddSkillModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
                <input type="text" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Python, React" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newSkill.category} onChange={(e) => setNewSkill({...newSkill, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                  <option>Technical</option><option>Soft Skills</option><option>Tools</option><option>Languages</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Proficiency: {newSkill.level}%</label>
                <input type="range" min="0" max="100" value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddSkillModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddSkill} disabled={!newSkill.name} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">Add Skill</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New Goal</h2>
              <button onClick={() => setShowAddGoalModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title *</label>
                <input type="text" value={newGoal.title} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Learn React Native" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newGoal.category} onChange={(e) => setNewGoal({...newGoal, category: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">
                  <option>Technical</option><option>Soft Skills</option><option>Projects</option><option>Certifications</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                <input type="date" value={newGoal.deadline} onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddGoalModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddGoal} disabled={!newGoal.title || !newGoal.deadline} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">Add Goal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentCareer;
