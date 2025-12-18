import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile } from '../../utils/api';
import gsap from 'gsap';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Building,
  Edit, Save, X, CheckCircle, Loader, Briefcase
} from 'lucide-react';

const AdminProfile = () => {
  const user = useSelector(selectCurrentUser);
  const pageRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', office: '', bio: '', address: '', dateOfBirth: '', gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.section-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await getProfile();
      setProfile({
        name: data.name || '', email: data.email || '', phone: data.phone || '',
        office: data.office || '', bio: data.bio || '', address: data.address || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '', gender: data.gender || ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile(profile);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-6 h-6 text-violet-600 animate-spin" />
          <span className="ml-2 text-zinc-500 text-sm">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div ref={pageRef} className="space-y-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Admin Profile</h1>
            <p className="text-zinc-500 text-sm mt-0.5">View and manage your administrator profile</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all">
              <Edit className="w-4 h-4" />Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { fetchProfile(); setIsEditing(false); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all">
                <X className="w-4 h-4" />Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <CheckCircle className="w-4 h-4" />{message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="section-card lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-violet-600" />
                </div>
                <h2 className="text-lg font-semibold text-white">{profile.name}</h2>
                <p className="text-violet-100 text-sm mt-1">Administrator</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-zinc-700 truncate">{profile.email}</p>
                  </div>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-zinc-700">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.office && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Office</p>
                      <p className="text-sm font-medium text-zinc-700">{profile.office}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Role</p>
                    <p className="text-sm font-medium text-zinc-700">System Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="section-card lg:col-span-2">
            <div className="bg-white rounded-xl border border-zinc-100 p-6">
              <h3 className="font-semibold text-zinc-900 mb-6">Personal Information</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Full Name</label>
                    {isEditing ? (
                      <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    ) : (
                      <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                    <p className="px-3 py-2.5 bg-zinc-100 rounded-lg text-sm text-zinc-500">{profile.email}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Phone</label>
                    {isEditing ? (
                      <input type="tel" name="phone" value={profile.phone} onChange={handleChange} placeholder="Enter phone" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    ) : (
                      <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.phone || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Office</label>
                    {isEditing ? (
                      <input type="text" name="office" value={profile.office} onChange={handleChange} placeholder="Enter office" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    ) : (
                      <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.office || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date of Birth</label>
                    {isEditing ? (
                      <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleChange} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300" />
                    ) : (
                      <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Gender</label>
                    {isEditing ? (
                      <select name="gender" value={profile.gender} onChange={handleChange} className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 bg-white">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.gender || '-'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Address</label>
                  {isEditing ? (
                    <textarea name="address" value={profile.address} onChange={handleChange} rows={2} placeholder="Enter address" className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none" />
                  ) : (
                    <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.address || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Bio</label>
                  {isEditing ? (
                    <textarea name="bio" value={profile.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself..." className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none" />
                  ) : (
                    <p className="px-3 py-2.5 bg-zinc-50 rounded-lg text-sm text-zinc-700">{profile.bio || '-'}</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProfile;
