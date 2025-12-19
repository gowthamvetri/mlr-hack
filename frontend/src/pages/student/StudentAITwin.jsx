import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
    ArrowLeft, Brain, TrendingUp, Clock, Users, MessageCircle, Settings,
    Sparkles, CheckCircle, Star, Send, Loader, BookOpen, Target,
    Award, Lightbulb, Copy, ChevronRight, Calendar
} from 'lucide-react';

const StudentAITwin = () => {
    const user = useSelector(selectCurrentUser);
    const [activeTab, setActiveTab] = useState('overview');
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            type: 'ai',
            text: "Good morning! I've been analyzing your recent progress. You've shown remarkable improvement in JavaScript skills. Ready to tackle that time management challenge today?",
            time: '9:00 AM'
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [clonedRoleModel, setClonedRoleModel] = useState('Dr. Sarah Johnson');
    const chatEndRef = useRef(null);

    // Mock data - in production, fetch from API
    const twinData = {
        name: user?.name || "Student's Twin",
        level: 'Advanced Learner',
        lastSync: '2 hours ago',
        careerReadiness: 78,
        careerChange: '+5% increase this month',
        dailyWisdom: {
            quote: "Your potential is infinite. Today's small steps create tomorrow's breakthroughs.",
            author: 'Dr. Sarah Johnson'
        },
        strengths: ['Problem Solving', 'Technical Skills', 'Communication'],
        developmentAreas: ['Time Management', 'Leadership'],
        recommendations: [
            { title: 'Data Structures & Algorithms Course', desc: 'Strengthen your problem solving foundation', duration: '4 weeks', priority: 'high', category: 'Technical Skills' },
            { title: 'Join Open Source Project', desc: 'Contribute to React.js ecosystem projects', duration: '2 weeks', priority: 'medium', category: 'Collaboration' },
            { title: 'Time Management Workshop', desc: 'Address your identified weakness in time management', duration: '1 week', priority: 'high', category: 'Soft Skills' }
        ]
    };

    const timelineEvents = [
        { id: 1, title: 'JavaScript Mastery', desc: 'Completed advanced JavaScript course with 95% score', points: '+12 points in Technical Skills', date: '2024-01-15', color: 'bg-blue-500' },
        { id: 2, title: 'Leadership Workshop', desc: 'Attended leadership skills workshop', points: '+8 points in Leadership', date: '2024-01-10', color: 'bg-green-500' },
        { id: 3, title: 'Code Review Skills', desc: 'Improved code review abilities through peer feedback', points: '+6 points in Collaboration', date: '2024-01-05', color: 'bg-purple-500' },
        { id: 4, title: 'New Year Resolution', desc: 'Set goal to improve time management', points: 'Active goal tracking started', date: '2024-01-01', color: 'bg-orange-500' }
    ];

    const roleModels = [
        { id: 1, initials: 'SP', name: 'Sundar Pichai', role: 'CEO of Google', expertise: 'Technology Leadership & Innovation', desc: 'CEO of Alphabet and Google, leading global technology innovation', students: 500, rating: 5, recommended: true },
        { id: 2, initials: 'DSJ', name: 'Dr. Sarah Johnson', role: 'AI Research Director', expertise: 'Artificial Intelligence & Machine Learning', desc: 'Leading AI researcher with breakthrough contributions to deep learning', students: 150, rating: 4.9, cloned: true },
        { id: 3, initials: 'SN', name: 'Satya Nadella', role: 'CEO of Microsoft', expertise: 'Cloud Computing & Enterprise Solutions', desc: 'Transformed Microsoft into a cloud-first company', students: 300, rating: 4.8 },
        { id: 4, initials: 'JH', name: 'Jensen Huang', role: 'CEO of NVIDIA', expertise: 'AI Hardware & Computing', desc: 'Pioneer in GPU computing and AI acceleration technologies', students: 200, rating: 4.9 },
        { id: 5, initials: 'FL', name: 'Fei-Fei Li', role: 'Stanford AI Professor', expertise: 'Computer Vision & AI Ethics', desc: 'Leading researcher in computer vision and AI democratization', students: 250, rating: 4.9 },
        { id: 6, initials: 'EM', name: 'Elon Musk', role: 'CEO of Tesla & SpaceX', expertise: 'Innovation & Entrepreneurship', desc: 'Visionary entrepreneur pushing boundaries of technology', students: 800, rating: 4.7 }
    ];

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const userMsg = {
            id: chatMessages.length + 1,
            type: 'user',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages([...chatMessages, userMsg]);
        setNewMessage('');
        setSending(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: chatMessages.length + 2,
                type: 'ai',
                text: `Perfect! Based on ${clonedRoleModel}'s mentorship style, I recommend the Pomodoro Technique. Start with 25-minute focused work sessions followed by 5-minute breaks. This aligns with your learning pattern and will help you manage your study schedule more effectively.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages(prev => [...prev, aiResponse]);
            setSending(false);
        }, 1500);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Brain },
        { id: 'timeline', label: 'Growth Timeline', icon: Clock },
        { id: 'rolemodels', label: 'Role Models', icon: Users },
        { id: 'chat', label: 'AI Twin Chat', icon: MessageCircle }
    ];

    return (
        <DashboardLayout role="student" userName={user?.name}>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/student" className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </Link>
                        <div className="h-6 w-px bg-dark-700" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20">
                                <Brain className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">AI Twin</h1>
                                <p className="text-sm text-dark-400">Your Digital Learning Companion</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-semibold flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-4 h-4" />
                            Active
                        </span>
                        <button className="flex items-center gap-2 px-4 py-2 text-dark-400 hover:text-white hover:bg-dark-800 border border-transparent hover:border-dark-700 rounded-lg transition-all font-medium">
                            <Settings className="w-4 h-4" />
                            Configure
                        </button>
                    </div>
                </div>

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-up">
                    {/* Student Twin Card */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg shadow-primary-900/20 border border-primary-500/30 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold drop-shadow-sm">{twinData.name}</h2>
                                <p className="text-primary-100 font-medium">{twinData.level}</p>
                            </div>
                            <Sparkles className="w-5 h-5 ml-auto text-primary-200" />
                        </div>
                        <p className="text-sm text-primary-100 flex items-center gap-2 font-medium relative z-10">
                            <Clock className="w-4 h-4" />
                            Last sync: {twinData.lastSync}
                        </p>
                    </div>

                    {/* Career Readiness */}
                    <div className="glass-card-dark rounded-2xl p-6 tilt-card border border-dark-700 shadow-xl group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-2 text-dark-400 mb-3 font-medium uppercase tracking-wide text-xs">
                            <TrendingUp className="w-4 h-4" />
                            <span>Career Readiness</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-white drop-shadow-sm"><AnimatedNumber value={twinData.careerReadiness} suffix="%" /></span>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm font-bold">Industry Ready</span>
                        </div>
                        <div className="w-full bg-dark-700/50 rounded-full h-2 mb-2 border border-dark-600">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${twinData.careerReadiness}%` }} />
                        </div>
                        <p className="text-sm text-emerald-400 font-bold">{twinData.careerChange}</p>
                    </div>

                    {/* Daily Wisdom */}
                    <div className="glass-card-dark rounded-2xl p-6 tilt-card border border-dark-700 shadow-xl group hover:border-amber-500/30 transition-all">
                        <div className="flex items-center gap-2 text-dark-400 mb-3 font-medium uppercase tracking-wide text-xs">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span>Daily Wisdom</span>
                        </div>
                        <p className="text-white italic mb-3 font-medium leading-relaxed">"{twinData.dailyWisdom.quote}"</p>
                        <p className="text-sm text-primary-400 font-bold">- Inspired by {twinData.dailyWisdom.author}</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="glass-card-dark rounded-2xl tilt-card p-2 border border-dark-700 shadow-lg">
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-dark-700 text-white shadow-md border border-dark-600'
                                    : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-400' : 'text-dark-500'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Strengths & Development */}
                            <div className="glass-card-dark rounded-2xl p-6 tilt-card border border-dark-700 shadow-xl">
                                <div className="flex items-center gap-2 text-white mb-4">
                                    <Target className="w-5 h-5 text-primary-400" />
                                    <h3 className="font-bold text-lg">Strengths & Development Areas</h3>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <CheckCircle className="w-4 h-4" />
                                        Key Strengths
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {twinData.strengths.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-bold shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                        <Target className="w-4 h-4" />
                                        Development Areas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {twinData.developmentAreas.map((d, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm font-bold shadow-sm">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="glass-card-dark rounded-2xl p-6 tilt-card border border-dark-700 shadow-xl">
                                <div className="flex items-center gap-2 text-white mb-4">
                                    <Lightbulb className="w-5 h-5 text-amber-400" />
                                    <h3 className="font-bold text-lg">AI Recommendations</h3>
                                </div>
                                <p className="text-sm text-dark-400 mb-4 font-medium">Personalized suggestions based on your learning pattern</p>

                                <div className="space-y-4">
                                    {twinData.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 bg-dark-800/50 rounded-xl border border-dark-700 hover:border-primary-500/30 hover:bg-dark-800 transition-all group">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold text-white group-hover:text-primary-400 transition-colors">{rec.title}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${rec.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {rec.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-dark-300 mb-2 font-medium">{rec.desc}</p>
                                            <div className="flex items-center justify-between text-xs text-dark-500 font-medium">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.duration}</span>
                                                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{rec.category}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Growth Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="glass-card-dark rounded-2xl p-6 tilt-card border border-dark-700 shadow-xl">
                            <div className="flex items-center gap-2 text-white mb-2">
                                <Clock className="w-5 h-5 text-primary-400" />
                                <h3 className="font-bold text-lg">Growth Timeline</h3>
                            </div>
                            <p className="text-dark-400 mb-6 font-medium">Track your learning journey and achievements over time</p>

                            <div className="space-y-6">
                                {timelineEvents.map((event, i) => (
                                    <div key={event.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${event.color} ring-4 ring-dark-800 shadow-lg`} />
                                            {i < timelineEvents.length - 1 && <div className="w-0.5 flex-1 bg-dark-700 mt-2 group-hover:bg-dark-600 transition-colors" />}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-start justify-between bg-dark-800/30 p-4 rounded-xl border border-dark-700/50 hover:bg-dark-800/60 hover:border-dark-600 transition-all">
                                                <div>
                                                    <h4 className="font-bold text-white">{event.title}</h4>
                                                    <p className="text-sm text-dark-300 mt-1 font-medium">{event.desc}</p>
                                                    <p className="text-sm text-emerald-400 font-bold mt-2">{event.points}</p>
                                                </div>
                                                <span className="text-xs text-dark-500 font-bold bg-dark-900/50 px-2 py-1 rounded border border-dark-700/50">{event.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Role Models Tab */}
                    {activeTab === 'rolemodels' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-white">
                                <Users className="w-5 h-5 text-primary-400" />
                                <h3 className="font-bold text-lg">Clone Role Models</h3>
                            </div>
                            <p className="text-dark-400 font-medium">Clone successful mentors and industry experts as your AI guides. Ask for your role model like Sundar Pichai or choose from our recommendations.</p>

                            {/* Recommended */}
                            <div>
                                <h4 className="text-sm font-bold text-dark-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    Recommended for You
                                </h4>
                                {roleModels.filter(r => r.recommended).map(rm => (
                                    <div key={rm.id} className="glass-card-dark rounded-2xl p-6 tilt-card border-2 border-primary-500/20 hover:border-primary-500/40 transition-all shadow-lg shadow-primary-500/5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-primary-500 shadow-md">
                                                {rm.initials}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white text-lg">{rm.name}</h4>
                                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                                        <Star className="w-3 h-3" /> Recommended
                                                    </span>
                                                </div>
                                                <p className="text-primary-400 font-bold">{rm.role}</p>
                                                <p className="text-dark-300 text-sm font-medium">{rm.expertise}</p>
                                                <p className="text-dark-400 text-sm mt-2 font-medium leading-relaxed">{rm.desc}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-dark-500 font-medium hod-stats">
                                                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{rm.students} students</span>
                                                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" />{rm.rating}</span>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20">
                                                <Copy className="w-4 h-4" />
                                                Clone as AI Twin
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* All Role Models */}
                            <div>
                                <h4 className="text-sm font-bold text-dark-300 mb-4 uppercase tracking-wide">All Role Models</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {roleModels.filter(r => !r.recommended).map(rm => (
                                        <div key={rm.id} className="glass-card-dark rounded-2xl p-5 tilt-card hover:shadow-xl transition-all border border-dark-700 hover:border-dark-600 group">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-md ${rm.cloned
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-dark-800 text-white border-dark-700'
                                                    }`}>
                                                    {rm.initials}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white group-hover:text-primary-400 transition-colors">{rm.name}</h4>
                                                        {rm.cloned && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><Copy className="w-3 h-3" />Cloned</span>}
                                                    </div>
                                                    <p className="text-primary-400 text-xs font-bold">{rm.role}</p>
                                                </div>
                                            </div>
                                            <p className="text-dark-300 text-sm mb-2 font-medium">{rm.expertise}</p>
                                            <p className="text-dark-400 text-xs mb-3 leading-relaxed">{rm.desc}</p>
                                            <div className="flex items-center gap-3 text-xs text-dark-500 font-medium mb-4">
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rm.students}</span>
                                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{rm.rating}</span>
                                            </div>
                                            <button className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${rm.cloned
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-dark-800 hover:bg-primary-600 text-white border border-dark-600 hover:border-primary-500 hover:shadow-primary-500/20'
                                                }`}>
                                                <MessageCircle className="w-4 h-4" />
                                                {rm.cloned ? 'Chat with Clone' : 'Clone as AI Twin'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Twin Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className="glass-card-dark rounded-2xl border border-dark-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 border-b border-dark-700 bg-dark-800/30">
                                <div className="flex items-center gap-2 text-white">
                                    <MessageCircle className="w-5 h-5 text-primary-400" />
                                    <h3 className="font-bold text-lg">Chat with Your AI Twin</h3>
                                </div>
                                <p className="text-dark-400 text-sm mt-1 font-medium">Get personalized guidance and motivation from your digital companion</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-dark-900/50 custom-scrollbar">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.type === 'user'
                                            ? 'bg-primary-600 text-white rounded-br-none shadow-lg shadow-primary-900/20'
                                            : 'bg-dark-800 text-white border border-dark-700 rounded-bl-none shadow-md'
                                            }`}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                            <p className={`text-[10px] mt-2 font-bold uppercase tracking-wide opacity-70 ${msg.type === 'user' ? 'text-primary-100' : 'text-dark-400'}`}>{msg.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="bg-dark-800 p-4 rounded-2xl border border-dark-700 shadow-sm rounded-bl-none">
                                            <div className="flex items-center gap-2 text-dark-400">
                                                <Loader className="w-4 h-4 animate-spin text-primary-400" />
                                                <span className="text-sm font-medium">AI Twin is typing...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-dark-700 bg-dark-800/80 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask your AI Twin anything..."
                                        className="flex-1 px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-dark-500 transition-all shadow-inner"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sending}
                                        className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl disabled:bg-dark-700 disabled:text-dark-500 transition-all shadow-lg shadow-primary-500/20"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentAITwin;
