import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import {
    getChatbotContent, getChatbotContentStats, addChatbotContent,
    updateChatbotContent, deleteChatbotContent, clearAllChatbotContent
} from '../../utils/api';
import gsap from 'gsap';
import {
    MessageSquare, Plus, Edit2, Trash2, Database, AlertTriangle,
    CheckCircle, Link, User, Mail, Phone, Globe, Linkedin, RefreshCw, X,
    ChevronDown, ChevronUp
} from 'lucide-react';

const AdminChatbotContent = () => {
    const user = useSelector(selectCurrentUser);
    const pageRef = useRef(null);
    const [content, setContent] = useState([]);
    const [stats, setStats] = useState({ total_entries: 0, total_chunks: 0, namespaces: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        text: '',
        links: []
    });

    const linkTypes = [
        { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
        { value: 'email', label: 'Email', icon: Mail },
        { value: 'phone', label: 'Phone', icon: Phone },
        { value: 'website', label: 'Website', icon: Globe }
    ];

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.content-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contentRes, statsRes] = await Promise.all([
                getChatbotContent(),
                getChatbotContentStats()
            ]);
            setContent(Array.isArray(contentRes.data?.content) ? contentRes.data.content : []);
            setStats(statsRes.data || { total_entries: 0, total_chunks: 0, namespaces: [] });
        } catch (err) {
            console.error('Error fetching data:', err);
            setContent([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setFormData({ title: '', text: '', links: [] });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            text: item.text || '',
            links: item.links || []
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!editingItem) return;
        try {
            // Pass namespace as query param for Pinecone delete
            await deleteChatbotContent(editingItem.id + '?namespace=' + (editingItem.namespace || ''));
            setShowDeleteModal(false);
            setEditingItem(null);
            fetchData();
        } catch (err) {
            alert('Error deleting content: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllChatbotContent();
            setShowClearModal(false);
            fetchData();
        } catch (err) {
            alert('Error clearing content: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.text.trim()) {
            setError('Title and text are required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            if (editingItem) {
                await updateChatbotContent(editingItem.id, formData);
                setSuccess('Content updated successfully!');
            } else {
                await addChatbotContent(formData);
                setSuccess('Content added and indexed successfully!');
            }
            setTimeout(() => {
                setShowModal(false);
                fetchData();
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    const addLink = () => {
        setFormData({
            ...formData,
            links: [...formData.links, { name: '', type: 'linkedin', value: '' }]
        });
    };

    const updateLink = (index, field, value) => {
        const newLinks = [...formData.links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData({ ...formData, links: newLinks });
    };

    const removeLink = (index) => {
        setFormData({
            ...formData,
            links: formData.links.filter((_, i) => i !== index)
        });
    };

    const getLinkIcon = (type) => {
        const linkType = linkTypes.find(lt => lt.value === type);
        return linkType?.icon || Link;
    };

    return (
        <DashboardLayout role="admin" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Chatbot Content</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage knowledge base for the AI assistant</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchData} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
                            <RefreshCw className="w-4 h-4" />Refresh
                        </button>
                        {content.length > 0 && (
                            <button onClick={() => setShowClearModal(true)} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all">
                                <Trash2 className="w-4 h-4" />Clear All
                            </button>
                        )}
                        <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all">
                            <Plus className="w-4 h-4" />Add Content
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="content-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-4.5 h-4.5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Content Entries</p>
                                <p className="text-xl font-semibold text-zinc-900">{stats.total_entries}</p>
                            </div>
                        </div>
                    </div>
                    <div className="content-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Database className="w-4.5 h-4.5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Vector Chunks</p>
                                <p className="text-xl font-semibold text-zinc-900">{stats.total_chunks}</p>
                            </div>
                        </div>
                    </div>
                    <div className="content-card bg-white rounded-xl p-5 border border-zinc-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Status</p>
                                <p className="text-xl font-semibold text-emerald-600">{stats.total_entries > 0 ? 'Active' : 'Empty'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Table */}
                <div className="content-card bg-white rounded-xl border border-zinc-100 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100">
                        <h2 className="font-semibold text-zinc-900 text-sm">All Content</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Content indexed for chatbot knowledge base</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">Loading content...</p>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="p-12 text-center">
                            <Database className="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                            <h3 className="text-sm font-medium text-zinc-700 mb-1">No content yet</h3>
                            <p className="text-xs text-zinc-500 mb-4">Add your first content to the chatbot knowledge base</p>
                            <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all">
                                <Plus className="w-4 h-4" />Add Content
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {content.map((item) => {
                                const isExpanded = expandedId === item.id;
                                return (
                                    <div key={item.id} className="transition-all">
                                        {/* Card Header - Always visible */}
                                        <div
                                            className={`p-4 cursor-pointer hover:bg-zinc-50 transition-colors ${isExpanded ? 'bg-violet-50/50' : ''}`}
                                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-violet-100' : 'bg-zinc-100'}`}>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-violet-600" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-semibold uppercase truncate max-w-[150px]">
                                                                {item.title || 'Untitled'}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                                                                {item.namespace}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 truncate">{item.text_preview || 'No preview'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => { setEditingItem(item); setShowDeleteModal(true); }}
                                                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 bg-zinc-50 border-t border-zinc-100">
                                                <div className="p-4 bg-white rounded-lg border border-zinc-200 mt-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-medium text-zinc-400 uppercase">Full Content</span>
                                                        <span className="text-[10px] text-zinc-400">ID: {item.id.slice(0, 20)}...</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                                                        {item.text || 'No content available'}
                                                    </p>
                                                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-zinc-100">
                                                            <span className="text-[10px] font-medium text-zinc-400 uppercase">Metadata</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {Object.entries(item.metadata).slice(0, 5).map(([k, v]) => (
                                                                    <span key={k} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px]">
                                                                        {k}: {typeof v === 'string' ? v.slice(0, 30) : JSON.stringify(v).slice(0, 30)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Content' : 'Add Content'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />{error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />{success}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title / Category *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., about, principal, management, departments"
                            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">This categorizes the content for the chatbot</p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Content Text *</label>
                        <textarea
                            required
                            rows={8}
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            placeholder="Enter the content that the chatbot should know about..."
                            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1">This text will be indexed and used by the AI to answer questions</p>
                    </div>

                    {/* Links Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-zinc-500">Contact Links (Optional)</label>
                            <button type="button" onClick={addLink} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                                + Add Link
                            </button>
                        </div>

                        {formData.links.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No links added. Click "Add Link" to add contact information.</p>
                        ) : (
                            <div className="space-y-3">
                                {formData.links.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg">
                                        <input
                                            type="text"
                                            value={link.name}
                                            onChange={(e) => updateLink(index, 'name', e.target.value)}
                                            placeholder="Person/Entity name"
                                            className="flex-1 px-2 py-1.5 text-xs border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-100"
                                        />
                                        <select
                                            value={link.type}
                                            onChange={(e) => updateLink(index, 'type', e.target.value)}
                                            className="px-2 py-1.5 text-xs border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-100 bg-white"
                                        >
                                            {linkTypes.map(lt => (
                                                <option key={lt.value} value={lt.value}>{lt.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={link.value}
                                            onChange={(e) => updateLink(index, 'value', e.target.value)}
                                            placeholder="Link/Value"
                                            className="flex-1 px-2 py-1.5 text-xs border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-100"
                                        />
                                        <button type="button" onClick={() => removeLink(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-zinc-100">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {editingItem ? 'Update' : 'Add & Index'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Content" size="sm">
                <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-zinc-600 mb-1">Delete this content?</p>
                    <p className="text-xs text-zinc-500 mb-4">"{editingItem?.title}" will be removed from the knowledge base.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                    </div>
                </div>
            </Modal>

            {/* Clear All Confirmation Modal */}
            <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)} title="Clear All Content" size="sm">
                <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-zinc-600 mb-1">Clear ALL chatbot content?</p>
                    <p className="text-xs text-zinc-500 mb-4">This will remove all {stats.total_entries} entries and {stats.total_chunks} vector chunks. This cannot be undone!</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowClearModal(false)} className="flex-1 px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                        <button onClick={handleClearAll} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Clear All</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminChatbotContent;
