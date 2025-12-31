import apiClient from './client.js';

export const fetchRooms = async () => {
  const { data } = await apiClient.get('/api/rooms');
  return data;
};

export const createRoom = async (payload) => {
  const { data } = await apiClient.post('/api/rooms', payload);
  return data;
};

export const fetchRoomMessages = async (roomId) => {
  const { data } = await apiClient.get(`/api/rooms/${roomId}/messages`);
  return data;
};
