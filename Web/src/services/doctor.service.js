import apiClient from '@/lib/api-client';

const doctorService = {
  // Dashboard
  async getDashboard() {
    const response = await apiClient.get('/doctor/dashboard');
    return response.data;
  },

  // Appointments
  async getAppointments(status = null) {
    const params = status ? { status } : {};
    const response = await apiClient.get('/doctor/appointments', { params });
    return response.data;
  },

  async updateAppointment(id, data) {
    const response = await apiClient.patch(`/doctor/appointments/${id}`, data);
    return response.data;
  },

  // Patients
  async getPatients() {
    const response = await apiClient.get('/doctor/patients');
    return response.data;
  },

  async getPatient(id) {
    const response = await apiClient.get(`/doctor/patients/${id}`);
    return response.data;
  },

  // Prescriptions
  async issuePrescription(data) {
    const response = await apiClient.post('/doctor/prescriptions', data);
    return response.data;
  },

  async getPrescriptions() {
    const response = await apiClient.get('/doctor/prescriptions');
    return response.data;
  },

  // Notifications
  async getNotifications() {
    const response = await apiClient.get('/doctor/notifications');
    return response.data;
  },

  async markNotificationRead(id) {
    const response = await apiClient.patch(`/doctor/notifications/${id}/read`);
    return response.data;
  },

  // Availability
  async setAvailability(date, slots) {
    const response = await apiClient.post('/doctor/availability', {
      date,
      available_slots: slots,
    });
    return response.data;
  },

  async getAvailability(date) {
    const response = await apiClient.get(`/doctor/availability/${date}`);
    return response.data;
  },

  async getDoctorAvailabilityPublic(doctorId, date) {
    const response = await apiClient.get(`/doctor/public/${doctorId}/availability/${date}`);
    return response.data;
  },
};

export default doctorService;
