import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { useAppDispatch } from '../../store';
import { showSuccessToast, showErrorToast } from '../../store/slices/uiSlice';
import gsap from 'gsap';
import ReactMarkdown from 'react-markdown';
import {
    BookOpen, Plus, Trash2, FileText, Video, Link as LinkIcon, File,
    ChevronRight, Calendar, Users, Download, Upload, RefreshCw, Eye,
    Image, ExternalLink, Sparkles, Check, Edit3, Save, Loader, X,
    Brain, CheckCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API;

// Animated Counter
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);

    useEffect(() => {
        const end = typeof value === 'number' ? value : 0;
        const start = prevValue.current;
        const duration = 400;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
            else prevValue.current = end;
        };
        requestAnimationFrame(animate);
    }, [value]);

    return <span className="tabular-nums">{displayValue}</span>;
};

const materialTypeIcons = {
    PDF: FileText,
    Video: Video,
    Link: LinkIcon,
    Document: File,
    Image: Image
};

const StaffSubjects = () => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useAppDispatch();
    const pageRef = useRef(null);
    const fileInputRef = useRef(null);

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [materialForm, setMaterialForm] = useState({
        title: '', description: '', type: 'PDF', url: ''
    });
    const [addingMaterial, setAddingMaterial] = useState(false);

    // File upload state
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Mind map state
    const [showMindMapModal, setShowMindMapModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [mindMapMarkdown, setMindMapMarkdown] = useState('');
    const [generatingMindMap, setGeneratingMindMap] = useState(false);
    const [savingMindMap, setSavingMindMap] = useState(false);
    const [editingMindMap, setEditingMindMap] = useState(false);

    // Fetch assigned subjects
    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}subjects/my-subjects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch subjects');
            const data = await response.json();
            setSubjects(data);
        } catch (error) {
            console.error('Error:', error);
            dispatch(showErrorToast(error.message || 'Error fetching subjects'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // GSAP animations
    useEffect(() => {
        if (!pageRef.current || loading) return;
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
                gsap.fromTo('.subject-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.2, ease: 'power2.out' });
            }, pageRef);
            return () => ctx.revert();
        }, 50);
        return () => clearTimeout(timer);
    }, [loading]);

    // File handling
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file) => {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            setSelectedFile(file);
            if (!materialForm.title) {
                setMaterialForm({ ...materialForm, title: file.name.replace('.pdf', ''), type: 'PDF' });
            }
        } else {
            dispatch(showErrorToast('Please select a PDF file'));
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedSubject || !selectedFile) return;

        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', materialForm.title || selectedFile.name);
            formData.append('description', materialForm.description);
            formData.append('type', 'PDF');

            const response = await fetch(`${API_URL}subjects/${selectedSubject._id}/materials/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload file');
            }

            dispatch(showSuccessToast('PDF uploaded successfully!'));
            setShowMaterialModal(false);
            setSelectedFile(null);
            setMaterialForm({ title: '', description: '', type: 'PDF', url: '' });
            fetchSubjects();
        } catch (error) {
            dispatch(showErrorToast(error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        if (!selectedSubject) return;

        // If file mode, use file upload
        if (uploadMode === 'file') {
            return handleFileUpload(e);
        }

        try {
            setAddingMaterial(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}subjects/${selectedSubject._id}/materials`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materialForm)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add material');
            }

            dispatch(showSuccessToast('Material added successfully!'));
            setShowMaterialModal(false);
            setMaterialForm({ title: '', description: '', type: 'PDF', url: '' });
            fetchSubjects();
        } catch (error) {
            dispatch(showErrorToast(error.message));
        } finally {
            setAddingMaterial(false);
        }
    };

    const handleDeleteMaterial = async (subjectId, materialId) => {
        if (!window.confirm('Delete this material?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}subjects/${subjectId}/materials/${materialId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete material');

            dispatch(showSuccessToast('Material deleted'));
            fetchSubjects();
        } catch (error) {
            dispatch(showErrorToast(error.message));
        }
    };

    // Mind map functions
    const handleGenerateMindMap = async (subject, material) => {
        setSelectedSubject(subject);
        setSelectedMaterial(material);
        setMindMapMarkdown(material.mindMap || '');
        setShowMindMapModal(true);

        // Only generate if no existing mind map
        if (!material.mindMap) {
            try {
                setGeneratingMindMap(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}subjects/${subject._id}/materials/${material._id}/generate-mindmap`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to generate mind map');
                }

                const data = await response.json();
                setMindMapMarkdown(data.markdown);
            } catch (error) {
                dispatch(showErrorToast(error.message));
            } finally {
                setGeneratingMindMap(false);
            }
        }
    };

    const handleSaveMindMap = async () => {
        if (!selectedSubject || !selectedMaterial) return;

        try {
            setSavingMindMap(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}subjects/${selectedSubject._id}/materials/${selectedMaterial._id}/save-mindmap`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ markdown: mindMapMarkdown })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save mind map');
            }

            dispatch(showSuccessToast('Mind map saved and approved! Now visible to students.'));
            setShowMindMapModal(false);
            setEditingMindMap(false);
            fetchSubjects();
        } catch (error) {
            dispatch(showErrorToast(error.message));
        } finally {
            setSavingMindMap(false);
        }
    };

    const totalMaterials = subjects.reduce((sum, s) => sum + (s.materials?.length || 0), 0);
    const approvedMaterials = subjects.reduce((sum, s) => sum + (s.materials?.filter(m => m.isApproved).length || 0), 0);

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Subjects</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Upload materials and generate AI mind maps</p>
                    </div>
                    <button
                        onClick={fetchSubjects}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Assigned Subjects', value: subjects.length, icon: BookOpen, color: 'violet' },
                        { label: 'Total Materials', value: totalMaterials, icon: FileText, color: 'blue' },
                        { label: 'Approved (Visible)', value: approvedMaterials, icon: CheckCircle, color: 'emerald' },
                        { label: 'With Mind Maps', value: subjects.reduce((sum, s) => sum + (s.materials?.filter(m => m.mindMap).length || 0), 0), icon: Brain, color: 'amber' },
                    ].map((stat, i) => {
                        const colorMap = { violet: 'bg-violet-50 text-violet-500', blue: 'bg-blue-50 text-blue-500', emerald: 'bg-emerald-50 text-emerald-500', amber: 'bg-amber-50 text-amber-500' };
                        return (
                            <div key={i} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center`}>
                                        <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stat.value} /></p>
                            </div>
                        );
                    })}
                </div>

                {/* Subject List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 animate-pulse">
                                <div className="h-5 bg-zinc-100 rounded w-1/3 mb-3" />
                                <div className="h-4 bg-zinc-100 rounded w-2/3 mb-4" />
                                <div className="h-20 bg-zinc-50 rounded" />
                            </div>
                        ))}
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-100 p-12 text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-700 mb-2">No Subjects Assigned</h3>
                        <p className="text-sm text-zinc-500">
                            You don't have any subjects assigned yet. Contact your administrator.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map((subject) => (
                            <div key={subject._id} className="subject-card bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all">
                                {/* Subject Header */}
                                <div className="p-5 border-b border-zinc-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{subject.code}</span>
                                                <span className="text-xs text-zinc-400">{subject.department}</span>
                                            </div>
                                            <h3 className="font-medium text-zinc-900">{subject.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedSubject(subject); setShowMaterialModal(true); setUploadMode('file'); setSelectedFile(null); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            Upload PDF
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Year {subject.year}, Sem {subject.semester}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {subject.credits} credits
                                        </span>
                                    </div>
                                </div>

                                {/* Materials List */}
                                <div className="p-4 bg-zinc-50/50">
                                    {subject.materials?.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-zinc-500 mb-2">{subject.materials.length} Materials</p>
                                            {subject.materials.slice(0, 4).map((material) => {
                                                const Icon = materialTypeIcons[material.type] || FileText;
                                                return (
                                                    <div key={material._id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-zinc-100 group">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 text-zinc-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-zinc-900 truncate">{material.title}</p>
                                                                {material.isApproved && (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                        <Check className="w-2.5 h-2.5" /> Approved
                                                                    </span>
                                                                )}
                                                                {material.mindMap && (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                                                        <Brain className="w-2.5 h-2.5" /> Mind Map
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {material.description && (
                                                                <p className="text-xs text-zinc-500 truncate">{material.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Generate/View Mind Map */}
                                                            {(material.type === 'PDF' || material.type === 'Document') && (
                                                                <button
                                                                    onClick={() => handleGenerateMindMap(subject, material)}
                                                                    className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                                    title={material.mindMap ? 'View Mind Map' : 'Generate Mind Map'}
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            {material.url && (
                                                                <a
                                                                    href={material.url.startsWith('/') ? `${API_URL.replace('/api/', '')}${material.url}` : material.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteMaterial(subject._id, material._id)}
                                                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {subject.materials.length > 4 && (
                                                <p className="text-xs text-center text-zinc-400 pt-2">
                                                    +{subject.materials.length - 4} more materials
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400 text-center py-4">
                                            No materials uploaded yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Material Modal */}
                <Modal isOpen={showMaterialModal} onClose={() => { setShowMaterialModal(false); setSelectedFile(null); }} title={`Upload Material to ${selectedSubject?.name || ''}`} size="lg">
                    <form onSubmit={handleAddMaterial} className="space-y-4">
                        {/* Upload Mode Tabs */}
                        <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setUploadMode('file')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${uploadMode === 'file' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                <Upload className="w-4 h-4 inline mr-1.5" />Upload PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('url')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${uploadMode === 'url' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                <LinkIcon className="w-4 h-4 inline mr-1.5" />URL Link
                            </button>
                        </div>

                        {uploadMode === 'file' ? (
                            <>
                                {/* Drag & Drop Zone */}
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActive ? 'border-violet-500 bg-violet-50' : selectedFile ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 hover:border-violet-300 hover:bg-zinc-50'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        className="hidden"
                                    />
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-zinc-900">{selectedFile.name}</p>
                                                <p className="text-xs text-zinc-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                className="p-1 text-zinc-400 hover:text-red-500 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-zinc-700 mb-1">Drop PDF here or click to browse</p>
                                            <p className="text-xs text-zinc-500">Max file size: 50MB</p>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL</label>
                                <input
                                    type="url"
                                    required
                                    value={materialForm.url}
                                    onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title</label>
                            <input
                                type="text"
                                required
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                                placeholder="e.g., Chapter 1 Notes"
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description (Optional)</label>
                            <input
                                type="text"
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                                placeholder="Brief description"
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
                            />
                        </div>

                        {uploadMode === 'url' && (
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label>
                                <select
                                    value={materialForm.type}
                                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"
                                >
                                    <option value="PDF">PDF</option>
                                    <option value="Video">Video</option>
                                    <option value="Link">Link</option>
                                    <option value="Document">Document</option>
                                    <option value="Image">Image</option>
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => { setShowMaterialModal(false); setSelectedFile(null); }}
                                className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addingMaterial || uploading || (uploadMode === 'file' && !selectedFile)}
                                className="px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {(addingMaterial || uploading) ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        {uploading ? 'Uploading...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        {uploadMode === 'file' ? 'Upload PDF' : 'Add Material'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Mind Map Modal */}
                <Modal
                    isOpen={showMindMapModal}
                    onClose={() => { setShowMindMapModal(false); setEditingMindMap(false); }}
                    title={`Mind Map - ${selectedMaterial?.title || ''}`}
                    size="xl"
                >
                    <div className="space-y-4">
                        {generatingMindMap ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="relative mb-4">
                                    <Brain className="w-12 h-12 text-violet-500 animate-pulse" />
                                    <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                                </div>
                                <p className="text-zinc-700 font-medium mb-1">Generating Mind Map...</p>
                                <p className="text-sm text-zinc-500">AI is analyzing your PDF content</p>
                            </div>
                        ) : (
                            <>
                                {/* Editor/Preview Toggle */}
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingMindMap(false)}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!editingMindMap ? 'bg-violet-100 text-violet-700' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                        >
                                            <Eye className="w-4 h-4 inline mr-1" />Preview
                                        </button>
                                        <button
                                            onClick={() => setEditingMindMap(true)}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${editingMindMap ? 'bg-violet-100 text-violet-700' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                        >
                                            <Edit3 className="w-4 h-4 inline mr-1" />Edit
                                        </button>
                                    </div>
                                    {selectedMaterial?.isApproved && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <CheckCircle className="w-3.5 h-3.5" /> Approved & Visible to Students
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                                    {editingMindMap ? (
                                        <textarea
                                            value={mindMapMarkdown}
                                            onChange={(e) => setMindMapMarkdown(e.target.value)}
                                            className="w-full h-[400px] px-4 py-3 text-sm font-mono border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                                            placeholder="Markdown content..."
                                        />
                                    ) : (
                                        <div className="prose prose-sm prose-zinc max-w-none p-4 bg-zinc-50 rounded-lg">
                                            <ReactMarkdown>{mindMapMarkdown || '*No content yet*'}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                                    <button
                                        onClick={() => handleGenerateMindMap(selectedSubject, selectedMaterial)}
                                        disabled={generatingMindMap}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowMindMapModal(false); setEditingMindMap(false); }}
                                            className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveMindMap}
                                            disabled={savingMindMap || !mindMapMarkdown}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                        >
                                            {savingMindMap ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save & Approve
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default StaffSubjects;
