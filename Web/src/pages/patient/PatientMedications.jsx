import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patient.service';
import { handleApiError } from '@/lib/utils';
import { Pill, CheckCircle } from 'lucide-react';

export default function PatientMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const data = await patientService.getMedications();
      setMedications(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogDose = async (medId) => {
    try {
      await patientService.logMedication({
        medication_id: medId,
        status: 'taken',
        taken_at: new Date().toISOString(),
      });
      loadMedications();
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
        <h2 className="text-2xl font-bold text-gray-900">My Medications</h2>

        <div className="grid gap-4">
          {medications.length > 0 ? (
            medications.map((med) => (
              <Card key={med.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="h-5 w-5 text-purple-600" />
                        <h3 className="font-medium text-gray-900">{med.medicine_name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                      {med.reminder_times && med.reminder_times.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Reminders: {med.reminder_times.join(', ')}
                        </p>
                      )}
                      {med.adherence_rate !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${med.adherence_rate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{med.adherence_rate}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleLogDose(med.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Log Dose
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active medications</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
