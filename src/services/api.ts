import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's IP address instead of localhost for mobile testing
// Replace with your actual IP address
const API_BASE_URL = 'http://192.168.137.18:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (phone: string, name: string) => {
    const response = await api.post('/auth/register', { phone, name });
    return response.data;
  },
  
  verifyOTP: async (phone: string, otp: string, name: string) => {
    const response = await api.post('/auth/verify-otp', { phone, otp, name });
    return response.data;
  },
};

export default api;