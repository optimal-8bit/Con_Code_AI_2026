import { useState, useEffect } from 'react';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import BorderGlow from '@/components/ui/BorderGlow';
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
      <PharmacyLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
        </div>
      </PharmacyLayout>
    );
  }

  return (
    <PharmacyLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
           <FileText className="h-6 w-6 text-emerald-400" />
           <h2 className="text-2xl font-bold text-white">Prescriptions</h2>
        </div>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <BorderGlow key={rx.id} glowColor="180 40 40">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-medium text-white text-lg">Patient ID: <span className="text-emerald-400">{rx.patient_id}</span></p>
                      <p className="text-sm text-gray-400 mt-1">Issued: {formatDateTime(rx.issued_at)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <p className="font-medium text-emerald-400 uppercase tracking-wider text-sm mb-2">Medicines to Dispense</p>
                    {rx.medicines && rx.medicines.map((med, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                        <p className="font-medium text-white">{med.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{med.dosage} <span className="text-gray-600 mx-1">•</span> {med.frequency}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-2 border-t border-white/10 mt-4">
                    {rx.status !== 'dispensed' && (
                      <Button onClick={() => handleDispense(rx.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto mt-4">
                        Mark as Dispensed
                      </Button>
                    )}
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50">
              <div className="py-16 text-center">
                <FileText className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No prescriptions to dispense</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </PharmacyLayout>
  );
}
