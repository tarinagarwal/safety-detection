import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your backend URL
// For local testing: Use your computer's IP address (not localhost)
// Example: 'http://192.168.1.100:3000/api'
const BASE_URL = 'http://192.168.1.9:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, name: string, phone?: string) =>
    api.post('/auth/register', { email, password, name, phone }),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/users/profile', data),
};

export const guardiansAPI = {
  getAll: () => api.get('/guardians'),
  create: (data: { name: string; phone: string; email?: string; relationship: string }) =>
    api.post('/guardians', data),
  update: (id: string, data: { name?: string; phone?: string; email?: string; relationship?: string }) =>
    api.put(`/guardians/${id}`, data),
  delete: (id: string) => api.delete(`/guardians/${id}`),
};

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  createSOS: (data: {
    triggerType: 'manual' | 'voice' | 'secret_code';
    latitude: number;
    longitude: number;
    message?: string;
    address?: string;
  }) => api.post('/alerts/sos', data),
  updateStatus: (id: string, status: 'ACTIVE' | 'RESOLVED' | 'FALSE_ALARM') =>
    api.put(`/alerts/${id}/status`, { status }),
  getStats: () => api.get('/alerts/stats'),
};

export const locationAPI = {
  updateLocation: (data: { latitude: number; longitude: number; address?: string }) =>
    api.post('/locations', data),
  getHistory: (limit?: number) => api.get(`/locations/history?limit=${limit || 10}`),
  getLatest: () => api.get('/locations/latest'),
};

export default api;
