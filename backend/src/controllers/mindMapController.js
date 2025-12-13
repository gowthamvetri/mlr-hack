const Course = require('../models/Course');
const { extractText } = require('../services/textExtractionService');
const { generateMindMapFromText } = require('../services/mindMapService');
const path = require('path');

// Generate mind map from a course material file
const generateMindMap = async (req, res) => {
    try {
        const { courseId, materialId } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const material = course.materials.id(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Construct valid file path
        // Database url: /uploads/course-materials/filename.pdf
        // Local path: d:/Projects/mlr-hack/backend/uploads/course-materials/filename.pdf

        let filePath = material.url;
        if (filePath.startsWith('/')) filePath = filePath.substring(1); // Remove leading slash

        const absolutePath = path.join(__dirname, '../../', filePath);

        // Extract text
        const text = await extractText(absolutePath, getMimeType(material.type));

        // Generate Mind Map (Markdown)
        const markdown = generateMindMapFromText(text);

        res.json({ markdown });
    } catch (error) {
        console.error('Mind Map Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Save generated/approved mind map
const saveMindMap = async (req, res) => {
    try {
        const { courseId, materialId, markdown } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const material = course.materials.id(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        material.mindMap = markdown;
        await course.save();

        res.json({ message: 'Mind map saved successfully', material });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Map simple type to mime type
const getMimeType = (type) => {
    const map = {
        'pdf': 'application/pdf',
        'doc': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain'
    };
    return map[type] || 'application/pdf'; // Default fallback
};

module.exports = {
    generateMindMap,
    saveMindMap
};
