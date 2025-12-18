import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { getPlacements, getPlacementStats, createPlacement, updatePlacement, deletePlacement } from '../../utils/api';
import gsap from 'gsap';
import {
  Briefcase, Search, Plus, Building, TrendingUp, Users,
  Award, MapPin, DollarSign, Calendar, Download, Trash2, Edit, X, AlertTriangle, CheckCircle
} from 'lucide-react';

// Animated Counter
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = prevValue.current;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newVal = start + (end - start) * eased;
      setDisplayValue(suffix === '%' ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };
    requestAnimationFrame(animate);
  }, [value, suffix]);

  return <span className="tabular-nums">{displayValue}{suffix}</span>;
};

const AdminPlacements = () => {
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [formData, setFormData] = useState({ company: '', position: '', driveDate: '', minPackage: '', maxPackage: '', location: '', type: 'Full-time', eligibility: '', description: '', status: 'Upcoming', totalSelected: 0 });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [stats, setStats] = useState({ totalPlaced: 0, averagePackage: '0 LPA', highestPackage: '0 LPA', companiesVisited: 0, placementRate: 0 });
  const [topRecruiters, setTopRecruiters] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);

  useEffect(() => { fetchPlacementData(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    if (!socket) return;
    socket.on('placement_created', fetchPlacementData);
    socket.on('placement_updated', fetchPlacementData);
    socket.on('placement_deleted', fetchPlacementData);
    return () => { socket.off('placement_created'); socket.off('placement_updated'); socket.off('placement_deleted'); };
  }, [socket]);

  const fetchPlacementData = async () => {
    try {
      setLoading(true);
      const { data: placementsData } = await getPlacements();
      setPlacements(placementsData || []);

      try {
        const { data: statsData } = await getPlacementStats();
        setStats({
          totalPlaced: statsData.totalPlaced || 0,
          averagePackage: typeof statsData.averagePackage === 'number' ? `${statsData.averagePackage} LPA` : statsData.averagePackage || '0 LPA',
          highestPackage: typeof statsData.highestPackage === 'number' ? `${statsData.highestPackage} LPA` : statsData.highestPackage || '0 LPA',
          companiesVisited: statsData.companiesVisited || statsData.totalDrives || placementsData.length || 0,
          placementRate: statsData.placementRate || 0,
        });
        if (statsData.topRecruiters?.length) {
          const colors = ['bg-red-50 text-red-600', 'bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-violet-50 text-violet-600'];
          setTopRecruiters(statsData.topRecruiters.map((r, i) => ({ name: r.name, logo: r.name?.charAt(0) || 'C', offers: r.offers || 0, avgPackage: r.avgPackage || 'N/A', color: colors[i % colors.length] })));
        }
        if (statsData.departmentStats?.length) setDepartmentStats(statsData.departmentStats);
      } catch (e) {
        setStats({ totalPlaced: 0, averagePackage: '0 LPA', highestPackage: '0 LPA', companiesVisited: placementsData?.length || 0, placementRate: 0 });
      }
    } catch (error) { console.error('Error:', error); setPlacements([]); }
    finally { setLoading(false); }
  };

  const handleAddDrive = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.company || !formData.position) { setFormError('Fill required fields'); return; }
    try {
      const placementData = { company: formData.company, position: formData.position, driveDate: formData.driveDate || undefined, location: formData.location, type: formData.type, eligibility: formData.eligibility, description: formData.description, status: formData.status };
      if (formData.minPackage && formData.maxPackage) { placementData.packageRange = `${formData.minPackage}-${formData.maxPackage} LPA`; placementData.package = parseFloat(formData.maxPackage); }
      else if (formData.maxPackage) placementData.package = parseFloat(formData.maxPackage);
      await createPlacement(placementData);
      setFormSuccess('Added!');
      setTimeout(() => { setShowAddModal(false); setFormData({ company: '', position: '', driveDate: '', minPackage: '', maxPackage: '', location: '', type: 'Full-time', eligibility: '', description: '', status: 'Upcoming', totalSelected: 0 }); setFormSuccess(''); fetchPlacementData(); }, 1000);
    } catch (error) { setFormError(error.response?.data?.message || 'Error'); }
  };

  const handleEditClick = (drive) => { setSelectedDrive(drive); setFormData({ company: drive.company || '', position: drive.position || '', driveDate: drive.driveDate ? drive.driveDate.split('T')[0] : '', minPackage: '', maxPackage: drive.package || '', location: drive.location || '', type: drive.type || 'Full-time', eligibility: drive.eligibility || '', description: drive.description || '', status: drive.status || 'Upcoming', totalSelected: drive.totalSelected || 0 }); setShowEditModal(true); };

  const handleUpdateDrive = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.company || !formData.position) { setFormError('Fill required fields'); return; }
    try {
      const placementData = { company: formData.company, position: formData.position, driveDate: formData.driveDate || undefined, location: formData.location, type: formData.type, eligibility: formData.eligibility, description: formData.description, status: formData.status, totalSelected: parseInt(formData.totalSelected) || 0 };
      if (formData.minPackage && formData.maxPackage) { placementData.packageRange = `${formData.minPackage}-${formData.maxPackage} LPA`; placementData.package = parseFloat(formData.maxPackage); }
      else if (formData.maxPackage) placementData.package = parseFloat(formData.maxPackage);
      await updatePlacement(selectedDrive._id, placementData);
      setFormSuccess('Updated!');
      setTimeout(() => { setShowEditModal(false); setSelectedDrive(null); setFormData({ company: '', position: '', driveDate: '', minPackage: '', maxPackage: '', location: '', type: 'Full-time', eligibility: '', description: '', status: 'Upcoming', totalSelected: 0 }); setFormSuccess(''); fetchPlacementData(); }, 1000);
    } catch (error) { setFormError(error.response?.data?.message || 'Error'); }
  };

  const handleDeleteDrive = async () => {
    if (!selectedDrive) return;
    try { await deletePlacement(selectedDrive._id); setShowDeleteModal(false); setSelectedDrive(null); fetchPlacementData(); }
    catch (error) { alert('Error deleting'); }
  };

  const handleExport = () => {
    const headers = ['Company', 'Position', 'Date', 'Package', 'Status'];
    const csvContent = [headers.join(','), ...placements.map(d => [d.company, d.position, d.driveDate, d.package, d.status].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `placements_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Placement Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Track and manage campus placements</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"><Download className="w-4 h-4" />Export</button>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"><Plus className="w-4 h-4" />Add Drive</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Students Placed', value: stats.totalPlaced, icon: Users, color: 'violet' },
            { label: 'Avg Package', value: stats.averagePackage, icon: DollarSign, color: 'emerald', isString: true },
            { label: 'Top Package', value: stats.highestPackage, icon: Award, color: 'amber', isString: true },
            { label: 'Companies', value: stats.companiesVisited, icon: Building, color: 'blue' },
            { label: 'Placement Rate', value: stats.placementRate, icon: TrendingUp, color: 'emerald', suffix: '%' },
          ].map((stat, i) => {
            const colorMap = { violet: 'bg-violet-50 text-violet-500', emerald: 'bg-emerald-50 text-emerald-500', amber: 'bg-amber-50 text-amber-500', blue: 'bg-blue-50 text-blue-500' };
            return (
              <div key={i} className="metric-card bg-white rounded-xl p-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className={`w-9 h-9 rounded-lg ${colorMap[stat.color].split(' ')[0]} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-4.5 h-4.5 ${colorMap[stat.color].split(' ')[1]}`} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-xl font-semibold text-zinc-900">{stat.isString ? stat.value : <AnimatedNumber value={stat.value} suffix={stat.suffix || ''} />}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Recruiters */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-100 p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Top Recruiters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topRecruiters.slice(0, 6).map((c, i) => (
                <div key={i} className="p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm ${c.color}`}>{c.logo}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900 text-sm truncate">{c.name}</p>
                      <p className="text-[10px] text-zinc-500">{c.offers} offers</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Avg: <span className="font-medium text-zinc-700">{c.avgPackage}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Department Stats */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Department Wise</h3>
            <div className="space-y-3">
              {departmentStats.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-600">{d.dept}</span>
                    <span className="text-[10px] text-zinc-500">{d.placed}/{d.total}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.percentage >= 90 ? 'bg-emerald-500' : d.percentage >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Placements Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="p-5 border-b border-zinc-100">
            <h3 className="font-semibold text-zinc-900">All Placement Drives</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Company</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Position</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Date</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Package</th>
                <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {placements.map(d => (
                <tr key={d._id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center font-semibold text-zinc-600 text-sm">{d.company.charAt(0)}</div>
                      <span className="font-medium text-zinc-900 text-sm">{d.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{d.position}</td>
                  <td className="px-6 py-4 text-xs text-zinc-500">{d.driveDate ? new Date(d.driveDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">{d.package ? `${d.package} LPA` : d.packageRange || '-'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${d.status === 'Completed' ? 'bg-zinc-100 text-zinc-600' : d.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{d.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEditClick(d)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedDrive(d); setShowDeleteModal(true); }} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {placements.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-zinc-500">No placement drives yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Placement Drive" size="lg">
        <form onSubmit={handleAddDrive} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company *</label><input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Position *</label><input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Date</label><input type="date" value={formData.driveDate} onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Min Package (LPA)</label><input type="number" step="0.1" value={formData.minPackage} onChange={(e) => setFormData({ ...formData, minPackage: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Max Package (LPA)</label><input type="number" step="0.1" value={formData.maxPackage} onChange={(e) => setFormData({ ...formData, maxPackage: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          </div>
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option></select></div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">Add Drive</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal && !!selectedDrive} onClose={() => setShowEditModal(false)} title="Edit Placement Drive" size="lg">
        <form onSubmit={handleUpdateDrive} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs flex items-center gap-2"><CheckCircle className="w-4 h-4" />{formSuccess}</div>}
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company *</label><input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Position *</label><input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Date</label><input type="date" value={formData.driveDate} onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Min Package</label><input type="number" step="0.1" value={formData.minPackage} onChange={(e) => setFormData({ ...formData, minPackage: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Max Package</label><input type="number" step="0.1" value={formData.maxPackage} onChange={(e) => setFormData({ ...formData, maxPackage: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          </div>
          <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option></select></div>
          <div className="border-t border-zinc-100 pt-4"><label className="block text-xs font-medium text-zinc-500 mb-1.5">Students Placed</label><input type="number" min="0" value={formData.totalSelected} onChange={(e) => setFormData({ ...formData, totalSelected: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">Update</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal && !!selectedDrive} onClose={() => setShowDeleteModal(false)} title="Delete Drive" size="md">
        {selectedDrive && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <p className="text-sm text-zinc-600 mb-1">Delete <span className="font-medium text-zinc-900">{selectedDrive.company}</span>?</p>
            <p className="text-xs text-zinc-500 mb-4">{selectedDrive.position}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
              <button onClick={handleDeleteDrive} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default AdminPlacements;
