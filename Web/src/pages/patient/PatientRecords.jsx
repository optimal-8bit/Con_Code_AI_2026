import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { patientService } from '@/services/patient.service';
import { formatDateTime, handleApiError } from '@/lib/utils';
import { FileText, Upload, Plus, X } from 'lucide-react';

export default function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    record_type: 'lab_report',
    content: '',
  });
  const [file, setFile] = useState(null);

  const parseScheduleContent = (content) => {
    if (!content) return null;
    if (typeof content === 'object') return content;

    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.source === 'ai_prescription_schedule') {
        return parsed;
      }
    } catch {
      return null;
    }

    return null;
  };

  const parseMedicationBatchContent = (content) => {
    if (!content) return null;
    if (typeof content === 'object') {
      return content.source === 'medication_tracker' ? content : null;
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.source === 'medication_tracker') {
        return parsed;
      }
    } catch {
      return null;
    }

    return null;
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await patientService.getMedicalRecords();
      setRecords(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('record_type', formData.record_type);
    data.append('content', formData.content);
    if (file) data.append('file', file);

    try {
      await patientService.uploadMedicalRecord(data);
      setShowUpload(false);
      setFormData({ title: '', record_type: 'lab_report', content: '' });
      setFile(null);
      loadRecords();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Record
          </Button>
        </div>

        {showUpload && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.record_type}
                    onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="lab_report">Lab Report</option>
                    <option value="imaging">Imaging</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="surgery">Surgery</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">File</label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept="image/*,application/pdf"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Upload</Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {records.length > 0 ? (
            records.map((record) => {
              const scheduleContent =
                record.record_type === 'medication_schedule'
                  ? parseScheduleContent(record.content)
                  : null;
              const medicationBatchContent =
                record.record_type === 'medication_batch_completion'
                  ? parseMedicationBatchContent(record.content)
                  : null;

              return (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{record.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">{record.record_type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDateTime(record.created_at)}</p>

                        {scheduleContent ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm font-medium text-blue-900">
                              {scheduleContent.total_medicines || 0} medicines in this schedule
                            </p>
                            {scheduleContent.schedule_summary && (
                              <p className="text-sm text-blue-800">{scheduleContent.schedule_summary}</p>
                            )}
                            {scheduleContent.next_upcoming_dose?.time && (
                              <p className="text-sm text-blue-800">
                                Next dose: {scheduleContent.next_upcoming_dose.medicine} at{' '}
                                {scheduleContent.next_upcoming_dose.time}
                              </p>
                            )}
                            {Array.isArray(scheduleContent.medicines) && scheduleContent.medicines.length > 0 && (
                              <div className="pt-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                                  Medicines
                                </p>
                                <ul className="mt-1 space-y-1 text-sm text-blue-900">
                                  {scheduleContent.medicines.map((medicine, index) => (
                                    <li key={`${medicine.name || 'medicine'}-${index}`}>
                                      • {medicine.name} ({medicine.dosage}) - {medicine.timing?.join(', ') || 'timings not available'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : medicationBatchContent ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-sm font-medium text-green-900">
                              Medication batch completed
                            </p>
                            {Array.isArray(medicationBatchContent.medications) && (
                              <ul className="space-y-1 text-sm text-green-800">
                                {medicationBatchContent.medications.map((item, index) => (
                                  <li key={`${item.medicine_name || 'medicine'}-${index}`}>
                                    • {item.medicine_name}: {item.doses_taken}/{item.total_doses} taken
                                    {item.doses_skipped ? `, ${item.doses_skipped} skipped` : ''}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          record.content && <p className="text-sm text-gray-700 mt-2">{record.content}</p>
                        )}
                      </div>

                      {record.file_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                            View File
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No medical records yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
