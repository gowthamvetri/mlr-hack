import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { getUsers, getDepartments, deleteUser } from '../../utils/api';
import axios from 'axios';
import { 
  Users, Search, Filter, UserPlus, Download, Mail, 
  GraduationCap, Building, ChevronDown, MoreVertical, X,
  Trash2, Edit, Eye, AlertTriangle, CheckCircle
} from 'lucide-react';

const AdminStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [departments, setDepartments] = useState(['all']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', department: 'CSE', year: '1', rollNumber: '', role: 'Student'
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const years = ['all', '1', '2', '3', '4'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filterDept, filterYear]);

  const fetchInitialData = async () => {
    try {
      // Fetch departments
      const { data } = await getDepartments();
      const deptCodes = data.map(d => d.code);
      setDepartments(['all', ...deptCodes]);
    } catch (error) {
      console.log('Using default departments');
      setDepartments(['all', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { role: 'Student' };
      if (filterDept !== 'all') params.department = filterDept;
      const { data } = await getUsers(params);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Mock data for demo
      setStudents([
        { _id: '1', name: 'John Doe', email: 'john@mlrit.ac.in', department: 'CSE', year: '3', rollNumber: '20CS101', status: 'Active' },
        { _id: '2', name: 'Jane Smith', email: 'jane@mlrit.ac.in', department: 'ECE', year: '2', rollNumber: '21EC045', status: 'Active' },
        { _id: '3', name: 'Mike Johnson', email: 'mike@mlrit.ac.in', department: 'CSE', year: '4', rollNumber: '19CS078', status: 'Active' },
        { _id: '4', name: 'Sarah Williams', email: 'sarah@mlrit.ac.in', department: 'MECH', year: '1', rollNumber: '22ME032', status: 'Active' },
        { _id: '5', name: 'David Brown', email: 'david@mlrit.ac.in', department: 'IT', year: '3', rollNumber: '20IT056', status: 'Inactive' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.name || !formData.email || !formData.password || !formData.rollNumber) {
      setFormError('Please fill in all required fields'); return;
    }
    try {
      const API = axios.create({ baseURL: '/api' });
      await API.post('/users', formData);
      setFormSuccess('Student added successfully!');
      setTimeout(() => {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', department: 'CSE', year: '1', rollNumber: '', role: 'Student' });
        setFormSuccess(''); fetchStudents();
      }, 1500);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error adding student');
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      await deleteUser(selectedStudent._id);
      setShowDeleteModal(false); setSelectedStudent(null); fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Status'];
    const csvContent = [headers.join(','), ...filteredStudents.map(s => 
      [s.name, s.email, s.rollNumber, s.department, s.year, s.status || 'Active'].join(',')
    )].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || s.department === filterDept;
    const matchesYear = filterYear === 'all' || s.year === filterYear;
    return matchesSearch && matchesDept && matchesYear;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'Active').length,
    byDept: departments.slice(1).map(d => ({
      dept: d,
      count: students.filter(s => s.department === d).length
    }))
  };

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-500">Manage and view all enrolled students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Departments</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{departments.length - 1}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Attendance</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">87%</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
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
                placeholder="Search students by name, email, or roll number..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.slice(1).map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Student</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Roll Number</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Department</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Year</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {student.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-gray-700">{student.rollNumber}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {student.department}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-700">Year {student.year}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button 
                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Enter student name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="student@mlrit.ac.in" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Create a password" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label><input type="text" value={formData.rollNumber} onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., 20CS101" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white">{departments.slice(1).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Student?</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete <strong>{selectedStudent.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteStudent} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminStudents;
