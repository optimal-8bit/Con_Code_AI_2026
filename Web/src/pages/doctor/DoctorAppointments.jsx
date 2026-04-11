import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
        <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>

        <div className="grid gap-4">
          {appointments.length > 0 ? (
            appointments.map((appt) => (
              <Card key={appt.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-900">{formatDateTime(appt.scheduled_at)}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        <span className="font-medium">Reason:</span> {appt.reason || 'General Consultation'}
                      </p>
                      {appt.notes && (
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Notes:</span> {appt.notes}
                        </p>
                      )}
                    </div>
                    {appt.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateStatus(appt.id, 'confirmed')}>
                          <Check className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    {appt.status === 'confirmed' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(appt.id, 'completed')}>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
