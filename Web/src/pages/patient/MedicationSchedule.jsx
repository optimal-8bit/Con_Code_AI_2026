import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services/ai.service';
import { patientService } from '@/services/patient.service';
import { handleApiError } from '@/lib/utils';
import { Clock, Pill, Calendar, CheckCircle, XCircle, Upload, AlertCircle } from 'lucide-react';

export default function MedicationSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPrescriptionSchedules(20);
      setSchedules(data);
      if (data.length > 0 && !selectedSchedule) {
        setSelectedSchedule(data[0]);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('prescription_file', file);

    try {
      const result = await aiService.getPrescriptionSchedule(formData);
      await loadSchedules();
      setUploadMode(false);
      setFile(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const logAdherence = async (medicineName, scheduledTime, status) => {
    try {
      const formData = new FormData();
      formData.append('medicine_name', medicineName);
      formData.append('scheduled_time', scheduledTime);
      formData.append('status', status);

      await aiService.logMedicationAdherence(formData);
      
      // Refresh the schedule
      await loadSchedules();
      
      // Show success message
      alert(`✓ ${medicineName} marked as ${status}`);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const addToMedications = async (medicine) => {
    try {
      const reminderTimes = Array.isArray(medicine.timing) && medicine.timing.length > 0
        ? medicine.timing
        : [];
      const timesPerDay = Math.max(medicine.times_per_day || 1, reminderTimes.length || 1);
      const parsedDuration = Number.parseInt(medicine.duration_days, 10);
      const durationDays = Number.isFinite(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : 1;

      await patientService.addMedication({
        prescription_id: selectedSchedule?.id || null,
        medicine_name: medicine.name,
        dosage: medicine.dosage,
        frequency: `${medicine.times_per_day}x daily`,
        reminder_times: reminderTimes,
        times_per_day: timesPerDay,
        duration_days: durationDays,
        total_doses: timesPerDay * durationDays,
        instructions: medicine.instructions,
        start_date: new Date().toISOString(),
      });
      alert(`✓ ${medicine.name} added to your medications`);
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

  if (uploadMode) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Upload Prescription</h2>
            <Button variant="ghost" onClick={() => setUploadMode(false)}>Cancel</Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Prescription Image or PDF</label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept="image/*,application/pdf"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? 'Analyzing...' : 'Create Schedule'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (schedules.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medication Schedule</h2>
              <p className="text-gray-600">Upload a prescription to create your medication schedule</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Yet</h3>
              <p className="text-gray-600 mb-6">Upload your prescription to get started</p>
              <Button onClick={() => setUploadMode(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Prescription
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const schedule = selectedSchedule?.output || {};
  const nextDose = schedule.next_upcoming_dose;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medication Schedule</h2>
              <p className="text-gray-600">Track your daily medication routine</p>
            </div>
          </div>
          <Button onClick={() => setUploadMode(true)}>
            <Upload className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>

        {/* Next Dose Banner */}
        {nextDose && (
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center w-20 h-20 bg-white/20 rounded-full">
                  <Clock className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">Next Dose: {nextDose.time}</h3>
                  <p className="text-lg font-medium">{nextDose.medicine} - {nextDose.dosage}</p>
                  {nextDose.instructions && (
                    <p className="text-sm mt-1 opacity-90">{nextDose.instructions}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{schedule.schedule_summary}</p>
            <div className="mt-4 flex gap-4">
              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Medicines</span>
                <p className="text-2xl font-bold text-blue-600">{schedule.total_medicines || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medicine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(schedule.medicines || []).map((medicine, idx) => (
            <Card key={idx} className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{medicine.name}</CardTitle>
                    <p className="text-blue-600 font-semibold mt-1">{medicine.dosage}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {medicine.times_per_day}x daily
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Details */}
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{medicine.duration_days || 'As prescribed'} {medicine.duration_days ? 'days' : ''}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Frequency</span>
                    <span className="font-medium">{medicine.times_per_day} times per day</span>
                  </div>
                </div>

                {/* Daily Schedule */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Schedule
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {medicine.timing.map((time, timeIdx) => (
                      <span
                        key={timeIdx}
                        className={`px-4 py-2 rounded-full font-semibold text-sm ${
                          time === medicine.next_dose
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border-2 border-blue-600'
                        }`}
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {medicine.instructions && (
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>📝 Instructions:</strong> {medicine.instructions}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => logAdherence(medicine.name, medicine.timing[0], 'taken')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Taken
                  </Button>
                  <Button
                    onClick={() => logAdherence(medicine.name, medicine.timing[0], 'skipped')}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Skipped
                  </Button>
                </div>

                {/* Add to Medications */}
                <Button
                  onClick={() => addToMedications(medicine)}
                  variant="ghost"
                  className="w-full"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Add to My Medications
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schedule History */}
        {schedules.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedules.slice(1, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedSchedule(s)}
                  >
                    <div>
                      <p className="font-medium">{s.output?.total_medicines || 0} medicines</p>
                      <p className="text-sm text-gray-600">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
