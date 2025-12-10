import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getClubProfile, updateClubProfile } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { Building, Save, Mail, Globe, Users, Calendar, Image, Edit, Check } from 'lucide-react';

const CoordinatorProfile = () => {
  const { user } = useAuth();
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
      alert('Profile updated successfully!');
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
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="club_coordinator" userName={user?.name}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Club Profile</h1>
          <p className="text-gray-500">Manage your club's public profile</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold"
          >
            <Edit className="w-5 h-5" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.clubName} className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <Building className="w-12 h-12 text-primary-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{profile.clubName || 'Your Club Name'}</h2>
              {profile.tagline && (
                <p className="text-primary-100 mt-1">{profile.tagline}</p>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {profile.contactEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{profile.contactEmail}</p>
                    </div>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a href={profile.website} className="font-medium text-primary-600 hover:underline">{profile.website}</a>
                    </div>
                  </div>
                )}
                {profile.memberCount && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Members</p>
                      <p className="font-medium text-gray-800">{profile.memberCount}</p>
                    </div>
                  </div>
                )}
                {profile.foundedYear && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Founded</p>
                      <p className="font-medium text-gray-800">{profile.foundedYear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? 'Edit Profile Details' : 'Profile Details'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.clubName}
                    onChange={(e) => setProfile({...profile, clubName: e.target.value})}
                    placeholder="Enter club name"
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.tagline}
                    onChange={(e) => setProfile({...profile, tagline: e.target.value})}
                    placeholder="Short catchy tagline"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.contactEmail}
                    onChange={(e) => setProfile({...profile, contactEmail: e.target.value})}
                    placeholder="club@example.com"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.website}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                    placeholder="https://yourclub.com"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.foundedYear}
                    onChange={(e) => setProfile({...profile, foundedYear: e.target.value})}
                    placeholder="2020"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.memberCount}
                    onChange={(e) => setProfile({...profile, memberCount: e.target.value})}
                    placeholder="50"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  value={profile.description}
                  onChange={(e) => setProfile({...profile, description: e.target.value})}
                  placeholder="Tell us about your club, its mission, and activities..."
                  rows={4}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                    value={profile.logo}
                    onChange={(e) => setProfile({...profile, logo: e.target.value})}
                    placeholder="https://example.com/logo.png"
                    disabled={!isEditing}
                  />
                  {profile.logo && (
                    <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
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
                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-300"
                  >
                    {saving ? (
                      <>Saving...</>
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
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorProfile;
