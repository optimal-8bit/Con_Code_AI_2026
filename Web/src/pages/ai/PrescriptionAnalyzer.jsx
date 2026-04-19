import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { patientService } from '@/services/patient.service';
import { deriveMedicationPlan, handleApiError } from '@/lib/utils';
import { FileText, Upload, AlertCircle, CheckCircle, Pill, Calendar, ShoppingCart, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const STORAGE_KEY = 'prescription_analyzer_state';

export default function PrescriptionAnalyzer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    prescription_text: '',
    patient_age: '',
    patient_conditions: '',
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleResult, setScheduleResult] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Load persisted state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.result) setResult(parsed.result);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.scheduleResult) setScheduleResult(parsed.scheduleResult);
        if (parsed.scheduleSaved) setScheduleSaved(parsed.scheduleSaved);
      }
    } catch (err) {
      console.error('Error loading saved state:', err);
    }
  }, []);

  // Persist state whenever result changes
  useEffect(() => {
    if (result) {
      try {
        const stateToSave = {
          result,
          formData,
          scheduleResult,
          scheduleSaved,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (err) {
        console.error('Error saving state:', err);
      }
    }
  }, [result, formData, scheduleResult, scheduleSaved]);

  // Clear persisted state
  const clearResults = () => {
    setResult(null);
    setScheduleResult(null);
    setScheduleSaved(false);
    setError('');
    setScheduleError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setScheduleResult(null);
    setScheduleSaved(false);
    setScheduleError('');

    const data = new FormData();
    data.append('prescription_text', formData.prescription_text);
    // Only append optional fields if they have values
    if (formData.patient_age) data.append('patient_age', formData.patient_age);
    if (formData.patient_conditions) data.append('patient_conditions', formData.patient_conditions);
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

  const addAllToMedications = async () => {
    if (!result?.medicines) return;

    try {
      const prescriptionBatchId = result.record_id || null;

      for (const med of result.medicines) {
        const plan = deriveMedicationPlan({
          frequencyText: med.frequency,
          durationText: med.duration,
        });

        await patientService.addMedication({
          prescription_id: prescriptionBatchId,
          medicine_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          reminder_times: plan.reminderTimes,
          times_per_day: plan.timesPerDay,
          duration_days: plan.durationDays,
          total_doses: plan.totalDoses,
          instructions: med.instructions,
          start_date: new Date().toISOString(),
        });
      }
      alert(`✓ ${result.medicines.length} medicines added to your medications`);
      navigate('/patient/medications');
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const createSchedule = async () => {
    if (!result?.medicines) return;

    setScheduleLoading(true);
    setScheduleError('');

    const data = new FormData();
    data.append('prescription_text', formData.prescription_text || '');
    if (file) data.append('prescription_file', file);

    try {
      const schedule = await aiService.getPrescriptionSchedule(data);
      setScheduleResult(schedule);
      setScheduleSaved(false);
      alert('✓ Schedule created. You can now save it to Medical Records.');
    } catch (err) {
      setScheduleError(handleApiError(err));
    } finally {
      setScheduleLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!scheduleResult?.record_id) return;

    setSavingSchedule(true);
    setScheduleError('');

    try {
      await patientService.savePrescriptionScheduleToMedicalRecord(scheduleResult.record_id);
      setScheduleSaved(true);
      alert('✓ Schedule saved to Medical Records');
    } catch (err) {
      setScheduleError(handleApiError(err));
    } finally {
      setSavingSchedule(false);
    }
  };

  const orderFromPharmacy = () => {
    if (!result?.medicines) return;
    // Navigate to pharmacy order with medicines
    navigate('/patient/pharmacy-order', { 
      state: { 
        medicines: result.medicines.map(m => ({
          name: m.name,
          dosage: m.dosage,
          quantity: 1, // Default quantity
        }))
      } 
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Prescription Analyzer</h2>
              <p className="text-gray-600">Upload or paste your prescription for detailed analysis</p>
            </div>
          </div>
          {result && (
            <Button
              onClick={clearResults}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              <X className="h-4 w-4" />
              Clear Results
            </Button>
          )}
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

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-400 disabled:text-gray-200">
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
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <Button onClick={addAllToMedications} className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <Pill className="h-4 w-4 mr-2" />
                  Add to My Medications
                </Button>
                <Button onClick={createSchedule} disabled={scheduleLoading} className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-400 disabled:text-gray-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  {scheduleLoading ? 'Creating...' : 'Create Schedule'}
                </Button>
                <Button
                  onClick={saveSchedule}
                  disabled={!scheduleResult?.record_id || savingSchedule || scheduleSaved}
                  className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:bg-gray-400 disabled:text-gray-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingSchedule ? 'Saving...' : scheduleSaved ? 'Saved to Medical Records' : 'Save Schedule'}
                </Button>
                <Button
                  onClick={() => navigate('/patient/medication-schedule')}
                  className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Open Schedule Tracker
                </Button>
                <Button onClick={orderFromPharmacy} className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Order from Pharmacy
                </Button>
              </div>

              {scheduleError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{scheduleError}</span>
                </div>
              )}

              {scheduleResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Schedule ready</p>
                  <p className="text-sm text-green-800 mt-1">
                    {scheduleResult.total_medicines || 0} medicines scheduled.
                    {scheduleResult.next_upcoming_dose?.time
                      ? ` Next dose at ${scheduleResult.next_upcoming_dose.time}.`
                      : ''}
                  </p>
                  {scheduleSaved && (
                    <div className="mt-3">
                      <Button size="sm" onClick={() => navigate('/patient/records')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        View in Medical Records
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm font-semibold text-yellow-900 mb-2">Side Effects:</p>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                      li: ({node, ...props}) => <li className="text-sm text-yellow-800" {...props} />,
                                      p: ({node, ...props}) => <p className="text-sm text-yellow-800 mb-1" {...props} />,
                                      strong: ({node, ...props}) => <strong className="font-semibold text-yellow-900" {...props} />,
                                    }}
                                  >
                                    {med.side_effects.join('\n')}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                            {med.interactions && med.interactions.length > 0 && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                                <p className="text-sm font-semibold text-orange-900 mb-2">Interactions:</p>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                      li: ({node, ...props}) => <li className="text-sm text-orange-800" {...props} />,
                                      p: ({node, ...props}) => <p className="text-sm text-orange-800 mb-1" {...props} />,
                                      strong: ({node, ...props}) => <strong className="font-semibold text-orange-900" {...props} />,
                                    }}
                                  >
                                    {med.interactions.join('\n')}
                                  </ReactMarkdown>
                                </div>
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Summary Instructions:</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm text-blue-800 leading-relaxed" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm text-blue-800 mb-2 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-blue-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-blue-700" {...props} />,
                      }}
                    >
                      {result.summary_instructions.join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {result.drug_interactions && result.drug_interactions.length > 0 && (
                <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    ⚠️ Drug Interactions:
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm text-orange-800 leading-relaxed" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm text-orange-800 mb-2 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-orange-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-orange-700" {...props} />,
                      }}
                    >
                      {result.drug_interactions.join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {result.dietary_restrictions && result.dietary_restrictions.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Dietary Restrictions:</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm text-green-800 leading-relaxed" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm text-green-800 mb-2 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-green-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-green-700" {...props} />,
                      }}
                    >
                      {result.dietary_restrictions.join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {result.storage_instructions && result.storage_instructions.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Storage Instructions:</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-sm text-gray-700 leading-relaxed" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm text-gray-700 mb-2 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                      }}
                    >
                      {result.storage_instructions.join('\n')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
