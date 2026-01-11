import { useState, useEffect } from 'react';
import { getCurrentUserProfile, updateProfile, uploadAvatar, removeAvatar } from '../api/profile.js';
import OnlineStatusIndicator from './OnlineStatusIndicator.jsx';

const UserProfile = ({ currentUser, onClose, onUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getCurrentUserProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData({
      name: profile.name,
      email: profile.email
    });
    setError('');
    setMessage('');
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: profile.name,
      email: profile.email
    });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updatedProfile = await updateProfile(formData);
      setProfile(updatedProfile);
      setEditing(false);
      setMessage('Profile updated successfully!');
      if (onUpdate) onUpdate(updatedProfile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      setError('');
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setUploadingAvatar(true);
    setError('');
    setMessage('');

    try {
      const updatedProfile = await uploadAvatar(avatarFile);
      setProfile(updatedProfile);
      setAvatarFile(null);
      setMessage('Avatar updated successfully!');
      if (onUpdate) onUpdate(updatedProfile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setError('');
    setMessage('');

    try {
      const updatedProfile = await removeAvatar();
      setProfile(updatedProfile);
      setMessage('Avatar removed successfully!');
      if (onUpdate) onUpdate(updatedProfile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium text-gray-600">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <OnlineStatusIndicator user={profile} size="large" />
            </div>
            
            {/* Avatar Upload */}
            <div className="mt-4 text-center">
              {avatarFile ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Selected: {avatarFile.name}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => setAvatarFile(null)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 cursor-pointer">
                    Change Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {profile.avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="block px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 mx-auto"
                    >
                      {uploadingAvatar ? 'Removing...' : 'Remove Avatar'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{profile.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Verification
                </label>
                <p className={`text-sm ${profile.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {profile.isEmailVerified ? '✓ Verified' : '⚠ Not Verified'}
                </p>
              </div>
              
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
