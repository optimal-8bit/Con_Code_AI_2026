import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { doctorService } from '@/services/doctor.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { FileText } from 'lucide-react';

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await doctorService.getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
           <FileText className="h-6 w-6 text-blue-400" />
           <h2 className="text-2xl font-bold text-white">Issued Prescriptions</h2>
        </div>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <BorderGlow key={rx.id} glowColor="210 60 40">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-medium text-white text-lg">Patient ID: <span className="text-blue-400">{rx.patient_id}</span></p>
                      <p className="text-sm text-gray-400 mt-1">Issued: {formatDateTime(rx.issued_at)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(rx.status)}`}>
                      {rx.status}
                    </span>
                  </div>
                  <div className="space-y-3 bg-white/5 rounded-xl border border-white/5 p-4 mt-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                      <p className="font-semibold text-blue-400 uppercase tracking-wider text-sm">Medicines</p>
                      <span className="bg-blue-600/20 text-blue-400 py-1 px-2.5 rounded-full text-xs font-bold">{rx.medicines?.length || 0} items</span>
                    </div>
                    {rx.notes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-300 italic">
                          <span className="font-semibold text-gray-500 not-italic mr-1">Notes:</span> 
                          {rx.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50">
              <div className="py-16 text-center">
                <FileText className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No prescriptions issued yet</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
