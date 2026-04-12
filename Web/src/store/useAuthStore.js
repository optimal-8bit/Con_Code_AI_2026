import { create } from 'zustand';
import { authService } from '@/services/auth.service';

export const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({ user: data.user, isAuthenticated: true, loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Login failed', loading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ user: data.user, isAuthenticated: true, loading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Registration failed', loading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set({ user: userData, isAuthenticated: true });
    localStorage.setItem('user', JSON.stringify(userData));
  },

  setAuth: (authData) => {
    // Store in localStorage first
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    // Then update state
    set({ 
      user: authData.user, 
      isAuthenticated: true,
      loading: false,
      error: null 
    });
  },

  clearError: () => set({ error: null }),
}));
