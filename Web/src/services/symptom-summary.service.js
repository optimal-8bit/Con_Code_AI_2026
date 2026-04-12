import api from '@/lib/api-client';

export const symptomSummaryService = {
  async generateSummary(symptomData) {
    const response = await api.post('/symptom-summary/generate', {
      symptom_text: symptomData.symptom_text || '',
      possible_conditions: symptomData.possible_conditions || [],
      severity: symptomData.severity || '',
      red_flags: symptomData.red_flags || [],
      next_steps: symptomData.next_steps || [],
      recommended_specialist: symptomData.recommended_specialist || '',
      home_care_tips: symptomData.home_care_tips || []
    });
    return response.data;
  }
};
