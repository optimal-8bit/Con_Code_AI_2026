import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { getUrgencyColor, handleApiError } from '@/lib/utils';
import { ClipboardList, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReportExplainer() {
  const [formData, setFormData] = useState({
    report_text: '',
    question: 'Explain this medical report in simple language.',
    patient_age: '',
    patient_gender: '',
    report_type: 'general',
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
    data.append('report_text', formData.report_text);
    data.append('question', formData.question);
    // Only append optional fields if they have values
    if (formData.patient_age) data.append('patient_age', formData.patient_age);
    if (formData.patient_gender) data.append('patient_gender', formData.patient_gender);
    data.append('report_type', formData.report_type);
    if (file) data.append('report_file', file);

    try {
      const response = await aiService.explainReport(data);
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
          <ClipboardList className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Report Explainer</h2>
            <p className="text-gray-600">Upload your medical reports for easy-to-understand explanations</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Medical Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Report Image or PDF</label>
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*,application/pdf"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Or Paste Report Text</label>
                <textarea
                  value={formData.report_text}
                  onChange={(e) => setFormData({ ...formData, report_text: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Paste report text here..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Report Type</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="general">General</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="blood_test">Blood Test</option>
                  <option value="cbc">CBC</option>
                  <option value="lipid_profile">Lipid Profile</option>
                  <option value="imaging">Imaging (X-ray, MRI, CT)</option>
                  <option value="other">Other</option>
                </select>
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
                <label className="text-sm font-medium text-gray-700">Your Question (Optional)</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What would you like to know about this report?"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Analyzing...' : 'Explain Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Report Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Urgency:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(result.urgency)}`}>
                    {result.urgency}
                  </span>
                </div>
              </div>

              {result.plain_language_summary && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Summary:</h3>
                  <p className="text-blue-800">{result.plain_language_summary}</p>
                </div>
              )}

              {result.parameters && result.parameters.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Test Parameters:</h3>
                  <div className="space-y-2">
                    {result.parameters.map((param, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{param.name}</p>
                            <p className="text-sm text-gray-600">
                              Value: {param.value} {param.unit}
                              {param.reference_range && ` (Normal: ${param.reference_range})`}
                            </p>
                            {param.interpretation && (
                              <p className="text-sm text-gray-700 mt-1">{param.interpretation}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            param.status === 'normal' ? 'bg-green-100 text-green-800' :
                            param.status === 'low' ? 'bg-blue-100 text-blue-800' :
                            param.status === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {param.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.abnormalities && result.abnormalities.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">⚠️ Abnormalities:</h3>
                  <ul className="space-y-1">
                    {result.abnormalities.map((abnormality, idx) => (
                      <li key={idx} className="text-sm text-orange-800">• {abnormality}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.risk_factors && result.risk_factors.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Risk Factors:</h3>
                  <ul className="space-y-1">
                    {result.risk_factors.map((risk, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.actionable_insights && result.actionable_insights.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Actionable Insights:</h3>
                  <ul className="space-y-1">
                    {result.actionable_insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.lifestyle_recommendations && result.lifestyle_recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Lifestyle Recommendations:</h3>
                  <ul className="space-y-1">
                    {result.lifestyle_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.follow_up_tests && result.follow_up_tests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Recommended Follow-up Tests:</h3>
                  <ul className="space-y-1">
                    {result.follow_up_tests.map((test, idx) => (
                      <li key={idx} className="text-sm text-gray-700">• {test}</li>
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
