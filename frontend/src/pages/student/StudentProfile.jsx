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
  GraduationCap,
  BookOpen,
  Hash,
  Edit,
  Save,
  X,
  CheckCircle,
  Loader,
  Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';

const StudentProfile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    rollNumber: '',
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
        department: data.department || '',
        year: data.year || '',
        rollNumber: data.rollNumber || '',
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
      <DashboardLayout role="student" userName={user?.name}>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-10 h-10 text-primary-600 animate-spin" />
            <span className="text-gray-500 font-medium">Loading profile...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" userName={user?.name}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-fade-in text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1 text-lg">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 group"
          >
            <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-slide-in-up border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
          }`}>
          <div className={`p-2 rounded-full ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            <CheckCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className="font-bold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in delay-100">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full group">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <User className="w-64 h-64 text-white -mr-20 -mt-20 transform rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-300">
                  <User className="w-16 h-16 text-gray-900" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{profile.name}</h2>
                <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold text-gray-200 border border-white/10">
                  {profile.rollNumber || 'Student'}
                </span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 group/item">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover/item:bg-blue-100 transition-colors">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="font-semibold text-gray-900 truncate" title={profile.email}>{profile.email}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center group-hover/item:bg-green-100 transition-colors">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
                    <p className="font-semibold text-gray-900">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile.department && (
                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover/item:bg-purple-100 transition-colors">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Department</p>
                    <p className="font-semibold text-gray-900">{profile.department}</p>
                  </div>
                </div>
              )}

              {profile.year && (
                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover/item:bg-orange-100 transition-colors">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Year of Study</p>
                    <p className="font-semibold text-gray-900">{profile.year}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form / Details View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-all duration-300 h-full">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="p-2 bg-primary-50 rounded-lg">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900"
                    />
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.name || '-'}</p>
                  )}
                </div>

                {/* Email */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <p className="px-5 py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-900 font-semibold">{profile.email}</p>
                  <p className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1.5 ml-1">
                    <Lock className="w-3 h-3" />
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900"
                    />
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.phone || '-'}</p>
                  )}
                </div>

                {/* Roll Number */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Roll Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="rollNumber"
                      value={profile.rollNumber}
                      onChange={handleChange}
                      placeholder="Enter roll number"
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900"
                    />
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.rollNumber || '-'}</p>
                  )}
                </div>

                {/* Department */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Department</label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        name="department"
                        value={profile.department}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Select Department</option>
                        <option value="CSE">Computer Science Engineering (CSE)</option>
                        <option value="IT">Information Technology (IT)</option>
                        <option value="ECE">Electronics & Communication (ECE)</option>
                        <option value="EEE">Electrical & Electronics (EEE)</option>
                        <option value="MECH">Mechanical Engineering (MECH)</option>
                        <option value="CIVIL">Civil Engineering (CIVIL)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.department || '-'}</p>
                  )}
                </div>

                {/* Year */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Year of Study</label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        name="year"
                        value={profile.year}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <GraduationCap className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.year || '-'}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profile.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900"
                    />
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '-'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Gender</label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900 appearance-none cursor-pointer"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.gender || '-'}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter your address"
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900 resize-none"
                  />
                ) : (
                  <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent">{profile.address || '-'}</p>
                )}
              </div>

              {/* Bio */}
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-primary-600 transition-colors">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-primary-500 transition-all font-semibold text-gray-900 resize-none"
                  />
                ) : (
                  <p className="px-5 py-3.5 bg-gray-50 rounded-xl text-gray-900 font-semibold border border-transparent leading-relaxed">{profile.bio || '-'}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
