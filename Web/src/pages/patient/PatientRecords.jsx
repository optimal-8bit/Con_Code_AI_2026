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
            records.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{record.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{record.record_type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDateTime(record.created_at)}</p>
                      {record.content && (
                        <p className="text-sm text-gray-700 mt-2">{record.content}</p>
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
            ))
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
