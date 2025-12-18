import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import {
    MessageSquarePlus,
    Send,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Mail,
    Linkedin,
    Phone,
    Github,
    Globe,
    Twitter,
    Instagram,
    FileText,
    Loader2
} from 'lucide-react';
import { addChatbotContent } from '../../utils/api';

const AdminChatbotContent = () => {
    const user = useSelector(selectCurrentUser);

    // Form state
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Link options state - which ones are expanded
    const [expandedLinks, setExpandedLinks] = useState({});

    // Link values
    const [links, setLinks] = useState({
        email: '',
        linkedin: '',
        phone: '',
        github: '',
        website: '',
        twitter: '',
        instagram: ''
    });

    const linkOptions = [
        { key: 'email', label: 'Email Address', icon: Mail, placeholder: 'example@mlrit.ac.in' },
        { key: 'linkedin', label: 'LinkedIn Profile', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
        { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+91 9876543210' },
        { key: 'github', label: 'GitHub Profile', icon: Github, placeholder: 'https://github.com/username' },
        { key: 'website', label: 'Website URL', icon: Globe, placeholder: 'https://example.com' },
        { key: 'twitter', label: 'Twitter/X Handle', icon: Twitter, placeholder: 'https://twitter.com/username' },
        { key: 'instagram', label: 'Instagram Handle', icon: Instagram, placeholder: 'https://instagram.com/username' },
    ];

    const categories = [
        { value: 'general', label: 'General Information' },
        { value: 'about', label: 'About College' },
        { value: 'chairman', label: 'Chairman' },
        { value: 'principal', label: 'Principal' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'events', label: 'Events' },
        { value: 'placements', label: 'Placements' },
        { value: 'sports', label: 'Sports' },
        { value: 'clubs', label: 'Clubs' },
        { value: 'campus', label: 'Campus' },
        { value: 'admissions', label: 'Admissions' },
    ];

    const toggleLink = (key) => {
        setExpandedLinks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleLinkChange = (key, value) => {
        setLinks(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('Content is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Filter out empty links
            const activeLinks = Object.entries(links)
                .filter(([_, value]) => value.trim())
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

            const payload = {
                content: content.trim(),
                category,
                links: activeLinks,
                metadata: {
                    addedBy: user?.name || 'Admin',
                    addedAt: new Date().toISOString()
                }
            };

            await addChatbotContent(payload);

            setSuccess(true);
            setContent('');
            setLinks({
                email: '',
                linkedin: '',
                phone: '',
                github: '',
                website: '',
                twitter: '',
                instagram: ''
            });
            setExpandedLinks({});

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = content.trim().length > 0;

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Chatbot Content Manager</h1>
                <p className="text-sm sm:text-base text-gray-500">Add new content for the Smart Campus Assistant</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <MessageSquarePlus className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Add Content</p>
                            <p className="text-lg font-semibold text-gray-800">New Entry</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Content Type</p>
                            <p className="text-lg font-semibold text-gray-800">Text + Links</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-primary-100">Submit</p>
                            <p className="text-lg font-semibold">Add to Bot</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                            <MessageSquarePlus className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">Add New Content</h2>
                            <p className="text-sm text-gray-500">This content will be indexed for the chatbot</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">Content added successfully! It will be available in the chatbot shortly.</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category <span className="text-gray-400 font-normal">(helps organize content)</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full sm:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-800 font-medium"
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Main Content Textarea */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Content <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-2">(Required)</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Paste or type the content here...&#10;&#10;Example: The Chairman of MLRIT is Sri Marri Laxman Reddy. He is the founder of the institution and has been instrumental in establishing MLRIT as a premier engineering college."
                            rows={10}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-gray-800 placeholder-gray-400"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">This text will be indexed and used by the chatbot to answer questions</p>
                            <p className="text-xs text-gray-500">{content.length} characters</p>
                        </div>
                    </div>

                    {/* Additional Links Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Additional Links <span className="text-gray-400 font-normal">(Optional - click to add)</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {linkOptions.map(({ key, label, icon: Icon, placeholder }) => (
                                <div key={key} className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-primary-300">
                                    {/* Link Header - Clickable */}
                                    <button
                                        type="button"
                                        onClick={() => toggleLink(key)}
                                        className={`w-full flex items-center justify-between p-3 transition-colors ${expandedLinks[key] || links[key]
                                                ? 'bg-primary-50 border-b border-primary-100'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${expandedLinks[key] || links[key] ? 'text-primary-600' : 'text-gray-500'}`} />
                                            <span className={`text-sm font-medium ${expandedLinks[key] || links[key] ? 'text-primary-700' : 'text-gray-700'}`}>
                                                {label}
                                            </span>
                                            {links[key] && (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                        {expandedLinks[key] ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Input Field - Shown when expanded */}
                                    {expandedLinks[key] && (
                                        <div className="p-3 bg-white">
                                            <input
                                                type="text"
                                                value={links[key]}
                                                onChange={(e) => handleLinkChange(key, e.target.value)}
                                                placeholder={placeholder}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer with Submit Button */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            {isFormValid
                                ? '✓ Ready to submit'
                                : 'Enter content to enable submit button'}
                        </p>
                        <button
                            type="submit"
                            disabled={!isFormValid || loading}
                            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${isFormValid && !loading
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:-translate-y-0.5'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Adding Content...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Add to Chatbot
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Instructions Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Tips for Adding Content</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Be specific:</strong> Include names, dates, designations, and detailed information</li>
                    <li>• <strong>Use natural language:</strong> Write as if explaining to a student</li>
                    <li>• <strong>Include contact info:</strong> Add relevant links for the chatbot to reference</li>
                    <li>• <strong>Choose the right category:</strong> This helps the bot find relevant content faster</li>
                </ul>
            </div>
        </DashboardLayout>
    );
};

export default AdminChatbotContent;
