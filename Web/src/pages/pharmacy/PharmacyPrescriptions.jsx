import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pharmacyService } from '@/services/pharmacy.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { FileText } from 'lucide-react';

export default function PharmacyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await pharmacyService.getAllPendingPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (id) => {
    try {
      await pharmacyService.updatePrescription(id, { status: 'dispensed' });
      loadPrescriptions();
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
        <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Issued: {formatDateTime(rx.issued_at)}</p>
                      <p className="text-sm text-gray-600">Patient ID: {rx.patient_id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="font-medium text-gray-900">Medicines:</p>
                    {rx.medicines && rx.medicines.map((med, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-gray-600">{med.dosage} - {med.frequency}</p>
                      </div>
                    ))}
                  </div>
                  {rx.status !== 'dispensed' && (
                    <Button size="sm" onClick={() => handleDispense(rx.id)}>
                      Mark as Dispensed
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No prescriptions to dispense</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
