import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile } from '../../utils/api';
import {
  User, Mail, Phone, MapPin, Calendar, Building, Edit, Save, X, CheckCircle,
  Loader, Grid, Briefcase, Camera
} from 'lucide-react';

const SeatingProfile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', office: '', bio: '', address: '', dateOfBirth: '', gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await getProfile();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        office: data.office || '',
        bio: data.bio || '',
        address: data.address || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      const { data } = await updateProfile(profile);
      if (data) dispatch(updateUserInfo(data));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfile();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="seating_manager" userName={user?.name}>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-bold">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seating_manager" userName={user?.name}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
            <p className="text-zinc-500 mt-1 text-sm">View and manage your seating manager profile</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all disabled:opacity-50"
              >
                {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-white/20 relative z-10">
                  <Grid className="w-10 h-10 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-white relative z-10">{profile.name || 'Your Name'}</h2>
                <p className="text-violet-100 mt-1 flex items-center justify-center gap-2 relative z-10 font-medium">
                  <Briefcase className="w-4 h-4" />
                  Seating Manager
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Email</p>
                    <p className="font-bold text-zinc-900 truncate">{profile.email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Phone className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Phone</p>
                      <p className="font-bold text-zinc-900">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.office && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Building className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Office</p>
                      <p className="font-bold text-zinc-900">{profile.office}</p>
                    </div>
                  </div>
                )}

                {profile.address && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <MapPin className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Location</p>
                      <p className="font-bold text-zinc-900">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="text-lg font-bold text-zinc-900">Personal Information</h3>
                <p className="text-sm text-zinc-500 mt-1">{isEditing ? 'Update your details below' : 'View your profile details'}</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 hover:border-zinc-300"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                    <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-500 border border-zinc-100">{profile.email}</p>
                    <p className="text-xs text-zinc-400 mt-1 ml-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Office Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="office"
                        value={profile.office}
                        onChange={handleChange}
                        placeholder="Enter office location"
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.office || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={profile.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 hover:border-zinc-300"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '-'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Gender</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-zinc-900 hover:border-zinc-300"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.gender || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Address</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter your address"
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.address || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none text-zinc-900 placeholder-zinc-400 hover:border-zinc-300"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-zinc-50 rounded-xl text-zinc-900 font-medium border border-zinc-100">{profile.bio || '-'}</p>
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

export default SeatingProfile;
