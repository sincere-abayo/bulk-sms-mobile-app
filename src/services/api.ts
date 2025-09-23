import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's IP address instead of localhost for mobile testing
// Replace with your actual IP address
const API_BASE_URL = 'http://192.168.137.100:4000/api';

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

// Handle network errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a network error
    if (!error.response && (error.code === 'NETWORK_ERROR' || error.message === 'Network Error')) {
      // This will be caught by individual API calls and handled with offline warnings
      throw new Error('OFFLINE');
    }

    // For other errors, pass them through
    throw error;
  }
);

export const authService = {
  register: async (phone: string) => {
    const response = await api.post('/auth/register', { phone });
    return response.data;
  },

  verifyOTP: async (phone: string, otp: string, name?: string) => {
    const response = await api.post('/auth/verify-otp', { phone, otp, name });
    return response.data;
  },

  // Contact Management
  getContacts: async () => {
    const response = await api.get('/auth/contacts');
    return response.data;
  },

  createContact: async (contactData: { name: string; phone: string; source?: string }) => {
    const response = await api.post('/auth/contacts', contactData);
    return response.data;
  },

  updateContact: async (id: string, contactData: { name?: string; phone?: string }) => {
    const response = await api.put(`/auth/contacts/${id}`, contactData);
    return response.data;
  },

  deleteContact: async (id: string) => {
    const response = await api.delete(`/auth/contacts/${id}`);
    return response.data;
  },

  bulkCreateContacts: async (contacts: Array<{ name: string; phone: string; source?: string }>) => {
    const response = await api.post('/auth/contacts/bulk', { contacts });
    return response.data;
  },
};

export default api;