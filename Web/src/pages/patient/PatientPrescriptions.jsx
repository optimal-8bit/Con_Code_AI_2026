import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { patientService } from '@/services/patient.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { FileText, Pill } from 'lucide-react';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await patientService.getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-900">My Prescriptions</h2>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Issued: {formatDateTime(rx.issued_at)}</p>
                      <p className="text-sm text-gray-600">Valid Until: {formatDateTime(rx.valid_until)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">Medicines:</p>
                    {rx.medicines && rx.medicines.map((med, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <Pill className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} - {med.frequency} for {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {rx.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">{rx.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No prescriptions yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
