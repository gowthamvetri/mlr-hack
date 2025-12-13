const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from a file based on its type
 */
const extractText = async (filePath, mimeType) => {
    try {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found at path: ${absolutePath}`);
        }

        const buffer = fs.readFileSync(absolutePath);

        // ✅ WORKS WITH pdf-parse@1.1.1
        if (mimeType === 'application/pdf') {
            const data = await pdfParse(buffer);
            return data.text;
        }

        if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        if (mimeType === 'text/plain') {
            return buffer.toString('utf-8');
        }

        throw new Error('Unsupported file type for text extraction');
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
};

module.exports = { extractText };
