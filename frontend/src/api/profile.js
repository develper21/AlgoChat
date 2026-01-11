import apiClient from './client.js';

export const getCurrentUserProfile = async () => {
  const { data } = await apiClient.get('/api/profile/me');
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await apiClient.put('/api/profile/me', profileData);
  return data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const { data } = await apiClient.post('/api/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const removeAvatar = async () => {
  const { data } = await apiClient.delete('/api/profile/avatar');
  return data;
};

export const getUserProfile = async (userId) => {
  const { data } = await apiClient.get(`/api/profile/${userId}`);
  return data;
};
