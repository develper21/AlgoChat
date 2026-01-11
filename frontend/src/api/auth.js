import apiClient, { setAuthToken } from './client.js';

export const registerUser = async (payload) => {
  const { data } = await apiClient.post('/api/auth/register', payload);
  setAuthToken(data.token);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await apiClient.post('/api/auth/login', payload);
  setAuthToken(data.token);
  return data;
};

export const logoutUser = () => {
  setAuthToken(null);
  localStorage.removeItem('algonive_token');
  localStorage.removeItem('algonive_user');
};

export const forgotPassword = async (payload) => {
  const { data } = await apiClient.post('/api/auth/forgot-password', payload);
  return data;
};

export const resetPassword = async (payload) => {
  const { data } = await apiClient.post('/api/auth/reset-password', payload);
  return data;
};

export const verifyEmail = async (payload) => {
  const { data } = await apiClient.post('/api/auth/verify-email', payload);
  return data;
};

export const resendVerificationEmail = async (payload) => {
  const { data } = await apiClient.post('/api/auth/resend-verification', payload);
  return data;
};
