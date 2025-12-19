import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import {
  getPlacements, getPlacementStats, createPlacement, updatePlacement, deletePlacement,
  getAdminPlacementSlides, createPlacementSlide, updatePlacementSlide, deletePlacementSlide,
  getAdminRecruiters, createRecruiter, updateRecruiter, deleteRecruiter,
  getAdminTrainingContent, createTrainingContent, updateTrainingContent, deleteTrainingContent,
  addSelectedStudents, getEligibleStudents, getPlacementById,
} from '../../utils/api';
import gsap from 'gsap';
import {
  Briefcase, Search, Plus, Building, TrendingUp, Users,
  Award, MapPin, DollarSign, Calendar, Download, Trash2, Edit, X, AlertTriangle, CheckCircle,
  Image, Building2, BookOpen, Edit2, Save, Sparkles, UserCheck, Eye, GraduationCap
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

  // Tab state - 'drives' for placement management, 'content' for page content
  const [activeMainTab, setActiveMainTab] = useState('drives');

  // Placement Drives state
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

  // Page Content state (from AdminPlacementPage)
  const [activeContentTab, setActiveContentTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [training, setTraining] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [contentFormData, setContentFormData] = useState({});

  // Student Selection state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentSaveLoading, setStudentSaveLoading] = useState(false);
  const [viewingDrive, setViewingDrive] = useState(null);

  // Fetch placement drives
  useEffect(() => { fetchPlacementData(); }, []);

  // Fetch page content
  useEffect(() => { fetchContentData(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.metric-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading, activeMainTab]);

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
      // Ensure placements is always an array
      setPlacements(Array.isArray(placementsData) ? placementsData : (placementsData?.placements || []));

      try {
        const { data: statsData } = await getPlacementStats();
        const placementsArray = Array.isArray(placementsData) ? placementsData : (placementsData?.placements || []);
        setStats({
          totalPlaced: statsData.totalPlaced || 0,
          averagePackage: typeof statsData.averagePackage === 'number' ? `${statsData.averagePackage} LPA` : statsData.averagePackage || '0 LPA',
          highestPackage: typeof statsData.highestPackage === 'number' ? `${statsData.highestPackage} LPA` : statsData.highestPackage || '0 LPA',
          companiesVisited: statsData.companiesVisited || statsData.totalDrives || placementsArray.length || 0,
          placementRate: statsData.placementRate || 0,
        });
        if (statsData.topRecruiters?.length) {
          const colors = ['bg-red-50 text-red-600', 'bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-violet-50 text-violet-600'];
          setTopRecruiters(statsData.topRecruiters.map((r, i) => ({ name: r.name, logo: r.name?.charAt(0) || 'C', offers: r.offers || 0, avgPackage: r.avgPackage || 'N/A', color: colors[i % colors.length] })));
        }
        if (statsData.departmentStats?.length) setDepartmentStats(statsData.departmentStats);
      } catch (e) {
        const placementsArray = Array.isArray(placementsData) ? placementsData : [];
        setStats({ totalPlaced: 0, averagePackage: '0 LPA', highestPackage: '0 LPA', companiesVisited: placementsArray.length || 0, placementRate: 0 });
      }
    } catch (error) { console.error('Error:', error); setPlacements([]); }
    finally { setLoading(false); }
  };

  const fetchContentData = async () => {
    try {
      const [slidesRes, recruitersRes, trainingRes] = await Promise.all([
        getAdminPlacementSlides(), getAdminRecruiters(), getAdminTrainingContent()
      ]);
      setSlides(slidesRes.data);
      setRecruiters(recruitersRes.data);
      setTraining(trainingRes.data);
    } catch (error) { console.error('Error:', error); }
    finally { setContentLoading(false); }
  };

  // Placement Drive Handlers
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
    const headers = ['Company', 'Position', 'Date', 'Package', 'Status', 'Students Placed'];
    const csvContent = [headers.join(','), ...placements.map(d => [d.company, d.position, d.driveDate, d.package, d.status, d.totalSelected || 0].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `placements_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  // Student Selection Handlers
  const handleOpenStudentModal = async (drive) => {
    setViewingDrive(drive);
    setStudentLoading(true);
    setShowStudentModal(true);
    setStudentSearchQuery('');

    try {
      // Fetch eligible students
      const { data: students } = await getEligibleStudents({ onlyUnplaced: 'false' });
      setEligibleStudents(students || []);

      // Get current selected students for this drive
      const { data: driveDetails } = await getPlacementById(drive._id);
      const currentSelected = driveDetails?.selectedStudents?.map(s => s._id) || [];
      setSelectedStudentIds(currentSelected);
    } catch (error) {
      console.error('Error fetching students:', error);
      setEligibleStudents([]);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(s => s._id);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleSaveSelectedStudents = async () => {
    if (!viewingDrive) return;

    setStudentSaveLoading(true);
    try {
      await addSelectedStudents(viewingDrive._id, selectedStudentIds);
      setShowStudentModal(false);
      setViewingDrive(null);
      setSelectedStudentIds([]);
      fetchPlacementData();
    } catch (error) {
      console.error('Error saving students:', error);
      alert('Error saving selected students');
    } finally {
      setStudentSaveLoading(false);
    }
  };

  const filteredStudents = eligibleStudents.filter(s => {
    if (!studentSearchQuery) return true;
    const query = studentSearchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.rollNumber?.toLowerCase().includes(query) ||
      s.department?.toLowerCase().includes(query);
  });

  // Page Content Handlers
  const handleContentAdd = () => {
    setEditingItem(null);
    if (activeContentTab === 'slides') setContentFormData({ title: '', studentName: '', rollNumber: '', company: '', package: '', image: '', batch: '', isActive: true });
    else if (activeContentTab === 'recruiters') setContentFormData({ name: '', logo: '', website: '', category: 'Regular', isActive: true });
    else setContentFormData({ type: 'Industry Ready', title: '', points: [''], isActive: true });
    setShowContentModal(true);
  };

  const handleContentEdit = (item) => {
    setEditingItem(item);
    setContentFormData(activeContentTab === 'training' ? { ...item, points: item.points || [''] } : { ...item });
    setShowContentModal(true);
  };

  const handleContentDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (activeContentTab === 'slides') { await deletePlacementSlide(id); setSlides(slides.filter(s => s._id !== id)); }
      else if (activeContentTab === 'recruiters') { await deleteRecruiter(id); setRecruiters(recruiters.filter(r => r._id !== id)); }
      else { await deleteTrainingContent(id); setTraining(training.filter(t => t._id !== id)); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeContentTab === 'slides') {
        if (editingItem) { const res = await updatePlacementSlide(editingItem._id, contentFormData); setSlides(slides.map(s => s._id === editingItem._id ? res.data : s)); }
        else { const res = await createPlacementSlide(contentFormData); setSlides([...slides, res.data]); }
      } else if (activeContentTab === 'recruiters') {
        if (editingItem) { const res = await updateRecruiter(editingItem._id, contentFormData); setRecruiters(recruiters.map(r => r._id === editingItem._id ? res.data : r)); }
        else { const res = await createRecruiter(contentFormData); setRecruiters([...recruiters, res.data]); }
      } else {
        const cleanedData = { ...contentFormData, points: contentFormData.points.filter(p => p.trim()) };
        if (editingItem) { const res = await updateTrainingContent(editingItem._id, cleanedData); setTraining(training.map(t => t._id === editingItem._id ? res.data : t)); }
        else { const res = await createTrainingContent(cleanedData); setTraining([...training, res.data]); }
      }
      setShowContentModal(false);
    } catch (error) { console.error('Error:', error); }
  };

  const addPoint = () => setContentFormData({ ...contentFormData, points: [...contentFormData.points, ''] });
  const updatePoint = (idx, val) => { const pts = [...contentFormData.points]; pts[idx] = val; setContentFormData({ ...contentFormData, points: pts }); };
  const removePoint = (idx) => setContentFormData({ ...contentFormData, points: contentFormData.points.filter((_, i) => i !== idx) });

  const contentTabs = [
    { id: 'slides', label: 'Placement Slides', icon: Image, count: slides.length },
    { id: 'recruiters', label: 'Recruiters', icon: Building2, count: recruiters.length },
    { id: 'training', label: 'Training Content', icon: BookOpen, count: training.length },
  ];

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Placements</h1>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-zinc-500 text-sm mt-0.5">Manage placement drives and page content</p>
          </div>
          <div className="flex gap-2">
            {activeMainTab === 'drives' && (
              <>
                <button onClick={handleExport} className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"><Download className="w-4 h-4" />Export</button>
                <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"><Plus className="w-4 h-4" />Add Drive</button>
              </>
            )}
            {activeMainTab === 'content' && (
              <button onClick={handleContentAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all"><Plus className="w-4 h-4" />Add New</button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 pb-0">
          <button
            onClick={() => setActiveMainTab('drives')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeMainTab === 'drives' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-700'}`}
          >
            <Briefcase className="w-4 h-4" />Placement Drives
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeMainTab === 'drives' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{placements.length}</span>
          </button>
          <button
            onClick={() => setActiveMainTab('content')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeMainTab === 'content' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-500 border-transparent hover:text-zinc-700'}`}
          >
            <Image className="w-4 h-4" />Page Content
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeMainTab === 'content' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{slides.length + recruiters.length + training.length}</span>
          </button>
        </div>

        {/* DRIVES TAB CONTENT */}
        {activeMainTab === 'drives' && (
          <>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Company</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Position</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Date</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Package</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Selected</th>
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleOpenStudentModal(d)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${d.totalSelected > 0
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {d.totalSelected || 0} Students
                          </button>
                        </td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${d.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : d.status === 'Ongoing' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{d.status}</span></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenStudentModal(d)} className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg" title="Manage Selected Students"><Users className="w-4 h-4" /></button>
                            <button onClick={() => handleEditClick(d)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Drive"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => { setSelectedDrive(d); setShowDeleteModal(true); }} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete Drive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {placements.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-zinc-500">No placement drives yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* CONTENT TAB */}
        {activeMainTab === 'content' && (
          <>
            {/* Content Sub-Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {contentTabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveContentTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeContentTab === tab.id ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeContentTab === tab.id ? 'bg-white/20' : 'bg-zinc-100 text-zinc-500'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="tab-content bg-white rounded-xl border border-zinc-100 overflow-hidden">
                {/* Slides */}
                {activeContentTab === 'slides' && (
                  <table className="w-full">
                    <thead><tr className="border-b border-zinc-100">
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Image</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Title</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Student</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Company</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Package</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {slides.map(s => (
                        <tr key={s._id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4"><img src={s.image || '/placeholder.jpg'} alt="" className="w-14 h-10 object-cover rounded" /></td>
                          <td className="px-6 py-4 font-medium text-zinc-900 text-sm">{s.title}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{s.studentName || '-'}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{s.company}</td>
                          <td className="px-6 py-4 text-sm font-medium text-emerald-600">{s.package}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${s.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleContentEdit(s)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleContentDelete(s._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {slides.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-zinc-500">No slides yet</td></tr>}
                    </tbody>
                  </table>
                )}

                {/* Recruiters */}
                {activeContentTab === 'recruiters' && (
                  <table className="w-full">
                    <thead><tr className="border-b border-zinc-100">
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Logo</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Name</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Category</th>
                      <th className="px-6 py-3 text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-3 text-right text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-50">
                      {recruiters.map(r => (
                        <tr key={r._id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4"><img src={r.logo || '/placeholder.jpg'} alt="" className="h-8 object-contain" /></td>
                          <td className="px-6 py-4 font-medium text-zinc-900 text-sm">{r.name}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${r.category === 'Top' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-600'}`}>{r.category}</span></td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-medium ${r.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleContentEdit(r)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleContentDelete(r._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {recruiters.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-zinc-500">No recruiters yet</td></tr>}
                    </tbody>
                  </table>
                )}

                {/* Training */}
                {activeContentTab === 'training' && (
                  <div className="divide-y divide-zinc-50">
                    {training.map(t => (
                      <div key={t._id} className="p-5 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-medium ${t.type === 'Industry Ready' ? 'bg-violet-50 text-violet-600' : 'bg-zinc-100 text-zinc-600'}`}>{t.type}</span>
                            <h3 className="font-medium text-zinc-900 text-sm">{t.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-[10px] ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleContentEdit(t)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleContentDelete(t._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <ul className="text-xs text-zinc-500 space-y-1 ml-4">
                          {t.points?.slice(0, 3).map((p, i) => <li key={i} className="list-disc">{p}</li>)}
                          {t.points?.length > 3 && <li className="text-zinc-400">+{t.points.length - 3} more</li>}
                        </ul>
                      </div>
                    ))}
                    {training.length === 0 && <div className="p-12 text-center text-sm text-zinc-500">No training content yet</div>}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Drive Modal */}
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

      {/* Edit Drive Modal */}
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

      {/* Delete Drive Modal */}
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

      {/* Content Modal */}
      <Modal isOpen={showContentModal} onClose={() => setShowContentModal(false)} title={`${editingItem ? 'Edit' : 'Add'} ${activeContentTab === 'slides' ? 'Slide' : activeContentTab === 'recruiters' ? 'Recruiter' : 'Training'}`} size="lg">
        <form onSubmit={handleContentSubmit} className="space-y-4">
          {activeContentTab === 'slides' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label><input type="text" value={contentFormData.title || ''} onChange={e => setContentFormData({ ...contentFormData, title: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Student</label><input type="text" value={contentFormData.studentName || ''} onChange={e => setContentFormData({ ...contentFormData, studentName: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Roll Number</label><input type="text" value={contentFormData.rollNumber || ''} onChange={e => setContentFormData({ ...contentFormData, rollNumber: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company *</label><input type="text" value={contentFormData.company || ''} onChange={e => setContentFormData({ ...contentFormData, company: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Package</label><input type="text" value={contentFormData.package || ''} onChange={e => setContentFormData({ ...contentFormData, package: e.target.value })} placeholder="₹25 LPA" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              </div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Image URL *</label><input type="url" value={contentFormData.image || ''} onChange={e => setContentFormData({ ...contentFormData, image: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={contentFormData.isActive} onChange={e => setContentFormData({ ...contentFormData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          {activeContentTab === 'recruiters' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company Name *</label><input type="text" value={contentFormData.name || ''} onChange={e => setContentFormData({ ...contentFormData, name: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Logo URL *</label><input type="url" value={contentFormData.logo || ''} onChange={e => setContentFormData({ ...contentFormData, logo: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Website</label><input type="url" value={contentFormData.website || ''} onChange={e => setContentFormData({ ...contentFormData, website: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label><select value={contentFormData.category || 'Regular'} onChange={e => setContentFormData({ ...contentFormData, category: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Top">Top</option><option value="Regular">Regular</option><option value="Partner">Partner</option></select></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={contentFormData.isActive} onChange={e => setContentFormData({ ...contentFormData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          {activeContentTab === 'training' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label><select value={contentFormData.type || 'Industry Ready'} onChange={e => setContentFormData({ ...contentFormData, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Industry Ready">Industry Ready</option><option value="Domain">Domain</option></select></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label><input type="text" value={contentFormData.title || ''} onChange={e => setContentFormData({ ...contentFormData, title: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Points</label>
                <div className="space-y-2">
                  {contentFormData.points?.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={p} onChange={e => updatePoint(i, e.target.value)} className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" placeholder={`Point ${i + 1}`} />
                      <button type="button" onClick={() => removePoint(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addPoint} className="text-xs text-violet-600 hover:underline">+ Add Point</button>
                </div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={contentFormData.isActive} onChange={e => setContentFormData({ ...contentFormData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowContentModal(false)} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"><Save className="w-4 h-4" />Save</button>
          </div>
        </form>
      </Modal>

      {/* Student Selection Modal */}
      <Modal isOpen={showStudentModal} onClose={() => { setShowStudentModal(false); setViewingDrive(null); }} title={`Manage Selected Students - ${viewingDrive?.company || ''}`} size="xl">
        <div className="space-y-4">
          {/* Header with stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{viewingDrive?.position}</p>
                  <p className="text-xs text-zinc-500">{viewingDrive?.package ? `${viewingDrive.package} LPA` : viewingDrive?.packageRange || 'Package TBD'}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">{selectedStudentIds.length} Selected</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search students by name, email, roll number..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s._id))
                ? 'Deselect All Visible'
                : 'Select All Visible'}
            </button>
            <span className="text-xs text-zinc-500">{filteredStudents.length} students found</span>
          </div>

          {/* Students List */}
          <div className="max-h-[400px] overflow-y-auto border border-zinc-100 rounded-lg">
            {studentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                {studentSearchQuery ? 'No students match your search' : 'No students available'}
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {filteredStudents.map(student => (
                  <div
                    key={student._id}
                    onClick={() => handleToggleStudent(student._id)}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${selectedStudentIds.includes(student._id)
                        ? 'bg-violet-50 hover:bg-violet-100'
                        : 'hover:bg-zinc-50'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedStudentIds.includes(student._id)
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-zinc-300'
                      }`}>
                      {selectedStudentIds.includes(student._id) && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-900 text-sm truncate">{student.name}</p>
                        {student.isPlaced && student.placementCompany !== viewingDrive?.company && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded">
                            Placed at {student.placementCompany}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-zinc-500">{student.rollNumber}</p>
                        <p className="text-xs text-zinc-400">{student.email}</p>
                        {student.department && (
                          <span className="text-xs text-zinc-400">{student.department}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              {selectedStudentIds.length > 0
                ? `${selectedStudentIds.length} student${selectedStudentIds.length > 1 ? 's' : ''} will be marked as placed at ${viewingDrive?.company}`
                : 'No students selected'
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowStudentModal(false); setViewingDrive(null); }}
                className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSelectedStudents}
                disabled={studentSaveLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {studentSaveLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Selection
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminPlacements;
