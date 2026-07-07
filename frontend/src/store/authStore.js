import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('laundry_user') || 'null'),
  token: localStorage.getItem('laundry_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('laundry_token', token);
      localStorage.setItem('laundry_user', JSON.stringify(user));

      set({ token, user, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login gagal.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('laundry_token');
    localStorage.removeItem('laundry_user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token,

  // Level IDs: 1=Admin, 2=Operator, 3=Pimpinan
  isAdmin: () => get().user?.id_level === 1,
  isOperator: () => get().user?.id_level === 2,
  isPimpinan: () => get().user?.id_level === 3,
  isAdminOrOperator: () => [1, 2].includes(get().user?.id_level),
}));

export default useAuthStore;
