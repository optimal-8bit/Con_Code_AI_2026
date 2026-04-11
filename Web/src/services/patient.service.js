import apiClient from '@/lib/api-client';

export const patientService = {
  async getDashboard() {
    const response = await apiClient.get('/patient/dashboard');
    return response.data;
  },

  async getAppointments(status = null) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/patient/appointments', { params });
    return response.data;
  },

  async bookAppointment(data) {
    const response = await apiClient.post('/patient/appointments', data);
    return response.data;
  },

  async getAppointment(id) {
    const response = await apiClient.get(`/patient/appointments/${id}`);
    return response.data;
  },

  async cancelAppointment(id) {
    const response = await apiClient.delete(`/patient/appointments/${id}`);
    return response.data;
  },

  async getPrescriptions() {
    const response = await apiClient.get('/patient/prescriptions');
    return response.data;
  },

  async getPrescription(id) {
    const response = await apiClient.get(`/patient/prescriptions/${id}`);
    return response.data;
  },

  async getMedicalRecords(recordType = null) {
    const params = recordType ? { record_type: recordType } : {};
    const response = await apiClient.get('/patient/records', { params });
    return response.data;
  },

  async uploadMedicalRecord(formData) {
    const response = await apiClient.post('/patient/records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getMedications() {
    const response = await apiClient.get('/patient/medications');
    return response.data;
  },

  async addMedication(data) {
    const response = await apiClient.post('/patient/medications', data);
    return response.data;
  },

  async logMedication(data) {
    const response = await apiClient.post('/patient/medications/log', data);
    return response.data;
  },

  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? { unread_only: true } : {};
    const response = await apiClient.get('/patient/notifications', { params });
    return response.data;
  },

  async markNotificationRead(id) {
    const response = await apiClient.patch(`/patient/notifications/${id}/read`);
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await apiClient.post('/patient/notifications/read-all');
    return response.data;
  },

  async searchDoctors(specialty = null, name = null) {
    const params = {};
    if (specialty) params.specialty = specialty;
    if (name) params.name = name;
    const response = await apiClient.get('/patient/doctors', { params });
    return response.data;
  },

  async matchPharmacies(medicines) {
    // Backend expects array directly, not wrapped in object
    const response = await apiClient.post('/patient/match-pharmacies', medicines);
    return response.data;
  },

  async createOrder(data) {
    const response = await apiClient.post('/patient/orders', data);
    return response.data;
  },

  async getOrders() {
    const response = await apiClient.get('/patient/orders');
    return response.data;
  },

  async getOrder(id) {
    const response = await apiClient.get(`/patient/orders/${id}`);
    return response.data;
  },

  async createPaymentIntent(orderId) {
    const response = await apiClient.post(`/patient/orders/${orderId}/payment-intent`);
    return response.data;
  },

  async confirmPayment(orderId) {
    const response = await apiClient.post(`/patient/orders/${orderId}/confirm-payment`);
    return response.data;
  },

  async getPrescriptionSchedules(limit = 20) {
    const response = await apiClient.get('/patient/ai/prescription-schedules', { params: { limit } });
    return response.data;
  },

  async getPrescriptionSchedule(id) {
    const response = await apiClient.get(`/patient/ai/prescription-schedules/${id}`);
    return response.data;
  },

  async getReportAnalyses(limit = 20) {
    const response = await apiClient.get('/patient/ai/report-analyses', { params: { limit } });
    return response.data;
  },

  async getReportAnalysis(id) {
    const response = await apiClient.get(`/patient/ai/report-analyses/${id}`);
    return response.data;
  },

  async getSymptomChecks(limit = 20) {
    const response = await apiClient.get('/patient/ai/symptom-checks', { params: { limit } });
    return response.data;
  },

  async getMedicationLogs(limit = 50) {
    const response = await apiClient.get('/patient/ai/medication-logs', { params: { limit } });
    return response.data;
  },

  async deletePrescriptionSchedule(id) {
    const response = await apiClient.delete(`/patient/ai/prescription-schedules/${id}`);
    return response.data;
  },

  async deleteReportAnalysis(id) {
    const response = await apiClient.delete(`/patient/ai/report-analyses/${id}`);
    return response.data;
  },
};
