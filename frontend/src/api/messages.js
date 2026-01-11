import apiClient from './client.js';

export const sendMessageApi = async (payload) => {
  const { data } = await apiClient.post('/api/messages', payload);
  return data;
};

export const editMessageApi = async (messageId, payload) => {
  const { data } = await apiClient.put(`/api/messages/${messageId}/edit`, payload);
  return data;
};

export const deleteMessage = async (messageId) => {
  const { data } = await apiClient.delete(`/api/messages/${messageId}`);
  return data;
};

export const addReaction = async (messageId, emoji) => {
  const { data } = await apiClient.post(`/api/messages/${messageId}/reactions`, { emoji });
  return data;
};

export const removeReaction = async (messageId, emoji) => {
  const { data } = await apiClient.delete(`/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  return data;
};

export const forwardMessage = async (messageId, roomId, text) => {
  const { data } = await apiClient.post(`/api/messages/${messageId}/forward`, { roomId, text });
  return data;
};

export const startThread = async (messageId, content) => {
  const { data } = await apiClient.post(`/api/messages/${messageId}/thread`, content);
  return data;
};

export const getThreadMessages = async (messageId, page = 1, limit = 50) => {
  const { data } = await apiClient.get(`/api/messages/${messageId}/thread?page=${page}&limit=${limit}`);
  return data;
};

export const scheduleMessage = async (content) => {
  const { data } = await apiClient.post('/api/messages/schedule', content);
  return data;
};

export const getScheduledMessages = async () => {
  const { data } = await apiClient.get('/api/messages/scheduled');
  return data;
};

export const cancelScheduledMessage = async (messageId) => {
  const { data } = await apiClient.delete(`/api/messages/schedule/${messageId}`);
  return data;
};
