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
                        const colors = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#db2777'];
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
        <div className="relative w-full h-full bg-white rounded-xl overflow-hidden border border-zinc-200">
            <svg ref={svgRef} className="w-full h-full min-h-[400px]" />
            <style>{`
                /* Mind Map Text - Make highly visible on light background */
                .markmap-node text {
                    fill: #18181b !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    text-shadow: none !important;
                }
                .markmap-node foreignObject div {
                    color: #18181b !important;
                    font-weight: 600 !important;
                }
                
                /* Links/branches */
                .markmap-link {
                    stroke: #a1a1aa !important;
                    stroke-width: 2px !important;
                    fill: none !important;
                    stroke-opacity: 0.8 !important;
                }
                svg path {
                    stroke: #a1a1aa;
                }
            `}</style>
        </div>
    );
};

export default MindMapView;
