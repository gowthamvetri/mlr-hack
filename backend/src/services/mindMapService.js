/**
 * Heuristic-based Mind Map Generator
 * Analyzes text structure to generate a Markdown format compatible with markmap
 */

const generateMindMapFromText = (text) => {
    if (!text) return '# No Content';

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let markdown = '# Course Overview\n';

    // Heuristics for structure
    // 1. Identify potential headings (All caps, short lines, specific keywords)
    // 2. Group content under headings

    let currentLevel = 1;
    let processingList = false;

    // Simple heuristic: 
    // - Short lines (< 50 chars) ending with colon or no punctuation = potential headers
    // - Bullet points

    // Since we don't have an LLM, we'll try to identify structure by sentence length and keywords

    const keywords = ['introduction', 'summary', 'chapter', 'unit', 'conclusion', 'overview', 'types', 'methods'];

    let contentBuffer = [];

    lines.forEach(line => {
        const trimmed = line.trim();

        // Skip very short garbage lines
        if (trimmed.length < 3) return;

        // Check for headings
        const isHeading =
            (trimmed.length < 60 && !trimmed.endsWith('.')) ||
            keywords.some(k => trimmed.toLowerCase().startsWith(k)) ||
            /^\d+\./.test(trimmed); // Starts with "1.", "2."

        if (isHeading) {
            markdown += `\n## ${trimmed.replace(/^[#\s]+/, '')}\n`; // Level 2 Header
            processingList = false;
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            markdown += `- ${trimmed.replace(/^[-\•\s]+/, '')}\n`;
        } else {
            // Regular content - try to summarize or just add as list item if not too long
            if (trimmed.length < 150) {
                markdown += `- ${trimmed}\n`;
            }
        }
    });

    // If generation failed to produce structure, just dump first few lines
    if (markdown.length < 50) {
        markdown = `# Course Content\n- ${text.substring(0, 200)}...`;
    }

    return markdown;
};

module.exports = { generateMindMapFromText };
