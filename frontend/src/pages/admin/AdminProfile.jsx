import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile } from '../../utils/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Building,
  Edit,
  Save,
  X,
  CheckCircle,
  Loader,
  Briefcase
} from 'lucide-react';

const AdminProfile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    office: '',
    bio: '',
    address: '',
    dateOfBirth: '',
    gender: ''
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
      if (updateUserInfo) {
        dispatch(updateUserInfo(data));
      }
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
      <DashboardLayout role="admin" userName={user?.name}>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-gray-500">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-gray-500">View and manage your administrator profile</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
          >
            <Edit className="w-5 h-5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
          <CheckCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Shield className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-red-100 mt-1">Administrator</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800 truncate">{profile.email}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile.office && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office</p>
                    <p className="font-medium text-gray-800">{profile.office}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-800">System Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form / Details View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.name || '-'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <p className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.phone || '-'}</p>
                  )}
                </div>

                {/* Office */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Office Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="office"
                      value={profile.office}
                      onChange={handleChange}
                      placeholder="Enter office location"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.office || '-'}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profile.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '-'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.gender || '-'}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter your address"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.address || '-'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800">{profile.bio || '-'}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProfile;
