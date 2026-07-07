import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — tambahkan JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('laundry_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401/403 global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired atau tidak valid
      localStorage.removeItem('laundry_token');
      localStorage.removeItem('laundry_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
