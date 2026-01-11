import apiClient from './client.js';

export const createMeeting = async (meetingData) => {
  const response = await apiClient.post('/meetings', meetingData);
  return response.data;
};

export const getMyMeetings = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/meetings/my-meetings?${queryString}`);
  return response.data;
};

export const getMeeting = async (meetingId) => {
  const response = await apiClient.get(`/meetings/${meetingId}`);
  return response.data;
};

export const updateMeeting = async (meetingId, updateData) => {
  const response = await apiClient.put(`/meetings/${meetingId}`, updateData);
  return response.data;
};

export const deleteMeeting = async (meetingId) => {
  const response = await apiClient.delete(`/meetings/${meetingId}`);
  return response.data;
};

export const joinMeeting = async (joinData) => {
  const response = await apiClient.post('/meetings/join', joinData);
  return response.data;
};

export const startMeeting = async (meetingId) => {
  const response = await apiClient.post(`/meetings/${meetingId}/start`);
  return response.data;
};

export const endMeeting = async (meetingId) => {
  const response = await apiClient.post(`/meetings/${meetingId}/end`);
  return response.data;
};

export const getMeetingChat = async (meetingId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/meetings/${meetingId}/chat?${queryString}`);
  return response.data;
};

export const getPublicMeetings = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/meetings/public/list?${queryString}`);
  return response.data;
};
