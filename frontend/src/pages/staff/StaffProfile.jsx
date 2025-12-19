import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUserInfo } from '../../store/slices/authSlice';
import DashboardLayout from '../../components/DashboardLayout';
import { getProfile, updateProfile, getDepartments } from '../../utils/api';
import {
    User, Mail, Phone, Building, Briefcase, Edit, Save, X,
    CheckCircle, Loader, Award, Lock, AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const StaffProfile = () => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const pageRef = useRef(null);
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

    useEffect(() => {
        if (pageRef.current && !loading) {
            gsap.fromTo('.profile-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
        }
    }, [loading]);

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
                        <Loader className="w-8 h-8 text-violet-500 animate-spin" />
                        <span className="text-zinc-500 text-sm font-medium">Loading profile...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="staff" userName={user?.name}>
            <div ref={pageRef} className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">My Profile</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Manage your staff profile information</p>
                    </div>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm">
                            <Edit className="w-4 h-4" /> Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-60">
                                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        <CheckCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Department Warning */}
                {!profile.department && (
                    <div className="p-4 rounded-xl flex items-center gap-3 bg-amber-50 text-amber-700 border border-amber-100">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-sm font-semibold">Department Not Set</p>
                            <p className="text-xs text-amber-600">Please update your profile to manage students from your department.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="profile-card lg:col-span-1">
                        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 text-center">
                                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg ring-4 ring-white/20">
                                    <User className="w-12 h-12 text-zinc-700" />
                                </div>
                                <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                                <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-zinc-200">{profile.designation || 'Staff'}</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center"><Mail className="w-4 h-4 text-blue-500" /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Email</p>
                                        <p className="text-sm font-medium text-zinc-900 truncate">{profile.email}</p>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center"><Phone className="w-4 h-4 text-emerald-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Phone</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.phone}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.department && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center"><Building className="w-4 h-4 text-violet-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Department</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.department}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.experience && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center"><Award className="w-4 h-4 text-orange-500" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Experience</p>
                                            <p className="text-sm font-medium text-zinc-900">{profile.experience}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="profile-card lg:col-span-2">
                        <div className="bg-white rounded-xl border border-zinc-100 p-6">
                            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-zinc-100">
                                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-violet-500" /></div>
                                <h3 className="font-semibold text-zinc-900">Personal Information</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Full Name</label>
                                        {isEditing ? (
                                            <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-800">{profile.name || '-'}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <p className="px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-sm font-medium text-blue-800">{profile.email}</p>
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1.5 ml-1">Email cannot be changed</p>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Phone</label>
                                        {isEditing ? (
                                            <input type="tel" name="phone" value={profile.phone} onChange={handleChange} placeholder="Enter phone number" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-800">{profile.phone || '-'}</p>
                                        )}
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Department <span className="text-red-500">*</span></label>
                                        {isEditing ? (
                                            <select name="department" value={profile.department} onChange={handleChange} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all appearance-none cursor-pointer">
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (<option key={dept._id} value={dept.code}>{dept.name} ({dept.code})</option>))}
                                                {departments.length === 0 && (<><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="IT">IT</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option></>)}
                                            </select>
                                        ) : (
                                            <p className={`px-4 py-2.5 rounded-lg text-sm font-medium ${profile.department ? 'bg-violet-50 text-violet-800 border border-violet-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{profile.department || 'Not Set'}</p>
                                        )}
                                    </div>

                                    {/* Designation */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Designation</label>
                                        {isEditing ? (
                                            <select name="designation" value={profile.designation} onChange={handleChange} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all appearance-none cursor-pointer">
                                                <option value="">Select Designation</option>
                                                <option value="Professor">Professor</option>
                                                <option value="Associate Professor">Associate Professor</option>
                                                <option value="Assistant Professor">Assistant Professor</option>
                                                <option value="Lab Instructor">Lab Instructor</option>
                                            </select>
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-800">{profile.designation || '-'}</p>
                                        )}
                                    </div>

                                    {/* Experience */}
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Experience</label>
                                        {isEditing ? (
                                            <input type="text" name="experience" value={profile.experience} onChange={handleChange} placeholder="e.g., 10 years" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all" />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-800">{profile.experience || '-'}</p>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Bio</label>
                                        {isEditing ? (
                                            <textarea name="bio" value={profile.bio} onChange={handleChange} rows={4} placeholder="Write a short bio..." className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all resize-none" />
                                        ) : (
                                            <p className="px-4 py-2.5 bg-zinc-50 rounded-lg text-sm font-medium text-zinc-800 min-h-[80px]">{profile.bio || '-'}</p>
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
