import { useState, useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Loader2, Save, RefreshCw, X, Edit, Download } from 'lucide-react';
import API from '../utils/api'; // Direct import to call endpoints we just added

const transformer = new Transformer();

const MindMapPreview = ({ courseId, materialId, onClose, onSave, readOnly = false, initialMarkdown = '' }) => {
    const [markdown, setMarkdown] = useState(initialMarkdown || '');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const svgRef = useRef(null);
    const mmRef = useRef(null);

    // Initial load logic
    useEffect(() => {
        if (initialMarkdown) {
            setMarkdown(initialMarkdown);
            setLoading(false);
        } else if (readOnly) {
            setLoading(false);
        } else {
            setLoading(true);
            generateMindMap();
        }
    }, [courseId, materialId]);

    // Rendering logic - Recreate from scratch every time
    useEffect(() => {
        if (markdown && svgRef.current) {
            // Cleanup
            if (mmRef.current) {
                // No explicit destroy method in simple Markmap usage, but we clear SVG
                mmRef.current = null;
            }
            svgRef.current.innerHTML = ''; // Clear SVG content

            try {
                const { root } = transformer.transform(markdown);
                // Create new instance
                mmRef.current = Markmap.create(svgRef.current, null, root);

                // Fit twice to ensure layout settles
                setTimeout(() => mmRef.current?.fit(), 50);
                setTimeout(() => mmRef.current?.fit(), 200);
            } catch (e) {
                console.error("Markmap render error:", e);
            }
        }
    }, [markdown, isEditing]);

    const generateMindMap = async () => {
        try {
            setLoading(true);
            const { data } = await API.post('/courses/mindmap/generate', { courseId, materialId });
            setMarkdown(data.markdown);
        } catch (error) {
            console.error("Error generating mind map:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await API.post('/courses/mindmap/save', { courseId, materialId, markdown });
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Error saving mind map:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Mind Map Generator</h2>
                    <div className="flex items-center gap-2">
                        {!readOnly && (
                            <>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary-500" />
                            <p>Analyzing document structure...</p>
                        </div>
                    ) : (!markdown && readOnly) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <p className="font-medium">No mind map available</p>
                        </div>
                    ) : (
                        <>
                            {isEditing && (
                                <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
                                    <textarea
                                        value={markdown}
                                        onChange={(e) => setMarkdown(e.target.value)}
                                        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-transparent"
                                    />
                                </div>
                            )}
                            <div className={`flex-1 relative bg-white ${isEditing ? 'w-2/3' : 'w-full'} min-h-[500px]`}>
                                <svg ref={svgRef} className="w-full h-full block" style={{ width: '100%', height: '100%' }} />
                            </div>
                        </>
                    )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                    Use # for headings, - for lists to structure your mind map.
                </div>
            </div>
        </div>
    );
};

export default MindMapPreview;
