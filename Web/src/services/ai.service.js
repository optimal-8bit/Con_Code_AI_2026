import apiClient from '@/lib/api-client';

export const aiService = {
  async checkSymptoms(formData) {
    const response = await apiClient.post('/ai/symptom-checker', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async analyzePrescription(formData) {
    const response = await apiClient.post('/ai/prescription-analyzer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async explainReport(formData) {
    const response = await apiClient.post('/ai/report-explainer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async chat(data) {
    const response = await apiClient.post('/ai/smart-chat', data);
    return response.data;
  },

  async chatStream(data) {
    const response = await apiClient.post('/ai/smart-chat/stream', data, {
      responseType: 'stream',
    });
    return response.data;
  },

  async getChatHistory(sessionId) {
    const response = await apiClient.get(`/ai/chat-history/${sessionId}`);
    return response.data;
  },

  async getSymptomHistory() {
    const response = await apiClient.get('/ai/symptom-history');
    return response.data;
  },

  async getPrescriptionSchedule(formData) {
    const response = await apiClient.post('/ai/prescription-schedule', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getPrescriptionSchedules() {
    const response = await apiClient.get('/ai/prescription-schedules');
    return response.data;
  },

  async logMedicationAdherence(formData) {
    const response = await apiClient.post('/ai/medication-adherence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
