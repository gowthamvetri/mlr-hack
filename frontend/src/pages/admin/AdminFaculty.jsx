import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { getFaculty, getDepartments, getFacultyStats, createFaculty, deleteFaculty } from '../../utils/api';
import { 
  Users, Search, UserPlus, Download, Mail, Phone,
  School, Building, Award, MoreVertical, Star, BookOpen, X, Trash2, Edit, AlertTriangle, CheckCircle
} from 'lucide-react';

const AdminFaculty = () => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [departments, setDepartments] = useState(['all']);
  const [stats, setStats] = useState({
    total: 0,
    professors: 0,
    avgRating: 0,
    totalCourses: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', department: 'CSE', designation: 'Assistant Professor', experience: '', subjects: [] });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [filterDept]);

  const fetchInitialData = async () => {
    try {
      // Fetch departments
      const { data } = await getDepartments();
      const deptCodes = data.map(d => d.code);
      setDepartments(['all', ...deptCodes]);

      // Fetch faculty stats
      try {
        const statsRes = await getFacultyStats();
        setStats({
          total: statsRes.data.totalFaculty || 0,
          professors: statsRes.data.professors || 0,
          avgRating: statsRes.data.avgRating || 0,
          totalCourses: statsRes.data.totalCourses || 0
        });
      } catch (e) {
        console.log('Stats not available');
      }
    } catch (error) {
      console.log('Using default departments');
      setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
    }
  };

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept !== 'all') params.department = filterDept;
      const { data } = await getFaculty(params);
      setFaculty(data);
      
      // Calculate stats from data
      const total = data.length;
      const professors = data.filter(f => f.designation?.includes('Professor')).length;
      const avgRating = total > 0 ? (data.reduce((acc, f) => acc + (f.rating || 0), 0) / total).toFixed(1) : 0;
      const totalCourses = data.reduce((acc, f) => acc + (f.subjects?.length || 0), 0);
      setStats({ total, professors, avgRating, totalCourses });
    } catch (error) {
      console.error('Error fetching faculty:', error);
      // Mock faculty data
      const mockData = [
        { _id: '1', name: 'Dr. Rajesh Kumar', email: 'rajesh@mlrit.ac.in', department: 'CSE', designation: 'Professor', experience: '15 years', courses: 4, rating: 4.8, status: 'Active' },
        { _id: '2', name: 'Dr. Priya Sharma', email: 'priya@mlrit.ac.in', department: 'ECE', designation: 'Associate Professor', experience: '12 years', courses: 3, rating: 4.6, status: 'Active' },
        { _id: '3', name: 'Prof. Amit Singh', email: 'amit@mlrit.ac.in', department: 'CSE', designation: 'Assistant Professor', experience: '8 years', courses: 5, rating: 4.5, status: 'Active' },
        { _id: '4', name: 'Dr. Meera Patel', email: 'meera@mlrit.ac.in', department: 'MECH', designation: 'Professor', experience: '20 years', courses: 2, rating: 4.9, status: 'Active' },
        { _id: '5', name: 'Prof. Vikram Reddy', email: 'vikram@mlrit.ac.in', department: 'IT', designation: 'Assistant Professor', experience: '5 years', courses: 4, rating: 4.3, status: 'On Leave' },
      ];
      setFaculty(mockData);
      setStats({
        total: mockData.length,
        professors: mockData.filter(f => f.designation.includes('Professor')).length,
        avgRating: (mockData.reduce((acc, f) => acc + f.rating, 0) / mockData.length).toFixed(1),
        totalCourses: mockData.reduce((acc, f) => acc + f.courses, 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.email) { setFormError('Please fill in all required fields'); return; }
    try {
      await createFaculty(formData);
      setFormSuccess('Faculty added successfully!');
      setTimeout(() => { setShowAddModal(false); setFormData({ name: '', email: '', department: 'CSE', designation: 'Assistant Professor', experience: '', subjects: [] }); setFormSuccess(''); fetchFaculty(); }, 1500);
    } catch (error) { setFormError(error.response?.data?.message || 'Error adding faculty'); }
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
    try { await deleteFaculty(selectedFaculty._id); setShowDeleteModal(false); setSelectedFaculty(null); fetchFaculty(); }
    catch (error) { alert('Error deleting faculty'); }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Department', 'Designation', 'Experience', 'Rating', 'Status'];
    const csvContent = [headers.join(','), ...filteredFaculty.map(f => [f.name, f.email, f.department, f.designation, f.experience, f.rating, f.status || 'Active'].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `faculty_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || f.department === filterDept || f.department?.code === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faculty Management</h1>
          <p className="text-gray-500">Manage teaching faculty and their assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Faculty
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Faculty</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <School className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Professors</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.professors}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
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
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Courses</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCourses}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
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
                placeholder="Search faculty by name or email..."
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
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((member) => (
          <div key={member._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-xl">
                    {member.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.designation}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4 text-gray-400" />
                <span>{member.department} Department</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4 text-gray-400" />
                <span>{member.experience} experience</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-800">{member.rating}</span>
                <span className="text-gray-400 text-sm">/5.0</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{member.courses} courses</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                member.status === 'Active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
          <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No faculty found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New Faculty</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddFaculty} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Dr. Faculty Name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="faculty@mlrit.ac.in" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><select value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience</label><input type="text" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 10 years" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Faculty?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete <strong>{selectedFaculty.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedFaculty(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteFaculty} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminFaculty;
