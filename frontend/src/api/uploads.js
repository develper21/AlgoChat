import apiClient from './client.js';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data;
};
