import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile } from '../../utils/api';
import {
  User, Mail, Phone, MapPin, Calendar, GraduationCap,
  BookOpen, Hash, Edit, Save, X, CheckCircle, Loader, Lock,
  Shield, Award, TrendingUp, Eye, EyeOff, Key
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

// Progress Ring Component
const ProgressRing = ({ percentage, size = 80, strokeWidth = 6, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f4f4f5" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-zinc-900">{percentage}%</span>
      </div>
    </div>
  );
};

const StudentProfile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const pageRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', department: '', year: '',
    rollNumber: '', bio: '', address: '', dateOfBirth: '', gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = ['name', 'email', 'phone', 'department', 'year', 'rollNumber', 'bio', 'address', 'dateOfBirth', 'gender'];
    const filled = fields.filter(f => profile[f] && profile[f].toString().trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  // GSAP Animations
  useEffect(() => {
    if (pageRef.current && !loading) {
      gsap.fromTo('.profile-card', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => { fetchProfile(); }, []);

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
      if (updateUserInfo) dispatch(updateUserInfo(data));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { fetchProfile(); setIsEditing(false); };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await updateProfile({ password: passwordData.newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <span className="text-sm text-zinc-500 font-medium">Loading profile...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const profileCompletion = calculateCompletion();

  return (
    <DashboardLayout>
      <div ref={pageRef} className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage your personal information</p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors border border-zinc-200 shadow-sm">
                <Edit className="w-4 h-4" />Edit Profile
              </button>
            ) : (
              <>
                <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                  <X className="w-4 h-4" />Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-md">
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="profile-card bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-8 text-center border-b border-zinc-100">
                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg ring-4 ring-white border border-zinc-100">
                  <User className="w-12 h-12 text-zinc-300" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">{profile.name}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-white text-zinc-500 rounded-full text-xs font-bold border border-zinc-200 shadow-sm">
                  {profile.rollNumber || 'Student'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-zinc-900 truncate font-medium">{profile.email}</p>
                  </div>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm text-zinc-900 font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Department</p>
                      <p className="text-sm text-zinc-900 font-medium">{profile.department}</p>
                    </div>
                  </div>
                )}
                {profile.year && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Year</p>
                      <p className="text-sm text-zinc-900 font-medium">{profile.year}{profile.year === '1' ? 'st' : profile.year === '2' ? 'nd' : profile.year === '3' ? 'rd' : 'th'} Year</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion */}
            <div className="profile-card bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-900">Profile Completion</h3>
                <ProgressRing percentage={profileCompletion} size={64} strokeWidth={5} color="#18181b" />
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Basic Info', done: !!(profile.name && profile.email) },
                  { label: 'Contact Details', done: !!profile.phone },
                  { label: 'Academic Info', done: !!(profile.department && profile.year) },
                  { label: 'Personal Details', done: !!(profile.dateOfBirth && profile.gender) },
                  { label: 'Bio & Address', done: !!(profile.bio && profile.address) }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-medium">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-50 border border-emerald-100' : 'bg-zinc-100 border border-zinc-200'}`}>
                      {item.done ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <div className="w-2 h-2 bg-zinc-300 rounded-full" />}
                    </div>
                    <span className={item.done ? 'text-zinc-900' : 'text-zinc-400'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <div className="profile-card bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                  <User className="w-4 h-4 text-zinc-600" />
                </div>
                <h3 className="font-bold text-zinc-900">Personal Information</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Full Name</label>
                    {isEditing ? (
                      <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium" />
                    ) : (
                      <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">{profile.name || '-'}</p>
                    )}
                  </div>

                  {/* Email - Locked */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <p className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-bold">{profile.email}</p>
                    <p className="flex items-center gap-1 text-[10px] text-blue-500 mt-1.5 font-bold"><Lock className="w-3 h-3" />Cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                    {isEditing ? (
                      <input type="tel" name="phone" value={profile.phone} onChange={handleChange} placeholder="Enter phone" className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium" />
                    ) : (
                      <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">{profile.phone || '-'}</p>
                    )}
                  </div>

                  {/* Roll Number - Locked */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Roll Number</label>
                    <p className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-bold">{profile.rollNumber || '-'}</p>
                    <p className="flex items-center gap-1 text-[10px] text-blue-500 mt-1.5 font-bold"><Lock className="w-3 h-3" />Auto-generated</p>
                  </div>

                  {/* Department - Locked */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Department</label>
                    <p className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-bold">{profile.department || '-'}</p>
                    <p className="flex items-center gap-1 text-[10px] text-blue-500 mt-1.5 font-bold"><Lock className="w-3 h-3" />Cannot change</p>
                  </div>

                  {/* Year - Locked */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Year of Study</label>
                    <p className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-bold">
                      {profile.year ? `${profile.year}${['st', 'nd', 'rd'][profile.year - 1] || 'th'} Year` : '-'}
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-blue-500 mt-1.5 font-bold"><Lock className="w-3 h-3" />Cannot change</p>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Date of Birth</label>
                    {isEditing ? (
                      <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-medium" />
                    ) : (
                      <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '-'}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Gender</label>
                    {isEditing ? (
                      <select name="gender" value={profile.gender} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent cursor-pointer transition-all font-medium">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">{profile.gender || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Address</label>
                  {isEditing ? (
                    <textarea name="address" value={profile.address} onChange={handleChange} rows={2} placeholder="Enter address" className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none placeholder-zinc-400 transition-all font-medium" />
                  ) : (
                    <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">{profile.address || '-'}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Bio</label>
                  {isEditing ? (
                    <textarea name="bio" value={profile.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself..." className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none placeholder-zinc-400 transition-all font-medium" />
                  ) : (
                    <p className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 font-bold">{profile.bio || '-'}</p>
                  )}
                </div>
              </form>

              {/* Password Change Section */}
              <div className="mt-8 pt-6 border-t border-zinc-100">
                <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                  <Key className="w-4 h-4" />Change Password
                  <span className={`transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </button>

                {showPasswordSection && (
                  <form onSubmit={handlePasswordChange} className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-4">
                    {/* Password Message */}
                    {passwordMessage.text && (
                      <div className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        <CheckCircle className="w-4 h-4" />{passwordMessage.text}
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">New Password</label>
                      <div className="relative">
                        <input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="Enter new password (min 6 characters)" className="w-full px-4 py-2.5 pr-10 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder-zinc-400 font-medium" />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm new password" className="w-full px-4 py-2.5 pr-10 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder-zinc-400 font-medium" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center gap-3 pt-2">
                      <button type="submit" disabled={savingPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {savingPassword ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        {savingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                      <button type="button" onClick={() => { setShowPasswordSection(false); setPasswordData({ newPassword: '', confirmPassword: '' }); setPasswordMessage({ type: '', text: '' }); }} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
