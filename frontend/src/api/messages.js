import apiClient from './client.js';

export const sendMessageApi = async (payload) => {
  const { data } = await apiClient.post('/api/messages', payload);
  return data;
};

export const editMessageApi = async (messageId, payload) => {
  const { data } = await apiClient.put(`/api/messages/${messageId}/edit`, payload);
  return data;
};

export const deleteMessageApi = async (messageId) => {
  const { data } = await apiClient.delete(`/api/messages/${messageId}`);
  return data;
};
