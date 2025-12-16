/**
 * AI-Powered Mind Map Generator
 * Uses Gemini 2.5 Flash API for intelligent content extraction
 * Works with ALL file sizes - small, medium, and large
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash"
});

// Common stop words to filter out (for fallback)
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'need', 'it', 'this', 'that', 'these', 'those', 'he', 'she', 'they',
    'we', 'you', 'i', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
    'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'about'
]);

const TOPIC_INDICATORS = [
    'introduction', 'overview', 'summary', 'chapter', 'unit', 'section', 'module',
    'concept', 'definition', 'types', 'methods', 'techniques', 'approach', 'model',
    'theory', 'principle', 'law', 'formula', 'algorithm', 'structure', 'components',
    'features', 'properties', 'advantages', 'disadvantages', 'applications'
];

/**
 * Get appropriate prompt based on content size
 */
const getPromptForSize = (text) => {
    const textLength = text.length;

    // Small content (< 500 chars) - simpler structure
    if (textLength < 500) {
        return `Analyze this short content and create a concise mind map in markdown format.

Requirements:
1. Create a main topic heading (#)
2. List 2-3 key points (- bullets)
3. Add any important terms if present

Content:
${text}`;
    }

    // Medium content (500 - 3000 chars)
    if (textLength < 3000) {
        return `Analyze this content and create a structured mind map in markdown format.

Requirements:
1. Identify the MAIN TOPIC (use as # heading)
2. Extract 2-4 KEY SUBTOPICS (use as ## headings)
3. For each subtopic, list 1-3 important points (- bullets)
4. Include key terms if applicable

Format:
# Main Topic
## Subtopic 1
- Point 1
- Point 2

Content:
${text}`;
    }

    // Large content (3000+ chars) - full structure
    return `Analyze this educational content and create a comprehensive mind map in markdown format.

Requirements:
1. Identify the MAIN TOPIC (use as # heading)
2. Extract 3-5 KEY SUBTOPICS (use as ## headings)
3. For each subtopic, list 2-4 important points (use - bullets)
4. Include a "Key Terms" section with important vocabulary and brief definitions
5. Keep it organized and educational

Format example:
# Main Topic Title

## Subtopic 1
- Important point 1
- Important point 2

## Subtopic 2
- Important point 1
- Important point 2

## Key Terms
- Term 1: Brief definition
- Term 2: Brief definition

Content to analyze:
${text.substring(0, 30000)}`;
};

/**
 * Generate mind map using Gemini AI - works with ALL file sizes
 */
const generateWithGemini = async (text) => {
    const prompt = getPromptForSize(text);

    console.log(`Generating mind map for ${text.length} characters of content...`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

/**
 * Local fallback extraction (no AI)
 */
const extractKeywords = (text, maxKeywords = 12) => {
    const words = text.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !STOP_WORDS.has(word));

    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
        .map(([word, freq]) => {
            let score = freq;
            if (TOPIC_INDICATORS.includes(word)) score *= 3;
            if (word.length > 7) score *= 1.2;
            return { word, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, maxKeywords);
};

const extractTopics = (text, maxTopics = 5) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const topics = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        const isTopicLine =
            (trimmed.length < 60 && trimmed.length > 5 && !trimmed.endsWith('.')) ||
            /^[\d]+[.\)]\s/.test(trimmed) ||
            TOPIC_INDICATORS.some(ind => trimmed.toLowerCase().includes(ind) && trimmed.length < 80) ||
            (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 50);

        if (isTopicLine && topics.length < maxTopics) {
            let topic = trimmed
                .replace(/^[\d]+[.\)]\s*/, '')
                .replace(/^#+\s*/, '')
                .replace(/[:]+$/, '')
                .trim();
            if (topic.length > 3 && topic.length < 80 && !topics.includes(topic)) {
                topics.push(topic);
            }
        }
    });

    return topics;
};

const generateLocalMindMap = (text) => {
    const topics = extractTopics(text, 5);
    const keywords = extractKeywords(text, 12);

    let markdown = '# Document Summary\n\n';

    if (topics.length > 0) {
        markdown += '## Main Topics\n';
        topics.forEach(topic => {
            const formatted = topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();
            markdown += `### ${formatted}\n`;
        });
    }

    markdown += '\n## Key Terms\n';
    keywords.forEach(({ word }) => {
        markdown += `- ${word.charAt(0).toUpperCase() + word.slice(1)}\n`;
    });

    return markdown;
};

/**
 * Main function: Generate mind map from text
 * Works with ALL file sizes - uses adaptive prompts
 */
const generateMindMapFromText = async (text) => {
    // Accept even very small content (minimum 10 chars)
    if (!text || text.trim().length < 10) {
        return '# Document Summary\n- No content available for analysis';
    }

    // Always try Gemini AI first (with adaptive prompts for different sizes)
    try {
        console.log(`Using Gemini AI for mind map generation (${text.length} chars)...`);
        const aiResult = await generateWithGemini(text.trim());

        if (aiResult && aiResult.trim().length > 20) {
            return aiResult;
        }
    } catch (error) {
        console.error('Gemini API error, falling back to local:', error.message);
    }

    // Fallback to local extraction
    console.log('Using local extraction for mind map...');
    return generateLocalMindMap(text);
};

module.exports = { generateMindMapFromText };
