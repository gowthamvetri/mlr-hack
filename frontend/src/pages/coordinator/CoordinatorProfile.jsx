import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { getClubProfile, updateClubProfile } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Building, Save, Mail, Globe, Users, Calendar, Edit, CheckCircle, Sparkles } from 'lucide-react';

const CoordinatorProfile = () => {
  const user = useSelector(selectCurrentUser);
  const [profile, setProfile] = useState({
    clubName: user?.clubName || '',
    tagline: '',
    description: '',
    contactEmail: '',
    website: '',
    foundedYear: '',
    memberCount: '',
    logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await getClubProfile();
      if (data) {
        setProfile({ ...profile, ...data });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClubProfile(profile);
      setIsEditing(false);
    } catch (error) {
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="club_coordinator" userName={user?.name}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Club Profile</h1>
            <p className="text-zinc-500 mt-1 text-sm">Manage your club's public profile</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-lg shadow-violet-200 transition-all text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 p-8 text-center relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-white/20">
                    {profile.logo ? (
                      <img src={profile.logo} alt={profile.clubName} className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-violet-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{profile.clubName || 'Your Club Name'}</h2>
                  {profile.tagline && (
                    <p className="text-violet-100 mt-2 text-sm font-medium">{profile.tagline}</p>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {profile.contactEmail && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <Mail className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-zinc-800 truncate text-sm">{profile.contactEmail}</p>
                    </div>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-100">
                      <Globe className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Website</p>
                      <a href={profile.website} className="font-semibold text-violet-600 hover:underline truncate block text-sm">{profile.website}</a>
                    </div>
                  </div>
                )}
                {profile.memberCount && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-100">
                      <Users className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Members</p>
                      <p className="font-semibold text-zinc-800 text-sm">{profile.memberCount}</p>
                    </div>
                  </div>
                )}
                {profile.foundedYear && (
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-amber-100">
                      <Calendar className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Founded</p>
                      <p className="font-semibold text-zinc-800 text-sm">{profile.foundedYear}</p>
                    </div>
                  </div>
                )}
                {!profile.contactEmail && !profile.website && !profile.memberCount && !profile.foundedYear && (
                  <div className="text-center py-8 text-zinc-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Add details to showcase your club</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-lg font-bold text-zinc-900">
                  {isEditing ? 'Edit Profile Details' : 'Profile Details'}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {isEditing ? 'Update your club information below' : 'View your club details'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Club Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.clubName}
                      onChange={(e) => setProfile({ ...profile, clubName: e.target.value })}
                      placeholder="Enter club name"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tagline</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.tagline}
                      onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                      placeholder="Short catchy tagline"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.contactEmail}
                      onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                      placeholder="club@example.com"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Website</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourclub.com"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Founded Year</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.foundedYear}
                      onChange={(e) => setProfile({ ...profile, foundedYear: e.target.value })}
                      placeholder="2020"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Member Count</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.memberCount}
                      onChange={(e) => setProfile({ ...profile, memberCount: e.target.value })}
                      placeholder="50"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                  <textarea
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm resize-none"
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Tell us about your club, its mission, and activities..."
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Logo URL</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      className="flex-1 px-3 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:bg-zinc-50 disabled:text-zinc-500 transition-all text-sm"
                      value={profile.logo}
                      onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      disabled={!isEditing}
                    />
                    {profile.logo && (
                      <div className="w-10 h-10 rounded-lg border border-zinc-200 overflow-hidden flex items-center justify-center bg-zinc-50 flex-shrink-0">
                        <img src={profile.logo} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-zinc-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-violet-200 disabled:opacity-50 transition-all text-sm"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorProfile;
