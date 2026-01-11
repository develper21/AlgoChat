import apiClient from './client.js';

export const setupTwoFactor = async () => {
  const { data } = await apiClient.post('/api/2fa/setup');
  return data;
};

export const enableTwoFactor = async (token, backupCodes) => {
  const { data } = await apiClient.post('/api/2fa/enable', { token, backupCodes });
  return data;
};

export const disableTwoFactor = async (password, token) => {
  const { data } = await apiClient.post('/api/2fa/disable', { password, token });
  return data;
};

export const verifyTwoFactor = async (email, token, backupCode) => {
  const { data } = await apiClient.post('/api/2fa/verify', { email, token, backupCode });
  return data;
};

export const getTwoFactorStatus = async () => {
  const { data } = await apiClient.get('/api/2fa/status');
  return data;
};

export const generateNewBackupCodes = async (password) => {
  const { data } = await apiClient.post('/api/2fa/backup-codes', { password });
  return data;
};
