import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { getSeverityColor, handleApiError } from '@/lib/utils';
import { Activity, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function SymptomChecker() {
  const [formData, setFormData] = useState({
    symptom_text: '',
    patient_age: '',
    patient_gender: '',
    known_conditions: '',
    current_medications: '',
    duration_days: '',
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const data = new FormData();
    data.append('symptom_text', formData.symptom_text);
    // Only append optional fields if they have values
    if (formData.patient_age) data.append('patient_age', formData.patient_age);
    if (formData.patient_gender) data.append('patient_gender', formData.patient_gender);
    if (formData.known_conditions) data.append('known_conditions', formData.known_conditions);
    if (formData.current_medications) data.append('current_medications', formData.current_medications);
    if (formData.duration_days) data.append('duration_days', formData.duration_days);
    if (file) data.append('image_file', file);

    try {
      const response = await aiService.checkSymptoms(data);
      setResult(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Symptom Checker</h2>
            <p className="text-gray-600">Describe your symptoms for AI-powered health insights</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Describe Your Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Symptoms *</label>
                <textarea
                  value={formData.symptom_text}
                  onChange={(e) => setFormData({ ...formData, symptom_text: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Describe your symptoms in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Age</label>
                  <Input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    placeholder="Your age"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={formData.patient_gender}
                    onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Duration (days)</label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  placeholder="How many days have you had these symptoms?"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Known Medical Conditions</label>
                <Input
                  value={formData.known_conditions}
                  onChange={(e) => setFormData({ ...formData, known_conditions: e.target.value })}
                  placeholder="e.g., Diabetes, Hypertension (comma-separated)"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Current Medications</label>
                <Input
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  placeholder="e.g., Aspirin, Metformin (comma-separated)"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Upload Image (Optional)</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Severity:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(result.severity)}`}>
                    {result.severity}
                  </span>
                </div>
              </div>

              {result.possible_conditions && result.possible_conditions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Possible Conditions:</h3>
                  <div className="space-y-2">
                    {result.possible_conditions.map((condition, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{condition.name}</p>
                        <p className="text-sm text-gray-600">{condition.description}</p>
                        {condition.probability && (
                          <p className="text-xs text-gray-500 mt-1">Probability: {condition.probability}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.red_flags && result.red_flags.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-900 mb-2">⚠️ Red Flags:</h3>
                  <ul className="space-y-1">
                    {result.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-700">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.next_steps && result.next_steps.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
                  <ul className="space-y-1">
                    {result.next_steps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.home_care_tips && result.home_care_tips.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Home Care Tips:</h3>
                  <ul className="space-y-1">
                    {result.home_care_tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommended_specialist && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Recommended Specialist:</span> {result.recommended_specialist}
                  </p>
                </div>
              )}

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">{result.disclaimer}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
