import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import gsap from 'gsap';
import { Image, Building2, BookOpen, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  getAdminPlacementSlides, createPlacementSlide, updatePlacementSlide, deletePlacementSlide,
  getAdminRecruiters, createRecruiter, updateRecruiter, deleteRecruiter,
  getAdminTrainingContent, createTrainingContent, updateTrainingContent, deleteTrainingContent,
} from '../../utils/api';

const AdminPlacementPage = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.tab-content', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [loading, activeTab]);

  const fetchData = async () => {
    try {
      const [slidesRes, recruitersRes, trainingRes] = await Promise.all([
        getAdminPlacementSlides(), getAdminRecruiters(), getAdminTrainingContent()
      ]);
      setSlides(slidesRes.data);
      setRecruiters(recruitersRes.data);
      setTraining(trainingRes.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === 'slides') setFormData({ title: '', studentName: '', rollNumber: '', company: '', package: '', image: '', batch: '', isActive: true });
    else if (activeTab === 'recruiters') setFormData({ name: '', logo: '', website: '', category: 'Regular', isActive: true });
    else setFormData({ type: 'Industry Ready', title: '', points: [''], isActive: true });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(activeTab === 'training' ? { ...item, points: item.points || [''] } : { ...item });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (activeTab === 'slides') { await deletePlacementSlide(id); setSlides(slides.filter(s => s._id !== id)); }
      else if (activeTab === 'recruiters') { await deleteRecruiter(id); setRecruiters(recruiters.filter(r => r._id !== id)); }
      else { await deleteTrainingContent(id); setTraining(training.filter(t => t._id !== id)); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'slides') {
        if (editingItem) { const res = await updatePlacementSlide(editingItem._id, formData); setSlides(slides.map(s => s._id === editingItem._id ? res.data : s)); }
        else { const res = await createPlacementSlide(formData); setSlides([...slides, res.data]); }
      } else if (activeTab === 'recruiters') {
        if (editingItem) { const res = await updateRecruiter(editingItem._id, formData); setRecruiters(recruiters.map(r => r._id === editingItem._id ? res.data : r)); }
        else { const res = await createRecruiter(formData); setRecruiters([...recruiters, res.data]); }
      } else {
        const cleanedData = { ...formData, points: formData.points.filter(p => p.trim()) };
        if (editingItem) { const res = await updateTrainingContent(editingItem._id, cleanedData); setTraining(training.map(t => t._id === editingItem._id ? res.data : t)); }
        else { const res = await createTrainingContent(cleanedData); setTraining([...training, res.data]); }
      }
      setShowModal(false);
    } catch (error) { console.error('Error:', error); }
  };

  const addPoint = () => setFormData({ ...formData, points: [...formData.points, ''] });
  const updatePoint = (idx, val) => { const pts = [...formData.points]; pts[idx] = val; setFormData({ ...formData, points: pts }); };
  const removePoint = (idx) => setFormData({ ...formData, points: formData.points.filter((_, i) => i !== idx) });

  const tabs = [
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
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Placement Page Management</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage slides, recruiters, and training content</p>
          </div>
          <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all">
            <Plus className="w-4 h-4" />Add New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-zinc-100 text-zinc-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="tab-content bg-white rounded-xl border border-zinc-100 overflow-hidden">
            {/* Slides */}
            {activeTab === 'slides' && (
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
                          <button onClick={() => handleEdit(s)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {slides.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-zinc-500">No slides yet</td></tr>}
                </tbody>
              </table>
            )}

            {/* Recruiters */}
            {activeTab === 'recruiters' && (
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
                          <button onClick={() => handleEdit(r)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(r._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recruiters.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-zinc-500">No recruiters yet</td></tr>}
                </tbody>
              </table>
            )}

            {/* Training */}
            {activeTab === 'training' && (
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
                        <button onClick={() => handleEdit(t)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${editingItem ? 'Edit' : 'Add'} ${activeTab === 'slides' ? 'Slide' : activeTab === 'recruiters' ? 'Recruiter' : 'Training'}`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'slides' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label><input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Student</label><input type="text" value={formData.studentName || ''} onChange={e => setFormData({ ...formData, studentName: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Roll Number</label><input type="text" value={formData.rollNumber || ''} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company *</label><input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Package</label><input type="text" value={formData.package || ''} onChange={e => setFormData({ ...formData, package: e.target.value })} placeholder="₹25 LPA" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              </div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Image URL *</label><input type="url" value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          {activeTab === 'recruiters' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Company Name *</label><input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Logo URL *</label><input type="url" value={formData.logo || ''} onChange={e => setFormData({ ...formData, logo: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Website</label><input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Category</label><select value={formData.category || 'Regular'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Top">Top</option><option value="Regular">Regular</option><option value="Partner">Partner</option></select></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          {activeTab === 'training' && (
            <>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label><select value={formData.type || 'Industry Ready'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 bg-white"><option value="Industry Ready">Industry Ready</option><option value="Domain">Domain</option></select></div>
              <div><label className="block text-xs font-medium text-zinc-500 mb-1.5">Title *</label><input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" /></div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Points</label>
                <div className="space-y-2">
                  {formData.points?.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={p} onChange={e => updatePoint(i, e.target.value)} className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100" placeholder={`Point ${i + 1}`} />
                      <button type="button" onClick={() => removePoint(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addPoint} className="text-xs text-violet-600 hover:underline">+ Add Point</button>
                </div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-violet-600" /><span className="text-xs text-zinc-600">Active</span></label>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"><Save className="w-4 h-4" />Save</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminPlacementPage;
