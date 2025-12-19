import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

/**
 * MarkmapRender - Simple inline markmap renderer following MindMapPreview pattern
 * @param {string} markdown - The markdown content to visualize
 * @param {string} className - Optional CSS classes
 */
const MarkmapRender = ({ markdown, className = '' }) => {
    const svgRef = useRef(null);
    const mmRef = useRef(null);

    useEffect(() => {
        if (markdown && svgRef.current) {
            // Cleanup previous instance
            if (mmRef.current) {
                mmRef.current = null;
            }
            svgRef.current.innerHTML = ''; // Clear SVG content

            try {
                const { root } = transformer.transform(markdown);
                // Create new instance (matches MindMapPreview approach)
                mmRef.current = Markmap.create(svgRef.current, null, root);

                // Fit twice to ensure layout settles (from MindMapPreview)
                setTimeout(() => mmRef.current?.fit(), 50);
                setTimeout(() => mmRef.current?.fit(), 200);
            } catch (e) {
                console.error("Markmap render error:", e);
            }
        }
    }, [markdown]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mmRef.current) {
                mmRef.current = null;
            }
        };
    }, []);

    return (
        <div className={`relative w-full bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl border border-dark-700 overflow-hidden ${className}`}>
            <svg
                ref={svgRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
            />
            <style>{`
                /* Mind Map Text - White on dark background */
                .markmap-node text {
                    fill: #ffffff !important;
                    font-weight: 500 !important;
                }
                .markmap-node foreignObject div,
                .markmap-node foreignObject * {
                    color: #ffffff !important;
                }
                svg text {
                    fill: #ffffff !important;
                }
                svg foreignObject,
                svg foreignObject * {
                    color: #ffffff !important;
                }
                /* Links */
                .markmap-link, svg path {
                    stroke: #71717a !important;
                    stroke-width: 2px !important;
                    fill: none !important;
                }
            `}</style>
            {/* Controls hint */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-dark-900/90 backdrop-blur-sm rounded-lg border border-dark-700 text-[10px] text-dark-400 shadow-sm">
                <span>🖱️ Drag to pan</span>
                <span className="text-dark-600">•</span>
                <span>🔍 Scroll to zoom</span>
                <span className="text-dark-600">•</span>
                <span>👆 Click to expand/collapse</span>
            </div>
        </div>
    );
};

export default MarkmapRender;
