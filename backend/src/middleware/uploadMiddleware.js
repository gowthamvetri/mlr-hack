const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const courseMaterialsDir = path.join(uploadsDir, 'course-materials');
const subjectMaterialsDir = path.join(uploadsDir, 'subject-materials');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(courseMaterialsDir)) {
    fs.mkdirSync(courseMaterialsDir, { recursive: true });
}
if (!fs.existsSync(subjectMaterialsDir)) {
    fs.mkdirSync(subjectMaterialsDir, { recursive: true });
}

// Configure storage for course materials
const courseMaterialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, courseMaterialsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `material-${uniqueSuffix}${ext}`);
    }
});

// Configure storage for subject materials
const subjectMaterialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, subjectMaterialsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `subject-material-${uniqueSuffix}${ext}`);
    }
});

// File filter for allowed types
const materialFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype) ||
        // Fallback check for extensions since mime types can vary
        /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png|gif|mp4|webm)$/i.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Excel, images, and videos are allowed.'), false);
    }
};

const uploadCourseMaterial = multer({
    storage: courseMaterialStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: materialFileFilter
});

const uploadSubjectMaterial = multer({
    storage: subjectMaterialStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: materialFileFilter
});

module.exports = {
    uploadCourseMaterial,
    uploadSubjectMaterial
};
