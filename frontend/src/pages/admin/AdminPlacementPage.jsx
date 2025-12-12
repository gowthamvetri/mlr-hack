import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import {
  Image, Building2, BookOpen, Plus, Edit2, Trash2,
  Save, X, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import {
  getAdminPlacementSlides, createPlacementSlide, updatePlacementSlide, deletePlacementSlide,
  getAdminRecruiters, createRecruiter, updateRecruiter, deleteRecruiter,
  getAdminTrainingContent, createTrainingContent, updateTrainingContent, deleteTrainingContent,
} from '../../utils/api';

const AdminPlacementPage = () => {
  const [activeTab, setActiveTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slidesRes, recruitersRes, trainingRes] = await Promise.all([
        getAdminPlacementSlides(),
        getAdminRecruiters(),
        getAdminTrainingContent(),
      ]);
      setSlides(slidesRes.data);
      setRecruiters(recruitersRes.data);
      setTraining(trainingRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === 'slides') {
      setFormData({ title: '', studentName: '', rollNumber: '', company: '', package: '', image: '', batch: '', isActive: true });
    } else if (activeTab === 'recruiters') {
      setFormData({ name: '', logo: '', website: '', category: 'Regular', isActive: true });
    } else {
      setFormData({ type: 'Industry Ready', title: '', points: [''], isActive: true });
    }
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'training') {
      setFormData({ ...item, points: item.points || [''] });
    } else {
      setFormData({ ...item });
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'slides') {
        await deletePlacementSlide(id);
        setSlides(slides.filter(s => s._id !== id));
      } else if (activeTab === 'recruiters') {
        await deleteRecruiter(id);
        setRecruiters(recruiters.filter(r => r._id !== id));
      } else {
        await deleteTrainingContent(id);
        setTraining(training.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'slides') {
        if (editingItem) {
          const res = await updatePlacementSlide(editingItem._id, formData);
          setSlides(slides.map(s => s._id === editingItem._id ? res.data : s));
        } else {
          const res = await createPlacementSlide(formData);
          setSlides([...slides, res.data]);
        }
      } else if (activeTab === 'recruiters') {
        if (editingItem) {
          const res = await updateRecruiter(editingItem._id, formData);
          setRecruiters(recruiters.map(r => r._id === editingItem._id ? res.data : r));
        } else {
          const res = await createRecruiter(formData);
          setRecruiters([...recruiters, res.data]);
        }
      } else {
        const cleanedData = { ...formData, points: formData.points.filter(p => p.trim()) };
        if (editingItem) {
          const res = await updateTrainingContent(editingItem._id, cleanedData);
          setTraining(training.map(t => t._id === editingItem._id ? res.data : t));
        } else {
          const res = await createTrainingContent(cleanedData);
          setTraining([...training, res.data]);
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const addPoint = () => {
    setFormData({ ...formData, points: [...formData.points, ''] });
  };

  const updatePoint = (index, value) => {
    const newPoints = [...formData.points];
    newPoints[index] = value;
    setFormData({ ...formData, points: newPoints });
  };

  const removePoint = (index) => {
    setFormData({ ...formData, points: formData.points.filter((_, i) => i !== index) });
  };

  const tabs = [
    { id: 'slides', label: 'Placement Slides', icon: Image },
    { id: 'recruiters', label: 'Recruiters', icon: Building2 },
    { id: 'training', label: 'Training Content', icon: BookOpen },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="Admin" />
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Placement Page Management</h1>
              <p className="text-gray-500">Manage slides, recruiters, and training content for the public placements page</p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Slides Table */}
              {activeTab === 'slides' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Image</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Package</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {slides.map(slide => (
                        <tr key={slide._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <img src={slide.image || '/placeholder.jpg'} alt="" className="w-16 h-12 object-cover rounded" />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{slide.title}</td>
                          <td className="px-4 py-3 text-gray-600">{slide.studentName || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{slide.company}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">{slide.package}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${slide.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {slide.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(slide)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(slide._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {slides.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No slides yet. Click "Add New" to create one.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recruiters Table */}
              {activeTab === 'recruiters' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Logo</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recruiters.map(recruiter => (
                        <tr key={recruiter._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <img src={recruiter.logo || '/placeholder.jpg'} alt="" className="h-8 object-contain" />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{recruiter.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${recruiter.category === 'Top' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                              {recruiter.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${recruiter.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {recruiter.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(recruiter)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(recruiter._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {recruiters.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No recruiters yet. Click "Add New" to create one.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Training Content */}
              {activeTab === 'training' && (
                <div className="divide-y">
                  {training.map(item => (
                    <div key={item._id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Industry Ready' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {item.type}
                          </span>
                          <h3 className="font-medium text-gray-800">{item.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        {item.points?.slice(0, 3).map((point, idx) => (
                          <li key={idx} className="list-disc">{point}</li>
                        ))}
                        {item.points?.length > 3 && (
                          <li className="text-gray-400">...and {item.points.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  ))}
                  {training.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No training content yet. Click "Add New" to create one.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${editingItem ? 'Edit' : 'Add'} ${activeTab === 'slides' ? 'Slide' : activeTab === 'recruiters' ? 'Recruiter' : 'Training Content'}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'slides' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                    <input type="text" value={formData.studentName || ''} onChange={e => setFormData({ ...formData, studentName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input type="text" value={formData.rollNumber || ''} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                    <input type="text" value={formData.package || ''} onChange={e => setFormData({ ...formData, package: e.target.value })} placeholder="₹25 LPA" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                  <input type="url" value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <input type="text" value={formData.batch || ''} onChange={e => setFormData({ ...formData, batch: e.target.value })} placeholder="Batch 2025" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-red-600" />
                  <span className="text-sm text-gray-700">Active (visible on public page)</span>
                </label>
              </>
            )}

            {activeTab === 'recruiters' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL *</label>
                  <input type="url" value={formData.logo || ''} onChange={e => setFormData({ ...formData, logo: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category || 'Regular'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="Top">Top Recruiter</option>
                    <option value="Regular">Regular</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-red-600" />
                  <span className="text-sm text-gray-700">Active (visible on public page)</span>
                </label>
              </>
            )}

            {activeTab === 'training' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={formData.type || 'Industry Ready'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="Industry Ready">Industry Ready Training</option>
                    <option value="Domain">Domain Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <div className="space-y-2">
                    {formData.points?.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <input type="text" value={point} onChange={e => updatePoint(index, e.target.value)} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" placeholder={`Point ${index + 1}`} />
                        <button type="button" onClick={() => removePoint(index)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addPoint} className="text-sm text-red-600 hover:underline">+ Add Point</button>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-red-600" />
                  <span className="text-sm text-gray-700">Active (visible on public page)</span>
                </label>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default AdminPlacementPage;
