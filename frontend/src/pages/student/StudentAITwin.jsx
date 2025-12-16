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
                        <Link to="/student" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </Link>
                        <div className="h-6 w-px bg-gray-300" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Brain className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AI Twin</h1>
                                <p className="text-sm text-gray-500">Your Digital Learning Companion</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Active
                        </span>
                        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Configure
                        </button>
                    </div>
                </div>

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-up">
                    {/* Student Twin Card */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg shadow-primary-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{twinData.name}</h2>
                                <p className="text-primary-100">{twinData.level}</p>
                            </div>
                            <Sparkles className="w-5 h-5 ml-auto text-primary-200" />
                        </div>
                        <p className="text-sm text-primary-100 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Last sync: {twinData.lastSync}
                        </p>
                    </div>

                    {/* Career Readiness */}
                    <div className="glass-card rounded-2xl p-6 tilt-card">
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-medium">Career Readiness</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xl font-bold text-gray-900"><AnimatedNumber value={twinData.careerReadiness} suffix="%" /></span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Industry Ready</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${twinData.careerReadiness}%` }} />
                        </div>
                        <p className="text-sm text-green-600 font-medium">{twinData.careerChange}</p>
                    </div>

                    {/* Daily Wisdom */}
                    <div className="glass-card rounded-2xl p-6 tilt-card">
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium">Daily Wisdom</span>
                        </div>
                        <p className="text-gray-800 italic mb-3">"{twinData.dailyWisdom.quote}"</p>
                        <p className="text-sm text-gray-500">- Inspired by {twinData.dailyWisdom.author}</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="glass-card rounded-2xl tilt-card p-2">
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
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
                            <div className="glass-card rounded-2xl p-6 tilt-card">
                                <div className="flex items-center gap-2 text-gray-800 mb-4">
                                    <Target className="w-5 h-5 text-primary-600" />
                                    <h3 className="font-bold">Strengths & Development Areas</h3>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Key Strengths
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {twinData.strengths.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-orange-600 mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Development Areas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {twinData.developmentAreas.map((d, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="glass-card rounded-2xl p-6 tilt-card">
                                <div className="flex items-center gap-2 text-gray-800 mb-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                                    <h3 className="font-bold">AI Recommendations</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Personalized suggestions based on your learning pattern</p>

                                <div className="space-y-4">
                                    {twinData.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {rec.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{rec.desc}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
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
                        <div className="glass-card rounded-2xl p-6 tilt-card">
                            <div className="flex items-center gap-2 text-gray-800 mb-2">
                                <Clock className="w-5 h-5 text-primary-600" />
                                <h3 className="font-bold">Growth Timeline</h3>
                            </div>
                            <p className="text-gray-500 mb-6">Track your learning journey and achievements over time</p>

                            <div className="space-y-6">
                                {timelineEvents.map((event, i) => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${event.color}`} />
                                            {i < timelineEvents.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{event.desc}</p>
                                                    <p className="text-sm text-green-600 font-medium mt-2">{event.points}</p>
                                                </div>
                                                <span className="text-sm text-gray-400">{event.date}</span>
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
                            <div className="flex items-center gap-2 text-gray-800">
                                <Users className="w-5 h-5 text-primary-600" />
                                <h3 className="font-bold">Clone Role Models</h3>
                            </div>
                            <p className="text-gray-500">Clone successful mentors and industry experts as your AI guides. Ask for your role model like Sundar Pichai or choose from our recommendations.</p>

                            {/* Recommended */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                    Recommended for You
                                </h4>
                                {roleModels.filter(r => r.recommended).map(rm => (
                                    <div key={rm.id} className="glass-card rounded-2xl p-6 tilt-card border-2 border-primary-100">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg border-4 border-primary-200">
                                                {rm.initials}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900">{rm.name}</h4>
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                        <Star className="w-3 h-3" /> Recommended
                                                    </span>
                                                </div>
                                                <p className="text-primary-600 font-medium">{rm.role}</p>
                                                <p className="text-gray-500 text-sm">{rm.expertise}</p>
                                                <p className="text-gray-600 text-sm mt-2">{rm.desc}</p>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{rm.students} students</span>
                                                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" />{rm.rating}</span>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                                                <Copy className="w-4 h-4" />
                                                Clone as AI Twin
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* All Role Models */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">All Role Models</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {roleModels.filter(r => !r.recommended).map(rm => (
                                        <div key={rm.id} className="glass-card rounded-2xl p-5 tilt-card hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${rm.cloned ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                                                    }`}>
                                                    {rm.initials}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-800">{rm.name}</h4>
                                                        {rm.cloned && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Copy className="w-3 h-3" />Cloned</span>}
                                                    </div>
                                                    <p className="text-primary-600 text-sm">{rm.role}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-sm mb-2">{rm.expertise}</p>
                                            <p className="text-gray-600 text-xs mb-3">{rm.desc}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rm.students}</span>
                                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{rm.rating}</span>
                                            </div>
                                            <button className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${rm.cloned
                                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                : 'bg-primary-600 hover:bg-primary-700 text-white'
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
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-800">
                                    <MessageCircle className="w-5 h-5 text-primary-600" />
                                    <h3 className="font-bold">Chat with Your AI Twin</h3>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">Get personalized guidance and motivation from your digital companion</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-4 rounded-2xl ${msg.type === 'user'
                                            ? 'bg-primary-600 text-white rounded-br-md'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>{msg.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">AI Twin is typing...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask your AI Twin anything..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || sending}
                                        className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:bg-gray-300 transition-colors"
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
