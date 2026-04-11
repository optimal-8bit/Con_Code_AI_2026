import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { doctorService } from '@/services/doctor.service';
import { handleApiError } from '@/lib/utils';
import { Users, Mail, Phone } from 'lucide-react';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await doctorService.getPatients();
      setPatients(data);
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
           <Users className="h-6 w-6 text-blue-400" />
           <h2 className="text-2xl font-bold text-white">My Patients</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.length > 0 ? (
            patients.map((patient) => (
              <BorderGlow key={patient.id} glowColor="210 60 40">
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white/10 border border-white/20 rounded-full shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{patient.name}</h3>
                      <p className="text-xs text-gray-400">{patient.id ? `ID: ${patient.id.slice(0, 8)}` : 'Patient'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-2.5 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="truncate" title={patient.email}>{patient.email}</span>
                    </div>
                    {patient.phone ? (
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Phone className="h-4 w-4 text-blue-400" />
                        <span>{patient.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-gray-500 italic">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <span>No phone provided</span>
                      </div>
                    )}
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50" className="md:col-span-2 lg:col-span-3">
              <div className="py-16 text-center">
                <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No patients found</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
