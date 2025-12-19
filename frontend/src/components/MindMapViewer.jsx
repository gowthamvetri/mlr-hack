import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import * as d3 from 'd3';

const transformer = new Transformer();

/**
 * MindMapView - Full interactive mind map viewer
 * @param {string} markdown - The markdown content
 * @param {object} options - Markmap options
 */
export const MindMapView = ({ markdown, options = {} }) => {
    const svgRef = useRef(null);
    const markmapRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!markdown || !svgRef.current) return;

        try {
            setError(null);
            const { root } = transformer.transform(markdown);

            if (!markmapRef.current) {
                markmapRef.current = Markmap.create(svgRef.current, {
                    autoFit: true,
                    duration: 500,
                    maxWidth: 300,
                    color: (node) => {
                        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                        return colors[node.depth % colors.length];
                    },
                    paddingX: 16,
                    ...options
                });
            }

            markmapRef.current.setData(root);
            markmapRef.current.fit();
        } catch (err) {
            console.error('MindMap error:', err);
            setError('Failed to render mind map');
        }
    }, [markdown, options]); // Re-run if markdown or options change

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (markmapRef.current) {
                markmapRef.current.fit();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (markmapRef.current) {
                markmapRef.current.destroy(); // Ensure proper cleanup if method exists, otherwise ref null
                markmapRef.current = null;
            }
        };
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4 bg-red-50 text-red-600 rounded-lg">
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl overflow-hidden border border-dark-700/50">
            <svg ref={svgRef} className="w-full h-full min-h-[400px]" />
            <style>{`
                .markmap-link {
                    stroke: #a1a1aa !important;
                    stroke-width: 2px !important;
                    fill: none !important;
                    stroke-opacity: 0.8 !important;
                }
                svg path {
                    stroke: #a1a1aa;
                    stroke-width: 2px;
                    fill: none;
                }
                .markmap-node circle {
                    cursor: pointer;
                }
                .markmap-node text {
                    fill: #F4F4F6 !important;
                }
            `}</style>
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-dark-900/90 backdrop-blur-sm rounded-lg border border-dark-700 text-[10px] text-dark-400 shadow-sm flex items-center gap-2">
                <span>🖱️ Pan & Zoom</span>
                <span className="w-0.5 h-3 bg-dark-700" />
                <span>👆 Click to Fold</span>
            </div>
        </div>
    );
};

/**
 * MindMapPreview - Simplified read-only preview (can be same implementation with locked interactions if needed, 
 * but for now just a wrapper with preset options)
 */
export const MindMapPreview = ({ markdown }) => {
    return (
        <MindMapView
            markdown={markdown}
            options={{
                zoom: true,
                pan: true, // Students should still validly be able to explore it
                initialExpandLevel: 2
            }}
        />
    );
};
