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
        <div className={`relative w-full bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm ${className}`}>
            <svg
                ref={svgRef}
                className="w-full h-full block"
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
            />
            <style>{`
                /* Mind Map Text - Dark on light background */
                .markmap-node text {
                    fill: #18181b !important; /* zinc-900 */
                    font-weight: 600 !important;
                }
                .markmap-node foreignObject div,
                .markmap-node foreignObject * {
                    color: #18181b !important;
                }
                svg text {
                    fill: #18181b !important;
                }
                svg foreignObject,
                svg foreignObject * {
                    color: #18181b !important;
                }
                /* Links */
                .markmap-link, svg path {
                    stroke: #a1a1aa !important; /* zinc-400 */
                    stroke-width: 2px !important;
                    fill: none !important;
                }
            `}</style>
            {/* Controls hint */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-zinc-200 text-[10px] text-zinc-500 shadow-sm">
                <span>🖱️ Drag to pan</span>
                <span className="text-zinc-300">•</span>
                <span>🔍 Scroll to zoom</span>
                <span className="text-zinc-300">•</span>
                <span>👆 Click to expand/collapse</span>
            </div>
        </div>
    );
};

export default MarkmapRender;
