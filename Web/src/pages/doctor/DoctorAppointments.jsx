import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { doctorService } from '@/services/doctor.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { Calendar, Check, X } from 'lucide-react';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await doctorService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await doctorService.updateAppointment(id, { status });
      loadAppointments();
    } catch (err) {
      alert(handleApiError(err));
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
           <Calendar className="h-6 w-6 text-blue-400" />
           <h2 className="text-2xl font-bold text-white">Appointments</h2>
        </div>

        <div className="grid gap-4">
          {appointments.length > 0 ? (
            appointments.map((appt) => (
              <BorderGlow key={appt.id} glowColor="210 60 40">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <span className="font-medium text-lg">{formatDateTime(appt.scheduled_at)}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl inline-block mt-2">
                        <p className="text-gray-300 text-sm">
                          <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mr-2">Reason:</span> 
                          <span className="text-white font-medium">{appt.reason || 'General Consultation'}</span>
                        </p>
                      </div>
                      {appt.notes && (
                        <p className="text-gray-400 text-sm italic mt-2">
                          <span className="font-medium text-gray-500 not-italic mr-1">Notes:</span> 
                          {appt.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-start sm:justify-end border-t border-white/10 sm:border-0 pt-4 sm:pt-0 w-full sm:w-auto gap-2">
                      {appt.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUpdateStatus(appt.id, 'confirmed')}>
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {appt.status === 'confirmed' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" onClick={() => handleUpdateStatus(appt.id, 'completed')}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </BorderGlow>
            ))
          ) : (
            <BorderGlow glowColor="0 0 50">
              <div className="py-16 text-center">
                <Calendar className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No appointments scheduled</p>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
