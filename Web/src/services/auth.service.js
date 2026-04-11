import apiClient from '@/lib/api-client';

const authService = {
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await apiClient.patch('/auth/me', data);
    return response.data;
  },

  async changePassword(oldPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default authService;
