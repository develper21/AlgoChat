import apiClient from './client.js';

export const searchMessages = async (roomId, query, page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/api/search/messages/${roomId}`, {
    params: { q: query, page, limit }
  });
  return data;
};

export const searchAllMessages = async (query, page = 1, limit = 20) => {
  const { data } = await apiClient.get('/api/search/messages', {
    params: { q: query, page, limit }
  });
  return data;
};

export const searchUsers = async (query, page = 1, limit = 10) => {
  const { data } = await apiClient.get('/api/search/users', {
    params: { q: query, page, limit }
  });
  return data;
};
