import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { getPlacements, getPlacementStats, createPlacement, updatePlacement, deletePlacement } from '../../utils/api';
import { 
  Briefcase, Search, Plus, Building, TrendingUp, Users,
  Award, MapPin, DollarSign, Calendar, ExternalLink, Filter,
  X, AlertTriangle, CheckCircle, Download, Trash2, Edit
} from 'lucide-react';

const AdminPlacements = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [formData, setFormData] = useState({ 
    company: '', 
    position: '', 
    driveDate: '', 
    minPackage: '', 
    maxPackage: '', 
    location: '',
    type: 'Full-time',
    eligibility: '', 
    description: '',
    status: 'Upcoming',
    totalSelected: 0
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [stats, setStats] = useState({
    totalPlaced: 0,
    averagePackage: '0 LPA',
    highestPackage: '0 LPA',
    companiesVisited: 0,
    placementRate: 0,
  });

  const [topRecruiters, setTopRecruiters] = useState([]);
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const fetchPlacementData = async () => {
    try {
      setLoading(true);
      
      // Fetch placements
      const { data: placementsData } = await getPlacements();
      setPlacements(placementsData || []);
      
      // Process upcoming drives from placements
      const upcoming = (placementsData || [])
        .filter(p => p.status === 'Upcoming' || p.status === 'Ongoing')
        .slice(0, 4)
        .map(p => ({
          company: p.company,
          date: p.driveDate,
          roles: [p.position],
          eligibility: p.eligibility || 'All Branches',
          package: p.packageRange || (p.package ? `${p.package} LPA` : 'Not specified'),
          status: p.status === 'Ongoing' ? 'Registrations Open' : 'Coming Soon'
        }));
      setUpcomingDrives(upcoming);

      // Fetch placement stats
      try {
        const { data: statsData } = await getPlacementStats();
        setStats({
          totalPlaced: statsData.totalPlaced || 0,
          averagePackage: typeof statsData.averagePackage === 'number' 
            ? `${statsData.averagePackage} LPA` 
            : statsData.averagePackage || '0 LPA',
          highestPackage: typeof statsData.highestPackage === 'number'
            ? `${statsData.highestPackage} LPA`
            : statsData.highestPackage || '0 LPA',
          companiesVisited: statsData.companiesVisited || statsData.totalDrives || placementsData.length || 0,
          placementRate: statsData.placementRate || 0,
        });
        
        // Process top recruiters from stats
        if (statsData.topRecruiters?.length > 0) {
          const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-indigo-100 text-indigo-600'];
          setTopRecruiters(statsData.topRecruiters.map((r, i) => ({
            name: r.name,
            logo: r.name?.charAt(0) || 'C',
            offers: r.offers || 0,
            avgPackage: r.avgPackage || 'N/A',
            color: colors[i % colors.length]
          })));
        } else {
          // Generate top recruiters from placement data
          const companyMap = {};
          (placementsData || []).forEach(p => {
            if (!companyMap[p.company]) {
              companyMap[p.company] = {
                name: p.company,
                offers: p.totalSelected || 0,
                packages: []
              };
            } else {
              companyMap[p.company].offers += p.totalSelected || 0;
            }
            if (p.package) {
              companyMap[p.company].packages.push(p.package);
            }
          });
          
          const recruiters = Object.values(companyMap)
            .filter(c => c.offers > 0)
            .sort((a, b) => b.offers - a.offers)
            .slice(0, 6)
            .map((c, i) => {
              const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-indigo-100 text-indigo-600'];
              const avgPkg = c.packages.length > 0 
                ? (c.packages.reduce((a, b) => a + b, 0) / c.packages.length).toFixed(1) + ' LPA'
                : 'N/A';
              return {
                name: c.name,
                logo: c.name?.charAt(0) || 'C',
                offers: c.offers,
                avgPackage: avgPkg,
                color: colors[i % colors.length]
              };
            });
          setTopRecruiters(recruiters);
        }

        // Process department stats from placement data
        if (statsData.departmentStats?.length > 0) {
          setDepartmentStats(statsData.departmentStats);
        } else {
          setDepartmentStats([]);
        }
      } catch (e) {
        console.log('Stats API not available:', e.message);
        setStats({
          totalPlaced: 0,
          averagePackage: '0 LPA',
          highestPackage: '0 LPA',
          companiesVisited: placementsData?.length || 0,
          placementRate: 0,
        });
        setTopRecruiters([]);
        setDepartmentStats([]);
      }
    } catch (error) {
      console.error('Error fetching placement data:', error);
      setPlacements([]);
      setUpcomingDrives([]);
      setTopRecruiters([]);
      setDepartmentStats([]);
      setStats({
        totalPlaced: 0,
        averagePackage: '0 LPA',
        highestPackage: '0 LPA',
        companiesVisited: 0,
        placementRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrive = async (e) => {
    e.preventDefault(); 
    setFormError(''); 
    setFormSuccess('');
    
    if (!formData.company || !formData.position) { 
      setFormError('Please fill company and position'); 
      return; 
    }
    
    try {
      // Transform data to match backend model
      const placementData = {
        company: formData.company,
        position: formData.position,
        driveDate: formData.driveDate || undefined,
        location: formData.location || undefined,
        type: formData.type,
        eligibility: formData.eligibility || undefined,
        description: formData.description || undefined,
        status: formData.status,
      };
      
      // Add package data
      if (formData.minPackage && formData.maxPackage) {
        placementData.packageRange = `${formData.minPackage}-${formData.maxPackage} LPA`;
        placementData.package = parseFloat(formData.maxPackage);
      } else if (formData.maxPackage) {
        placementData.package = parseFloat(formData.maxPackage);
      }
      
      await createPlacement(placementData);
      setFormSuccess('Placement drive added!');
      setTimeout(() => { 
        setShowAddModal(false); 
        setFormData({ 
          company: '', 
          position: '', 
          driveDate: '', 
          minPackage: '', 
          maxPackage: '', 
          location: '',
          type: 'Full-time',
          eligibility: '', 
          description: '',
          status: 'Upcoming',
          totalSelected: 0
        }); 
        setFormSuccess(''); 
        fetchPlacementData(); 
      }, 1500);
    } catch (error) { 
      setFormError(error.response?.data?.message || 'Error adding drive'); 
    }
  };

  const handleEditClick = (drive) => {
    setSelectedDrive(drive);
    setFormData({
      company: drive.company || '',
      position: drive.position || '',
      driveDate: drive.driveDate ? drive.driveDate.split('T')[0] : '',
      minPackage: '',
      maxPackage: drive.package || '',
      location: drive.location || '',
      type: drive.type || 'Full-time',
      eligibility: drive.eligibility || '',
      description: drive.description || '',
      status: drive.status || 'Upcoming',
      totalSelected: drive.totalSelected || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateDrive = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.company || !formData.position) {
      setFormError('Please fill company and position');
      return;
    }

    try {
      const placementData = {
        company: formData.company,
        position: formData.position,
        driveDate: formData.driveDate || undefined,
        location: formData.location || undefined,
        type: formData.type,
        eligibility: formData.eligibility || undefined,
        description: formData.description || undefined,
        status: formData.status,
        totalSelected: parseInt(formData.totalSelected) || 0,
      };

      if (formData.minPackage && formData.maxPackage) {
        placementData.packageRange = `${formData.minPackage}-${formData.maxPackage} LPA`;
        placementData.package = parseFloat(formData.maxPackage);
      } else if (formData.maxPackage) {
        placementData.package = parseFloat(formData.maxPackage);
      }

      await updatePlacement(selectedDrive._id, placementData);
      setFormSuccess('Placement drive updated!');
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedDrive(null);
        setFormData({
          company: '',
          position: '',
          driveDate: '',
          minPackage: '',
          maxPackage: '',
          location: '',
          type: 'Full-time',
          eligibility: '',
          description: '',
          status: 'Upcoming',
          totalSelected: 0
        });
        setFormSuccess('');
        fetchPlacementData();
      }, 1500);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error updating drive');
    }
  };

  const handleDeleteClick = (drive) => {
    setSelectedDrive(drive);
    setShowDeleteModal(true);
  };

  const handleDeleteDrive = async () => {
    if (!selectedDrive) return;
    try {
      await deletePlacement(selectedDrive._id);
      setShowDeleteModal(false);
      setSelectedDrive(null);
      fetchPlacementData();
    } catch (error) {
      alert('Error deleting drive');
    }
  };

  const handleExport = () => {
    const headers = ['Company', 'Position', 'Date', 'Package Range', 'Status'];
    const csvContent = [headers.join(','), ...upcomingDrives.map(d => [d.company, d.roles?.join(';'), d.date, d.package, d.status].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `placements_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Placement Management</h1>
          <p className="text-gray-500">Track and manage campus placements</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Drive
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-primary-200" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">This Year</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalPlaced}</p>
          <p className="text-primary-100 text-sm">Students Placed</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <DollarSign className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.averagePackage}</p>
          <p className="text-gray-500 text-sm">Average Package</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Award className="w-8 h-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.highestPackage}</p>
          <p className="text-gray-500 text-sm">Highest Package</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <Building className="w-8 h-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.companiesVisited}</p>
          <p className="text-gray-500 text-sm">Companies Visited</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <TrendingUp className="w-8 h-8 text-green-200 mb-2" />
          <p className="text-3xl font-bold">{stats.placementRate}%</p>
          <p className="text-green-100 text-sm">Placement Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Recruiters */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Top Recruiters</h3>
            <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topRecruiters.map((company, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${company.color}`}>
                    {company.logo}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.offers} offers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Avg: <span className="font-semibold text-gray-800">{company.avgPackage}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Department-wise Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Department Wise</h3>
          <div className="space-y-4">
            {departmentStats.map((dept, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.dept}</span>
                  <span className="text-sm text-gray-500">{dept.placed}/{dept.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      dept.percentage >= 90 ? 'bg-green-500' :
                      dept.percentage >= 75 ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Drives */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Upcoming Placement Drives</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                All
              </button>
              <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">
                This Week
              </button>
              <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">
                This Month
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Company</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Roles</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Eligibility</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Package</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {placements.map((drive, index) => (
              <tr key={drive._id || index} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600">
                      {drive.company.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{drive.company}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">{new Date(drive.date).toLocaleDateString()}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    {drive?.roles?.map((role, roleIndex) => (
                      <span key={roleIndex} className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-gray-600">{drive.eligibility}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-medium text-green-600">{drive.package}</span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    drive.status === 'Completed' 
                      ? 'bg-gray-100 text-gray-700' 
                      : drive.status === 'Ongoing'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {drive.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditClick(drive)}
                      className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors"
                      title="Edit Drive"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(drive)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Delete Drive"
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
      </div>

      {/* Add Placement Drive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Add Placement Drive</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddDrive} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Google" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Position *</label><input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., Software Engineer" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Drive Date</label><input type="date" value={formData.driveDate} onChange={(e) => setFormData({...formData, driveDate: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., Bangalore, Hyderabad" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Package (LPA)</label><input type="number" step="0.1" value={formData.minPackage} onChange={(e) => setFormData({...formData, minPackage: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 8" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Package (LPA)</label><input type="number" step="0.1" value={formData.maxPackage} onChange={(e) => setFormData({...formData, maxPackage: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 12" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Contract">Contract</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label><input type="text" value={formData.eligibility} onChange={(e) => setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., CSE, IT, ECE - Min CGPA 7.0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none" rows="3" placeholder="Brief description about the role and company..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option></select></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Placement Drive Modal */}
      {showEditModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Edit Placement Drive</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleUpdateDrive} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
              {formSuccess && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g., Google" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Position *</label><input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., Software Engineer" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Drive Date</label><input type="date" value={formData.driveDate} onChange={(e) => setFormData({...formData, driveDate: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., Bangalore, Hyderabad" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Package (LPA)</label><input type="number" step="0.1" value={formData.minPackage} onChange={(e) => setFormData({...formData, minPackage: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 8" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Package (LPA)</label><input type="number" step="0.1" value={formData.maxPackage} onChange={(e) => setFormData({...formData, maxPackage: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., 12" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option value="Full-time">Full-time</option><option value="Internship">Internship</option><option value="Contract">Contract</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label><input type="text" value={formData.eligibility} onChange={(e) => setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" placeholder="e.g., CSE, IT, ECE - Min CGPA 7.0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none" rows="3" placeholder="Brief description about the role and company..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status *</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option></select></div>
              
              {/* Students Placed Field - Quick Fix for Placement Rate */}
              {/* 
                QUICK FIX IMPLEMENTATION (Current):
                - Manual number input for students placed
                - Updates totalSelected field directly
                - Affects placement rate calculation immediately
                
                FUTURE ENHANCEMENT - Student Selection Feature:
                To implement the complete solution, add:
                1. "Select Students" button below this field
                2. Modal with searchable student list (use getEligibleStudents API)
                3. Multi-select checkboxes for student selection
                4. Call addSelectedStudents API with selected student IDs
                5. Auto-update totalSelected based on selection
                6. Show list of selected students with remove option
                
                Backend API ready:
                - GET /placements/eligible-students (filter by dept, year, placement status)
                - POST /placements/:id/select-students (adds students, updates User.isPlaced)
                
                Benefits of complete solution:
                - Track individual student placements
                - Student profiles show placement status
                - Generate placement reports per student
                - Prevent double-counting (one student = one placement)
              */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Students Placed
                  <span className="text-xs text-gray-500 ml-2">(Affects placement rate)</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.totalSelected} 
                  onChange={(e) => setFormData({...formData, totalSelected: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  placeholder="Number of students placed"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the total number of students who got placed in this drive</p>
                {/* TODO: Add "Select Students" button here for future feature */}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Update Drive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDrive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Delete Placement Drive</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">You are about to delete:</p>
                <p className="font-medium text-gray-800">{selectedDrive.company}</p>
                <p className="text-sm text-gray-600">{selectedDrive.position}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteDrive}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPlacements;
