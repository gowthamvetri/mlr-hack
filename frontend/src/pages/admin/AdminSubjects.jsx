import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { getSubjects, createSubject, updateSubject, deleteSubject, bulkImportSubjects, getSubjectDepartments } from '../../utils/api';
import gsap from 'gsap';
import { Plus, Search, Upload, Edit, Trash2, BookOpen, Filter, Download, CheckCircle, XCircle } from 'lucide-react';

// Animated Counter
const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);

    useEffect(() => {
        const end = typeof value === 'number' ? value : 0;
        const start = prevValue.current;
        const duration = 400;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(start + (end - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
            else prevValue.current = end;
        };
        requestAnimationFrame(animate);
    }, [value]);

    return <span className="tabular-nums">{displayValue}</span>;
};

const AdminSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [bulkData, setBulkData] = useState('');
    const [bulkResult, setBulkResult] = useState(null);
    const [filters, setFilters] = useState({ department: '', year: '', semester: '', search: '' });
    const [formData, setFormData] = useState({ code: '', name: '', department: '', year: 1, semester: 1, credits: 3, subjectType: 'HEAVY' });
    const pageRef = useRef(null);

    useEffect(() => { fetchData(); }, [filters]);

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
        }
    }, [loading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectsRes, deptsRes] = await Promise.all([getSubjects(filters), getSubjectDepartments()]);
            // Ensure subjects is always an array
            const subjectsData = subjectsRes.data;
            setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []));
            // Ensure departments is always an array
            const deptsData = deptsRes.data;
            setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData?.departments || []));
        } catch (error) { console.error('Error:', error); setSubjects([]); setDepartments([]); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSubject) await updateSubject(editingSubject._id, formData);
            else await createSubject(formData);
            setShowModal(false); resetForm(); fetchData();
        } catch (error) { alert(error.response?.data?.message || 'Error saving subject'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this subject?')) {
            try { await deleteSubject(id); fetchData(); }
            catch (error) { alert('Error deleting subject'); }
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({ code: subject.code, name: subject.name, department: subject.department, year: subject.year, semester: subject.semester, credits: subject.credits, subjectType: subject.subjectType });
        setShowModal(true);
    };

    const handleBulkImport = async () => {
        try {
            const parsed = JSON.parse(bulkData);
            const result = await bulkImportSubjects(Array.isArray(parsed) ? parsed : [parsed]);
            setBulkResult(result.data);
            fetchData();
        } catch (error) {
            if (error instanceof SyntaxError) alert('Invalid JSON');
            else alert(error.response?.data?.message || 'Error importing');
        }
    };

    const resetForm = () => { setFormData({ code: '', name: '', department: '', year: 1, semester: 1, credits: 3, subjectType: 'HEAVY' }); setEditingSubject(null); };

    const downloadTemplate = () => {
        const template = [{ code: 'CS101', name: 'Introduction to Programming', department: 'CSE', year: 1, semester: 1, credits: 4, subjectType: 'HEAVY' }];
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'subjects_template.json'; a.click();
    };

    const columns = [
        { header: 'Code', accessor: 'code' },
        { header: 'Name', accessor: 'name' },
        { header: 'Department', accessor: 'department' },
        { header: 'Year', accessor: 'year' },
        { header: 'Semester', accessor: 'semester' },
        { header: 'Credits', accessor: 'credits' },
        {
            header: 'Type', render: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${row.subjectType === 'HEAVY' ? 'bg-violet-50 text-violet-600' : 'bg-zinc-100 text-zinc-600'}`}>{row.subjectType}</span>
            )
        },
        {
            header: 'Actions', render: (row) => (
                <div className="flex gap-1">
                    <button onClick={() => handleEdit(row)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(row._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout title="Subject Management">
            <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Semester Subjects</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage subjects, credits, and semesters</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowBulkModal(true)} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
                            <Upload className="w-4 h-4" />Bulk Import
                        </button>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all">
                            <Plus className="w-4 h-4" />Add Subject
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Subjects', value: subjects.length, icon: BookOpen, color: 'violet' },
                        { label: 'Total Credits', value: subjects.reduce((sum, s) => sum + (s.credits || 0), 0), icon: BookOpen, color: 'blue' },
                        { label: 'Major Subjects', value: subjects.filter(s => s.subjectType === 'HEAVY').length, icon: BookOpen, color: 'emerald' },
                        { label: 'Departments', value: departments.length, icon: BookOpen, color: 'amber' },
                    ].map((stat, i) => {
                        const colorMap = { violet: 'bg-violet-50 text-violet-500', blue: 'bg-blue-50 text-blue-500', emerald: 'bg-emerald-50 text-emerald-500', amber: 'bg-amber-50 text-amber-500' };
                        return (
                            <div key={i} className="metric-card group bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-300">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center`}>
                                        <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                                <p className="text-2xl font-semibold text-zinc-900"><AnimatedNumber value={stat.value} /></p>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Filters</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input type="text" placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 text-zinc-700" />
                        </div>
                        <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                            <option value="">All Depts</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                            <option value="">All Years</option>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                        <select value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} className="px-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white text-zinc-700">
                            <option value="">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <DataTable columns={columns} data={subjects} emptyMessage="No subjects found. Add your first subject!" />

                {/* Add/Edit Modal */}
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSubject ? 'Edit Subject' : 'Add Subject'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Code</label>
                                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="CS101" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Credits</label>
                                <input type="number" required min="1" max="6" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Introduction to Programming" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Department</label>
                            <input type="text" required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value.toUpperCase() })} placeholder="CSE" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Year</label>
                                <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white">
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Semester</label>
                                <select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label>
                                <select value={formData.subjectType} onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white">
                                    <option value="HEAVY">HEAVY</option>
                                    <option value="NONMAJOR">NONMAJOR</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">{editingSubject ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </Modal>

                {/* Bulk Modal */}
                <Modal isOpen={showBulkModal} onClose={() => { setShowBulkModal(false); setBulkResult(null); }} title="Bulk Import">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">Import using JSON format</p>
                            <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                                <Download className="w-3 h-3" />Template
                            </button>
                        </div>
                        <textarea value={bulkData} onChange={(e) => setBulkData(e.target.value)} placeholder='[{"code": "CS101", ...}]' rows={8} className="w-full px-3 py-3 text-sm font-mono border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" />
                        {bulkResult && (
                            <div className="p-4 bg-zinc-50 rounded-lg space-y-2">
                                <p className="font-medium text-zinc-900 text-sm">{bulkResult.message}</p>
                                {bulkResult.results?.success?.length > 0 && <div className="flex items-center gap-2 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" />{bulkResult.results.success.length} imported</div>}
                                {bulkResult.results?.failed?.length > 0 && <div className="flex items-center gap-2 text-xs text-red-600"><XCircle className="w-3 h-3" />{bulkResult.results.failed.length} failed</div>}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowBulkModal(false); setBulkResult(null); }} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Close</button>
                            <button onClick={handleBulkImport} disabled={!bulkData.trim()} className="px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">Import</button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default AdminSubjects;
