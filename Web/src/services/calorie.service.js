import api from '@/lib/api-client';

export const calorieService = {
  // Add or update a meal entry
  async addMealEntry(date, mealType, foods) {
    const response = await api.post('/calories/entry', {
      date,
      meal_type: mealType,
      foods
    });
    return response.data;
  },

  // Get calorie data for a specific date
  async getDailyCalories(date) {
    const response = await api.get(`/calories/daily/${date}`);
    return response.data;
  },

  // Get monthly calorie data for heatmap
  async getMonthlyCalories(year, month) {
    const response = await api.get(`/calories/monthly/${year}/${month}`);
    return response.data;
  }
};
