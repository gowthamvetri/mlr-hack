import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { getCourses, getDepartments, getCourseStats, createCourse, deleteCourse, getCourseById, updateCourse, uploadCourseMaterial, deleteCourseMaterial } from '../../utils/api';
import { 
  BookOpen, Search, Plus, Users, Clock, Star, 
  MoreVertical, Edit, Trash2, Eye, Filter, X, AlertTriangle, CheckCircle, Download, Upload, FileText, File
} from 'lucide-react';

const AdminCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [departments, setDepartments] = useState(['all']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active', description: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [materialFile, setMaterialFile] = useState(null);
  const [materialName, setMaterialName] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    avgRating: 0
  });

  const mockCourses = [
    { _id: '1', name: 'Data Structures & Algorithms', code: 'CS301', department: 'CSE', credits: 4, students: 156, instructor: 'Dr. Rajesh Kumar', status: 'Active', rating: 4.8 },
    { _id: '2', name: 'Machine Learning', code: 'CS401', department: 'CSE', credits: 4, students: 128, instructor: 'Prof. Priya Sharma', status: 'Active', rating: 4.7 },
    { _id: '3', name: 'Digital Electronics', code: 'EC201', department: 'ECE', credits: 3, students: 98, instructor: 'Dr. Amit Singh', status: 'Active', rating: 4.5 },
    { _id: '4', name: 'Database Management', code: 'CS302', department: 'CSE', credits: 3, students: 142, instructor: 'Prof. Meera Patel', status: 'Active', rating: 4.6 },
    { _id: '5', name: 'Computer Networks', code: 'CS303', department: 'CSE', credits: 3, students: 134, instructor: 'Dr. Vikram Reddy', status: 'Upcoming', rating: 4.4 },
    { _id: '6', name: 'Thermodynamics', code: 'ME201', department: 'MECH', credits: 4, students: 87, instructor: 'Prof. Suresh Kumar', status: 'Active', rating: 4.3 },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [filterDept, filterStatus]);

  const fetchInitialData = async () => {
    try {
      // Fetch departments
      const { data } = await getDepartments();
      const deptCodes = data.map(d => d.code);
      setDepartments(['all', ...deptCodes]);

      // Fetch course stats
      try {
        const statsRes = await getCourseStats();
        setStats({
          total: statsRes.data.totalCourses || 0,
          active: statsRes.data.activeCourses || 0,
          students: statsRes.data.totalEnrollments || 0,
          avgRating: statsRes.data.avgRating || 0
        });
      } catch (e) {
        console.log('Course stats not available');
      }
    } catch (error) {
      console.log('Using default departments');
      setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept !== 'all') params.department = filterDept;
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await getCourses(params);
      setCourses(data.length > 0 ? data : mockCourses);
      
      // Calculate stats from data
      const courseData = data.length > 0 ? data : mockCourses;
      setStats({
        total: courseData.length,
        active: courseData.filter(c => c.status === 'Active' || c.status === 'active').length,
        students: courseData.reduce((acc, c) => acc + (c.enrolledStudents?.length || c.students || 0), 0),
        avgRating: courseData.length > 0 ? (courseData.reduce((acc, c) => acc + (c.rating || 0), 0) / courseData.length).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses(mockCourses);
      setStats({
        total: mockCourses.length,
        active: mockCourses.filter(c => c.status === 'Active').length,
        students: mockCourses.reduce((acc, c) => acc + c.students, 0),
        avgRating: (mockCourses.reduce((acc, c) => acc + c.rating, 0) / mockCourses.length).toFixed(1)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.code) { setFormError('Please fill in all required fields'); return; }
    try {
      await createCourse(formData);
      setFormSuccess('Course added successfully!');
      setTimeout(() => { setShowAddModal(false); setFormData({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active' }); setFormSuccess(''); fetchCourses(); }, 1500);
    } catch (error) { setFormError(error.response?.data?.message || 'Error adding course'); }
  };

  const handleEditClick = async (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      department: course.department?.code || course.department || 'CSE',
      credits: course.credits || 3,
      instructor: course.instructor?.name || course.instructor || '',
      status: course.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.code) { setFormError('Please fill in all required fields'); return; }
    try {
      await updateCourse(selectedCourse._id, formData);
      setFormSuccess('Course updated successfully!');
      setTimeout(() => { setShowEditModal(false); setSelectedCourse(null); setFormData({ name: '', code: '', department: 'CSE', credits: 3, instructor: '', status: 'Active' }); setFormSuccess(''); fetchCourses(); }, 1500);
    } catch (error) { setFormError(error.response?.data?.message || 'Error updating course'); }
  };

  const handleViewClick = async (course) => {
    try {
      const { data } = await getCourseById(course._id);
      setViewCourse(data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching course details:', error);
      setViewCourse(course);
      setShowViewModal(true);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    try { await deleteCourse(selectedCourse._id); setShowDeleteModal(false); setSelectedCourse(null); fetchCourses(); }
    catch (error) { alert('Error deleting course'); }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!materialFile || !selectedCourse) return;
    
    setUploadingMaterial(true);
    try {
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('name', materialName || materialFile.name);
      
      await uploadCourseMaterial(selectedCourse._id, formData);
      
      // Refresh course data
      const { data } = await getCourseById(selectedCourse._id);
      setSelectedCourse(data);
      setMaterialFile(null);
      setMaterialName('');
      setFormSuccess('Material uploaded successfully!');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error uploading material');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!selectedCourse || !materialId) return;
    try {
      await deleteCourseMaterial(selectedCourse._id, materialId);
      const { data } = await getCourseById(selectedCourse._id);
      setSelectedCourse(data);
    } catch (error) {
      alert('Error deleting material');
    }
  };

  const openMaterialModal = async (course) => {
    try {
      const { data } = await getCourseById(course._id);
      setSelectedCourse(data);
      setShowMaterialModal(true);
    } catch (error) {
      setSelectedCourse(course);
      setShowMaterialModal(true);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Code', 'Department', 'Credits', 'Instructor', 'Students', 'Rating', 'Status'];
    const csvContent = [headers.join(','), ...filteredCourses.map(c => [c.name, c.code, c.department, c.credits, c.instructor, c.students, c.rating, c.status].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || c.department === filterDept || c.department?.code === filterDept;
    const matchesStatus = filterStatus === 'all' || c.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
          <p className="text-gray-500">Manage all courses and curriculum</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Courses</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <BookOpen className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Courses</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Enrollments</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.students}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Rating</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.avgRating}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.slice(1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {course.code}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      course.status === 'Active' ? 'bg-green-100 text-green-700' :
                      course.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.instructor}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{course.students}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{course.credits}</p>
                  <p className="text-xs text-gray-500">Credits</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-gray-800">{course.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => handleViewClick(course)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button onClick={() => handleEditClick(course)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => openMaterialModal(course)} className="flex items-center justify-center gap-2 px-3 py-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                </button>
                <button onClick={() => { setSelectedCourse(course); setShowDeleteModal(true); }} className="flex items-center justify-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No courses found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Data Structures" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., CS301" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Credits</label><input type="number" value={formData.credits} onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option>Active</option><option>Upcoming</option><option>Completed</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label><input type="text" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="Instructor name" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Edit Course</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedCourse(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Credits</label><input type="number" value={formData.credits} onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option>Active</option><option>Upcoming</option><option>Completed</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label><input type="text" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedCourse(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Update Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Course Modal */}
      {showViewModal && viewCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Course Details</h2>
              <button onClick={() => { setShowViewModal(false); setViewCourse(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">{viewCourse.code}</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      viewCourse.status === 'Active' ? 'bg-green-100 text-green-700' :
                      viewCourse.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{viewCourse.status}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{viewCourse.name}</h3>
                  <p className="text-gray-600">{viewCourse.description || 'No description available'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Credits</p>
                  <p className="text-2xl font-bold text-gray-800">{viewCourse.credits}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Students</p>
                  <p className="text-2xl font-bold text-gray-800">{viewCourse.enrolledStudents?.length || viewCourse.students || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-gray-800">{viewCourse.rating || 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-2xl font-bold text-gray-800">{viewCourse.duration || '1'} Sem</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500 mb-1">Instructor</p>
                  <p className="text-gray-800 font-medium">{viewCourse.instructor?.name || viewCourse.instructor || 'Not assigned'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500 mb-1">Department</p>
                  <p className="text-gray-800 font-medium">{viewCourse.department?.name || viewCourse.department || 'N/A'}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="text-gray-800">{viewCourse.createdAt ? new Date(viewCourse.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowViewModal(false); handleEditClick(viewCourse); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Course
                </button>
                <button onClick={() => setShowViewModal(false)} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Course?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete <strong>{selectedCourse.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedCourse(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteCourse} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Materials Upload Modal */}
      {showMaterialModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Course Materials</h2>
                <p className="text-sm text-gray-500">{selectedCourse.name} ({selectedCourse.code})</p>
              </div>
              <button onClick={() => { setShowMaterialModal(false); setSelectedCourse(null); setMaterialFile(null); setMaterialName(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Upload Form */}
              <form onSubmit={handleUploadMaterial} className="mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Upload New Material</h3>
                {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
                {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                    <input 
                      type="text" 
                      value={materialName} 
                      onChange={(e) => setMaterialName(e.target.value)}
                      placeholder="e.g., Chapter 1 Notes"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, DOC, PPT, Video)</label>
                    <input 
                      type="file" 
                      onChange={(e) => setMaterialFile(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!materialFile || uploadingMaterial}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingMaterial ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Material
                    </>
                  )}
                </button>
              </form>

              {/* Existing Materials */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Uploaded Materials ({selectedCourse.materials?.length || 0})</h3>
                {selectedCourse.materials && selectedCourse.materials.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCourse.materials.map((material) => (
                      <div key={material._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            material.type === 'pdf' ? 'bg-red-100' :
                            material.type === 'video' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {material.type === 'pdf' ? <FileText className={`w-5 h-5 text-red-600`} /> :
                             material.type === 'video' ? <Eye className="w-5 h-5 text-purple-600" /> :
                             <File className="w-5 h-5 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{material.name}</p>
                            <p className="text-xs text-gray-500">
                              {material.type?.toUpperCase()} • {material.size ? `${(material.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • Uploaded {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`http://localhost:5000${material.url}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDeleteMaterial(material._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No materials uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload PDFs, documents, or videos for students</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => { setShowMaterialModal(false); setSelectedCourse(null); }} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourses;
