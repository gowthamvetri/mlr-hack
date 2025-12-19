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
 * Get appropriate prompt based on content size - SUMMARIZES entire content
 */
const getPromptForSize = (text) => {
    const textLength = text.length;

    // Small content (<500 chars) - concise summary
    if (textLength < 500) {
        return `Analyze and SUMMARIZE this content into a mind map format.

Requirements:
1. Create a clear main topic heading (#)
2. Summarize ALL key information into 3-4 short bullet points
3. Each point should be a CONCISE sentence (max 15 words)
4. Capture the essence of the entire content, not just keywords

Output Format (Markdown):
# [Main Topic]
- [Summary point 1]
- [Summary point 2]
- [Summary point 3]

Content to summarize:
${text}`;
    }

    // Medium content (500 - 3000 chars) - structured summary
    if (textLength < 3000) {
        return `Read and SUMMARIZE this content completely into a structured mind map.

Requirements:
1. Identify the MAIN TOPIC and use it as the # heading
2. Break content into 3-5 SUBTOPICS (## headings) based on themes/sections
3. Under each subtopic, write 2-4 SHORT summary points (- bullets)
4. Each bullet should be a COMPLETE thought in 10-20 words
5. Cover ALL important information from the content
6. Include a "Key Terms" section if technical terms are present

Output Format (Markdown):
# Main Topic

## Subtopic 1: [Theme Name]
- [Complete summary sentence about this aspect]
- [Another key point summarized concisely]

## Subtopic 2: [Theme Name]
- [Summary of this section's main idea]
- [Supporting detail or concept]

## Key Terms
- Term 1: Brief definition
- Term 2: Brief definition

Content to summarize:
${text}`;
    }

    // Large content (3000+ chars) - comprehensive summary
    return `Read this ENTIRE document carefully and create a COMPREHENSIVE mind map summary.

CRITICAL INSTRUCTIONS:
1. READ and UNDERSTAND the full content before generating
2. Create a hierarchical summary that captures ALL major concepts
3. Use SHORT, COMPLETE sentences (10-25 words max per point)
4. Every section of the PDF should be represented in the summary
5. Include factual information, not just topic names

Structure Requirements:
- # Main Topic: The central theme of the document
- ## Subtopics (4-6): Major sections or themes covered
- Under each ##, include 3-5 bullet points summarizing that section
- Each bullet should explain a concept, not just name it
- Add a "Key Concepts" section with important terms and their meanings
- Add a "Summary" section with 3-4 main takeaways

Output Format (Markdown):
# [Document Title/Main Subject]

## [First Major Theme/Section]
- [Explain the main idea of this section in one sentence]
- [Key detail or concept from this section]
- [Another important point summarized]

## [Second Major Theme/Section]
- [Core concept explained briefly]
- [Supporting information or example]
- [Related detail]

## [Additional Sections as needed...]

## Key Concepts
- [Term]: [What it means and why it's important]
- [Concept]: [Brief explanation]

## Summary
- [Main takeaway 1]
- [Main takeaway 2]
- [What reader should remember most]

Document Content:
${text.substring(0, 50000)}`;
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
    const keywords = extractKeywords(text, 10);

    // Extract first meaningful sentences for summary
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 150)
        .slice(0, 5);

    let markdown = '# Document Summary\n\n';

    if (topics.length > 0) {
        markdown += '## Main Topics\n';
        topics.forEach(topic => {
            const formatted = topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase();
            markdown += `- ${formatted}\n`;
        });
        markdown += '\n';
    }

    if (sentences.length > 0) {
        markdown += '## Key Points\n';
        sentences.forEach(sentence => {
            markdown += `- ${sentence.trim()}\n`;
        });
        markdown += '\n';
    }

    markdown += '## Key Terms\n';
    keywords.forEach(({ word }) => {
        markdown += `- ${word.charAt(0).toUpperCase() + word.slice(1)}\n`;
    });

    return markdown;
};

/**
 * Main function: Generate mind map from text
 * ALWAYS uses Gemini LLM - no local fallback
 */
const generateMindMapFromText = async (text) => {
    // Accept even very small content (minimum 10 chars)
    if (!text || text.trim().length < 10) {
        throw new Error('Content too short. Please provide more text for summarization.');
    }

    console.log(`Using Gemini AI for mind map generation (${text.length} chars)...`);
    
    try {
        const aiResult = await generateWithGemini(text.trim());

        if (aiResult && aiResult.trim().length > 20) {
            console.log('Mind map generated successfully via Gemini AI');
            return aiResult;
        } else {
            throw new Error('AI returned empty or insufficient response');
        }
    } catch (error) {
        console.error('Gemini API error:', error.message);
        throw new Error(`Failed to generate mind map: ${error.message}. Please try again.`);
    }
};

module.exports = { generateMindMapFromText };
