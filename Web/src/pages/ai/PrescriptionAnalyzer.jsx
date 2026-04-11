import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { handleApiError } from '@/lib/utils';
import { FileText, Upload, AlertCircle, CheckCircle, Pill } from 'lucide-react';

export default function PrescriptionAnalyzer() {
  const [formData, setFormData] = useState({
    prescription_text: '',
    patient_age: '',
    patient_conditions: '',
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
    data.append('prescription_text', formData.prescription_text);
    data.append('patient_age', formData.patient_age || '');
    data.append('patient_conditions', formData.patient_conditions || '');
    if (file) data.append('prescription_file', file);

    try {
      const response = await aiService.analyzePrescription(data);
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
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Prescription Analyzer</h2>
            <p className="text-gray-600">Upload or paste your prescription for detailed analysis</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Prescription Image or PDF</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*,application/pdf"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Or Paste Prescription Text</label>
                <textarea
                  value={formData.prescription_text}
                  onChange={(e) => setFormData({ ...formData, prescription_text: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Paste prescription text here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Patient Age</label>
                  <Input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Medical Conditions</label>
                  <Input
                    value={formData.patient_conditions}
                    onChange={(e) => setFormData({ ...formData, patient_conditions: e.target.value })}
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Analyze Prescription'}
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
              {result.medicines && result.medicines.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Medicines:</h3>
                  <div className="space-y-3">
                    {result.medicines.map((med, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Pill className="h-5 w-5 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{med.name}</h4>
                            {med.generic_name && (
                              <p className="text-sm text-gray-600">Generic: {med.generic_name}</p>
                            )}
                            <div className="mt-2 space-y-1 text-sm">
                              <p className="text-gray-700">
                                <span className="font-medium">Dosage:</span> {med.dosage}
                              </p>
                              <p className="text-gray-700">
                                <span className="font-medium">Frequency:</span> {med.frequency}
                              </p>
                              <p className="text-gray-700">
                                <span className="font-medium">Duration:</span> {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Instructions:</span> {med.instructions}
                                </p>
                              )}
                            </div>
                            {med.side_effects && med.side_effects.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Side Effects:</p>
                                <ul className="text-sm text-gray-600 ml-4">
                                  {med.side_effects.map((effect, i) => (
                                    <li key={i}>• {effect}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {med.interactions && med.interactions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-orange-700">Interactions:</p>
                                <ul className="text-sm text-orange-600 ml-4">
                                  {med.interactions.map((interaction, i) => (
                                    <li key={i}>• {interaction}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.summary_instructions && result.summary_instructions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Summary Instructions:</h3>
                  <ul className="space-y-1">
                    {result.summary_instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.drug_interactions && result.drug_interactions.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">⚠️ Drug Interactions:</h3>
                  <ul className="space-y-1">
                    {result.drug_interactions.map((interaction, idx) => (
                      <li key={idx} className="text-sm text-orange-800">• {interaction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.dietary_restrictions && result.dietary_restrictions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Dietary Restrictions:</h3>
                  <ul className="space-y-1">
                    {result.dietary_restrictions.map((restriction, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {restriction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.storage_instructions && result.storage_instructions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Storage Instructions:</h3>
                  <ul className="space-y-1">
                    {result.storage_instructions.map((instruction, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
