const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Upload bulk results
// @route   POST /api/results/upload
// @access  Admin
const uploadResults = async (req, res) => {
    try {
        const { results, type, title } = req.body; // Expecting array of { studentId, studentName, department, score, status, remarks }

        if (!results || !Array.isArray(results) || results.length === 0) {
            return res.status(400).json({ message: 'No results data provided' });
        }

        const batchId = new Date().getTime().toString(); // Simple timestamp-based batch ID

        const resultsToInsert = results.map(r => ({
            batchId,
            studentId: r.studentId,
            studentName: r.studentName,
            department: r.department,
            examType: type || 'Placement',
            title: title || r.title || 'Untitled Result',
            score: r.score,
            status: r.status,
            remarks: r.remarks,
            uploadedBy: req.user._id,
            published: false
        }));

        await Result.insertMany(resultsToInsert);

        res.status(201).json({
            message: 'Results uploaded successfully',
            batchId,
            count: resultsToInsert.length
        });
    } catch (error) {
        console.error('Error uploading results:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all results (grouped by batch or all)
// @route   GET /api/results/admin
// @access  Admin
const getAdminResults = async (req, res) => {
    try {
        // Return unique batches with summary
        const results = await Result.aggregate([
            {
                $group: {
                    _id: "$batchId",
                    title: { $first: "$title" },
                    examType: { $first: "$examType" },
                    uploadedAt: { $first: "$createdAt" },
                    totalRecords: { $sum: 1 },
                    published: { $first: "$published" },
                    publishedAt: { $first: "$publishedAt" }
                }
            },
            { $sort: { uploadedAt: -1 } }
        ]);

        res.json(results);
    } catch (error) {
        console.error('Error fetching admin results:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get details of a specific batch
// @route   GET /api/results/admin/batch/:batchId
// @access  Admin
const getBatchDetails = async (req, res) => {
    try {
        const results = await Result.find({ batchId: req.params.batchId });
        if (!results) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        res.json(results);
    } catch (error) {
        console.error('Error fetching batch details:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle publish status for a batch
// @route   PUT /api/results/publish/:batchId
// @access  Admin
const togglePublishBatch = async (req, res) => {
    try {
        const { published } = req.body; // true or false
        const batchId = req.params.batchId;

        const updateData = {
            published,
            publishedAt: published ? new Date() : null
        };

        await Result.updateMany({ batchId }, { $set: updateData });

        res.json({ message: `Batch ${published ? 'published' : 'unpublished'} successfully` });
    } catch (error) {
        console.error('Error publishing batch:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a batch
// @route   DELETE /api/results/batch/:batchId
// @access  Admin
const deleteBatch = async (req, res) => {
    try {
        await Result.deleteMany({ batchId: req.params.batchId });
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get student's own results
// @route   GET /api/results/my-results
// @access  Student
const getMyResults = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Match either by stored studentId in User model (if exists) or by email/rollNo logic
        // Assuming user.rollNumber matches result.studentId

        const results = await Result.find({
            studentId: user.rollNumber, // Ensure User model has rollNumber or verify mapping
            published: true
        }).sort({ publishedAt: -1 });

        res.json(results);
    } catch (error) {
        console.error('Error fetching student results:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    uploadResults,
    getAdminResults,
    getBatchDetails,
    togglePublishBatch,
    deleteBatch,
    getMyResults
};
