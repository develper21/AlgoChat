import axios from 'axios';
import { handleApiError } from '../utils/errorHandler.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export default apiClient;

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle the error and re-throw for individual components to handle
    const handledError = handleApiError(error, {
      showToast: false, // Let components handle their own notifications
      context: { url: error.config?.url, method: error.config?.method?.toUpperCase() }
    });
    
    // Re-throw the error so components can handle it
    return Promise.reject(handledError);
  }
);
