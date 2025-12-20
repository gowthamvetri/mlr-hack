import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, FileText, CheckCircle, AlertCircle, X, Save,
    Trash2, Eye, Filter, Download, MoreVertical, RefreshCw, Send
} from 'lucide-react';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../components/DashboardLayout';
import { uploadResults, getAdminResults, toggleBatchPublish, deleteResultBatch } from '../../utils/api';

const AdminResultPublication = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manage'

    // Upload State
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [uploadConfig, setUploadConfig] = useState({
        type: 'Placement',
        title: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // success, error
    const fileInputRef = useRef(null);

    // Manage State
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchBatches();
        }
    }, [activeTab]);

    const fetchBatches = async () => {
        setLoadingBatches(true);
        try {
            const { data } = await getAdminResults();
            setBatches(data);
        } catch (error) {
            console.error('Error fetching batches:', error);
        } finally {
            setLoadingBatches(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }); // defval to keep empty cells

                validateData(jsonData);
            } catch (err) {
                console.error('Error parsing file:', err);
                setUploadStatus({ type: 'error', message: 'Failed to parsing file. Please check format.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const validateData = (data) => {
        const newErrors = [];
        const formattedData = data.map((row, index) => {
            const rowErrors = [];
            const studentId = row['Student ID'] || row['Roll Number'] || row['Roll No'];
            const studentName = row['Student Name'] || row['Name'];
            const department = row['Department'] || row['Dept'];
            const score = row['Score'] || row['Marks'] || row['CGPA'] || row['Percentage'];
            const status = row['Status'] || row['Result'];
            const remarks = row['Remarks'] || '';

            // Required checks
            if (!studentId) rowErrors.push('Missing Student ID');
            if (!studentName) rowErrors.push('Missing Name');
            if (!department) rowErrors.push('Missing Department');
            if (score === undefined || score === '') rowErrors.push('Missing Score');

            // Status inference
            let finalStatus = status;
            if (!finalStatus && score) {
                // Auto-infer logic demo
                if (!isNaN(score)) {
                    finalStatus = Number(score) >= 50 ? 'Pass' : 'Fail';
                } else {
                    // For placements, if score is text like 'Selected'
                    finalStatus = 'Pending';
                }
            }

            if (rowErrors.length > 0) {
                newErrors.push({ row: index + 1, errors: rowErrors });
            }

            return {
                studentId: String(studentId).trim(),
                studentName,
                department,
                score,
                status: finalStatus,
                remarks,
                hasError: rowErrors.length > 0,
                rowErrors
            };
        });

        setPreviewData(formattedData);
        setErrors(newErrors);
    };

    const handleUpload = async () => {
        if (!uploadConfig.title) {
            setUploadStatus({ type: 'error', message: 'Please enter a Title for this result batch.' });
            return;
        }
        if (errors.length > 0) {
            if (!window.confirm(`There are ${errors.length} rows with errors. These will be skipped or cause issues. Continue?`)) return;
        }

        setIsProcessing(true);
        try {
            const validRows = previewData.filter(r => !r.hasError);
            if (validRows.length === 0) {
                throw new Error('No valid rows to upload.');
            }

            await uploadResults({
                results: validRows,
                type: uploadConfig.type,
                title: uploadConfig.title
            });

            setUploadStatus({ type: 'success', message: 'Results uploaded successfully!' });
            setFile(null);
            setPreviewData([]);
            setUploadConfig({ ...uploadConfig, title: '' });
            // Switch to manage tab after short delay?
            setTimeout(() => setActiveTab('manage'), 1500);

        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus({ type: 'error', message: error.response?.data?.message || error.message || 'Upload failed' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchAction = async (batchId, action, value) => {
        try {
            if (action === 'publish') {
                await toggleBatchPublish(batchId, value);
            } else if (action === 'delete') {
                if (!window.confirm('Are you sure you want to delete this batch?')) return;
                await deleteResultBatch(batchId);
            }
            fetchBatches(); // Refresh
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert('Action failed');
        }
    };

    return (
        <DashboardLayout role="Admin" userName={user?.name}>
            <div className="max-w-[1600px] mx-auto space-y-8 p-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Result Publication</h1>
                        <p className="text-zinc-500 mt-1">Upload and manage exam or placement results.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                            Upload New
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                            Manage Results
                        </button>
                    </div>
                </div>

                {activeTab === 'upload' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-violet-600" /> Upload Configuration
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-2">Publish Type</label>
                                        <select
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-zinc-900"
                                            value={uploadConfig.type}
                                            onChange={e => setUploadConfig({ ...uploadConfig, type: e.target.value })}
                                        >
                                            <option value="Placement">Placement Result</option>
                                            <option value="Exam">Exam Result</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-2">Title / Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Google Drive Phase 1"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-zinc-900"
                                            value={uploadConfig.title}
                                            onChange={e => setUploadConfig({ ...uploadConfig, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-zinc-100">
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:border-violet-500 hover:text-violet-600 hover:bg-violet-50 transition-all cursor-pointer group"
                                        >
                                            <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold">Select CSV/Excel File</span>
                                            <span className="text-xs mt-1">Supported: .xlsx, .csv</span>
                                        </button>
                                        {file && (
                                            <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                                <FileText className="w-5 h-5" />
                                                <span className="text-sm font-bold truncate flex-1">{file.name}</span>
                                                <button onClick={() => { setFile(null); setPreviewData([]); }} className="p-1 hover:bg-emerald-100 rounded-full">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {uploadStatus && (
                                    <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {uploadStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        <p className="text-sm font-bold">{uploadStatus.message}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <h3 className="font-bold text-zinc-900 mb-2">Instructions</h3>
                                <ul className="text-sm text-zinc-500 space-y-2 list-disc pl-4">
                                    <li>First row must be headers.</li>
                                    <li>Required headers: <b>Student ID</b> (or Roll Number), <b>Name</b>, <b>Dept</b>, <b>Score</b>.</li>
                                    <li>Optional: Status, Remarks.</li>
                                    <li>Rows with errors will be highlighted.</li>
                                </ul>
                                <button className="mt-4 text-violet-600 text-sm font-bold flex items-center gap-1 hover:underline">
                                    <Download className="w-4 h-4" /> Download Sample Template
                                </button>
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div className="lg:col-span-2">
                            {previewData.length > 0 ? (
                                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                                    <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                        <div>
                                            <h3 className="font-bold text-zinc-900">Data Preview</h3>
                                            <p className="text-sm text-zinc-500">
                                                {previewData.length} records • {errors.length} errors
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleUpload}
                                            disabled={isProcessing || errors.length === previewData.length}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:bg-zinc-300 transition-all shadow-lg shadow-zinc-200"
                                        >
                                            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Upload Results
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-zinc-50 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Row</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Student ID</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Name</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Dept</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Score</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Status</th>
                                                    <th className="px-4 py-3 font-bold text-zinc-600">Validation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {previewData.map((row, idx) => (
                                                    <tr key={idx} className={row.hasError ? 'bg-red-50/50' : 'hover:bg-zinc-50/50'}>
                                                        <td className="px-4 py-3 text-zinc-500">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-zinc-900">{row.studentId || '-'}</td>
                                                        <td className="px-4 py-3 text-zinc-600">{row.studentName || '-'}</td>
                                                        <td className="px-4 py-3 text-zinc-600">{row.department}</td>
                                                        <td className="px-4 py-3 font-mono text-zinc-700">{row.score}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Pass' || row.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                                                                    row.status === 'Fail' || row.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {row.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {row.hasError ? (
                                                                <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {row.rowErrors.join(', ')}
                                                                </div>
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 text-center">
                                    <div>
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 shadow-sm">
                                            <FileText className="w-8 h-8 text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-900">No Data to Preview</h3>
                                        <p className="text-zinc-500 mt-1">Upload a file to see results here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-900">Uploaded Batches</h2>
                            <button onClick={fetchBatches} className="p-2 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-900">
                                <RefreshCw className={`w-5 h-5 ${loadingBatches ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {batches.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-zinc-500">No result batches uploaded yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-50 border-b border-zinc-100">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Title</th>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Type</th>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Date</th>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Records</th>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs">Status</th>
                                            <th className="px-6 py-4 font-bold text-zinc-500 uppercase tracking-wider text-xs text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {batches.map((batch, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-zinc-900">{batch.title}</p>
                                                    <p className="text-xs text-zinc-400 font-mono mt-1">ID: {batch._id}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${batch.examType === 'Placement' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                        {batch.examType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">
                                                    {new Date(batch.uploadedAt).toLocaleDateString()}
                                                    <span className="text-zinc-400 ml-2 text-xs">{new Date(batch.uploadedAt).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-zinc-700">{batch.totalRecords}</td>
                                                <td className="px-6 py-4">
                                                    {batch.published ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                            Published
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                                                            <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                                            Draft
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleBatchAction(batch._id, 'publish', !batch.published)}
                                                            className={`p-2 rounded-lg border transition-all ${batch.published
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                                }`}
                                                            title={batch.published ? "Unpublish" : "Publish"}
                                                        >
                                                            {batch.published ? <Eye className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleBatchAction(batch._id, 'delete')}
                                                            className="p-2 bg-white text-red-500 border border-zinc-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Batch"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default AdminResultPublication;
