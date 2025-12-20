import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile, getDepartments } from '../../utils/api';
import {
    User, Mail, Phone, Building, Briefcase, Edit, Save, X,
    CheckCircle, Loader, Award, Lock, AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const StaffProfile = () => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const [profile, setProfile] = useState({
        name: '', email: '', phone: '', department: '',
        designation: '', experience: '', bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, deptRes] = await Promise.all([
                getProfile(),
                getDepartments().catch(() => ({ data: [] }))
            ]);
            const data = profileRes.data;
            setProfile({
                name: data.name || '', email: data.email || '', phone: data.phone || '',
                department: data.department || '', designation: data.designation || '',
                experience: data.experience || '', bio: data.bio || ''
            });
            setDepartments(deptRes.data || []);
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
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        fetchData();
        setIsEditing(false);
    };

    if (loading) {
        return (
            <DashboardLayout role="staff" userName={user?.name}>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader className="w-8 h-8 text-zinc-900 animate-spin" />
                        <span className="text-zinc-500 text-sm font-medium">Loading profile...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage your staff profile information</p>
                    </div>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm border border-zinc-200 hover:border-zinc-300">
                            <Edit className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        <CheckCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Department Warning */}
                {!profile.department && (
                    <div className="p-4 rounded-xl flex items-center gap-3 bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-sm font-bold">Department Not Set</p>
                            <p className="text-xs text-amber-600/80 font-medium">Please update your profile to manage students from your department.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="bg-zinc-50 p-8 text-center border-b border-zinc-200">
                                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-md ring-4 ring-zinc-100">
                                    <User className="w-12 h-12 text-zinc-400" />
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">{profile.name}</h2>
                                <span className="inline-block mt-2 px-3 py-1 bg-white rounded-full text-xs font-bold text-zinc-600 border border-zinc-200 shadow-sm">{profile.designation || 'Staff'}</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100"><Mail className="w-4 h-4 text-blue-600" /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Email</p>
                                        <p className="text-sm font-medium text-zinc-900 truncate">{profile.email}</p>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100"><Phone className="w-4 h-4 text-emerald-600" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Phone</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.department && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100"><Building className="w-4 h-4 text-purple-600" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Department</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.department}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.experience && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100"><Award className="w-4 h-4 text-amber-600" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Experience</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.experience}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-zinc-200">
                                <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200"><User className="w-4 h-4 text-zinc-600" /></div>
                                <h3 className="font-bold text-zinc-900">Personal Information</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={profile.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                            />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200">{profile.name || '-'}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Email Address</label>
                                        <div className="relative">
                                            <p className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium text-blue-600">{profile.email}</p>
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1.5 ml-1 font-medium">Email cannot be changed</p>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Phone</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profile.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                            />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200">{profile.phone || '-'}</p>
                                        )}
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Department <span className="text-red-500">*</span></label>
                                        {isEditing ? (
                                            <select
                                                name="department"
                                                value={profile.department}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (<option key={dept._id} value={dept.code}>{dept.name} ({dept.code})</option>))}
                                                {departments.length === 0 && (<><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="IT">IT</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option></>)}
                                            </select>
                                        ) : (
                                            <p className={`px-4 py-2.5 rounded-lg text-sm font-bold border ${profile.department ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{profile.department || 'Not Set'}</p>
                                        )}
                                    </div>

                                    {/* Designation */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Designation</label>
                                        {isEditing ? (
                                            <select
                                                name="designation"
                                                value={profile.designation}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Designation</option>
                                                <option value="Professor">Professor</option>
                                                <option value="Associate Professor">Associate Professor</option>
                                                <option value="Assistant Professor">Assistant Professor</option>
                                                <option value="Lab Instructor">Lab Instructor</option>
                                            </select>
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200">{profile.designation || '-'}</p>
                                        )}
                                    </div>

                                    {/* Experience */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Experience</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="experience"
                                                value={profile.experience}
                                                onChange={handleChange}
                                                placeholder="e.g., 10 years"
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all placeholder-zinc-400"
                                            />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200">{profile.experience || '-'}</p>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Bio</label>
                                        {isEditing ? (
                                            <textarea
                                                name="bio"
                                                value={profile.bio}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="Write a short bio..."
                                                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none placeholder-zinc-400"
                                            />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-200 min-h-[80px]">{profile.bio || '-'}</p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffProfile;
