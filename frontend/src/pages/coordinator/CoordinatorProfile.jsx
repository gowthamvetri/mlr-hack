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
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Club Profile</h1>
            <p className="text-gray-500 mt-1 text-lg">Manage your club's public profile</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-200 transition-all"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl tilt-card overflow-hidden">
              <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
                  {profile.logo ? (
                    <img src={profile.logo} alt={profile.clubName} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <Building className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{profile.clubName || 'Your Club Name'}</h2>
                {profile.tagline && (
                  <p className="text-primary-100 mt-2 text-sm">{profile.tagline}</p>
                )}
              </div>
              <div className="p-6 space-y-4">
                {profile.contactEmail && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="font-semibold text-gray-800 truncate">{profile.contactEmail}</p>
                    </div>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Website</p>
                      <a href={profile.website} className="font-semibold text-primary-600 hover:underline truncate block">{profile.website}</a>
                    </div>
                  </div>
                )}
                {profile.memberCount && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Members</p>
                      <p className="font-semibold text-gray-800">{profile.memberCount}</p>
                    </div>
                  </div>
                )}
                {profile.foundedYear && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Founded</p>
                      <p className="font-semibold text-gray-800">{profile.foundedYear}</p>
                    </div>
                  </div>
                )}
                {!profile.contactEmail && !profile.website && !profile.memberCount && !profile.foundedYear && (
                  <div className="text-center py-6 text-gray-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Add details to showcase your club</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl tilt-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {isEditing ? 'Edit Profile Details' : 'Profile Details'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing ? 'Update your club information below' : 'View your club details'}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Club Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.clubName}
                      onChange={(e) => setProfile({ ...profile, clubName: e.target.value })}
                      placeholder="Enter club name"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.tagline}
                      onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                      placeholder="Short catchy tagline"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.contactEmail}
                      onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
                      placeholder="club@example.com"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourclub.com"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Founded Year</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.foundedYear}
                      onChange={(e) => setProfile({ ...profile, foundedYear: e.target.value })}
                      placeholder="2020"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Member Count</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.memberCount}
                      onChange={(e) => setProfile({ ...profile, memberCount: e.target.value })}
                      placeholder="50"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all resize-none"
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Tell us about your club, its mission, and activities..."
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                      value={profile.logo}
                      onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      disabled={!isEditing}
                    />
                    {profile.logo && (
                      <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
                        <img src={profile.logo} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary-200 disabled:opacity-50 transition-all"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
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
