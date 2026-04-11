import apiClient from '@/lib/api-client';

export const pharmacyService = {
  async getDashboard() {
    const response = await apiClient.get('/pharmacy/dashboard');
    return response.data;
  },

  async getPrescriptions(status = null) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/pharmacy/prescriptions', { params });
    return response.data;
  },

  async getAllPendingPrescriptions() {
    const response = await apiClient.get('/pharmacy/prescriptions/all-pending');
    return response.data;
  },

  async updatePrescription(id, data) {
    const response = await apiClient.patch(`/pharmacy/prescriptions/${id}`, data);
    return response.data;
  },

  async getInventory(search = null) {
    const params = search ? { search } : {};
    const response = await apiClient.get('/pharmacy/inventory', { params });
    return response.data;
  },

  async addInventoryItem(data) {
    const response = await apiClient.post('/pharmacy/inventory', data);
    return response.data;
  },

  async updateStockQuantity(itemId, delta) {
    const response = await apiClient.patch(`/pharmacy/inventory/${itemId}/quantity`, null, {
      params: { delta },
    });
    return response.data;
  },

  async getLowStockAlerts() {
    const response = await apiClient.get('/pharmacy/inventory/low-stock');
    return response.data;
  },

  async getNotifications() {
    const response = await apiClient.get('/pharmacy/notifications');
    return response.data;
  },

  async getOrders(status = null) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/pharmacy/orders', { params });
    return response.data;
  },

  async getOrder(id) {
    const response = await apiClient.get(`/pharmacy/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id, status) {
    const response = await apiClient.patch(`/pharmacy/orders/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },
};
