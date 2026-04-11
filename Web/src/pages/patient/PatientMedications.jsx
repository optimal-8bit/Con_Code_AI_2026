import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patient.service';
import { handleApiError } from '@/lib/utils';
import { CalendarCheck2, CheckCircle, Clock3, Pill, XCircle } from 'lucide-react';

export default function PatientMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState('');
  const [selectedTimes, setSelectedTimes] = useState({});

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

  useEffect(() => {
    if (!medications.length) return;

    setSelectedTimes((previous) => {
      const next = { ...previous };

      medications.forEach((med) => {
        if (next[med.id]) return;

        const pending = Array.isArray(med.today_pending_times) ? med.today_pending_times : [];
        const reminderTimes = Array.isArray(med.reminder_times) ? med.reminder_times : [];
        next[med.id] = pending[0] || reminderTimes[0] || '08:00';
      });

      return next;
    });
  }, [medications]);

  const groupedBatches = useMemo(() => {
    const groups = new Map();

    medications.forEach((medication) => {
      const batchId = medication.prescription_id || 'unlinked';
      if (!groups.has(batchId)) {
        groups.set(batchId, {
          batchId,
          medications: [],
          created_at: medication.created_at,
        });
      }

      const group = groups.get(batchId);
      group.medications.push(medication);

      if ((medication.created_at || '') > (group.created_at || '')) {
        group.created_at = medication.created_at;
      }
    });

    return Array.from(groups.values())
      .map((group) => {
        const totalDoses = group.medications.reduce((sum, med) => sum + (med.total_doses || 0), 0);
        const loggedDoses = group.medications.reduce((sum, med) => sum + (med.doses_logged || 0), 0);
        const batchCompleted = group.medications.every((med) => Boolean(med.completed));

        return {
          ...group,
          totalDoses,
          loggedDoses,
          completionPercentage: totalDoses > 0 ? Math.round((loggedDoses / totalDoses) * 100) : 0,
          batchCompleted,
        };
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [medications]);

  const handleLogDose = async (med, status = 'taken') => {
    if (!med?.id) return;

    const scheduledTime = selectedTimes[med.id] || med?.today_pending_times?.[0] || med?.reminder_times?.[0] || null;

    try {
      setLoggingId(`${med.id}:${scheduledTime || 'none'}:${status}`);
      await patientService.logMedication({
        medication_id: med.id,
        scheduled_time: scheduledTime,
        status,
        taken_at: new Date().toISOString(),
      });
      await loadMedications();
    } catch (err) {
      alert(handleApiError(err));
    } finally {
      setLoggingId('');
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
          {groupedBatches.length > 0 ? (
            groupedBatches.map((batch) => (
              <Card key={batch.batchId} className={batch.batchCompleted ? 'border-green-200 bg-green-50/40' : ''}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {batch.batchId === 'unlinked'
                          ? 'Unlinked Medication Entries'
                          : `Prescription Batch: ${batch.batchId.slice(0, 12)}...`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {batch.medications.length} medicine(s) • {batch.loggedDoses}/{batch.totalDoses} doses logged
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Batch progress</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${batch.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{batch.completionPercentage}%</span>
                    </div>
                  </div>

                  {batch.batchCompleted && (
                    <div className="rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-900">
                      This medicine batch is completed. A completion record is synced to Medical Records.
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {batch.medications.map((med) => {
                      const activeTime = selectedTimes[med.id] || med?.today_pending_times?.[0] || med?.reminder_times?.[0] || '08:00';
                      const completionPercentage = med.completion_percentage ?? med.adherence_rate ?? 0;
                      const doseStatus = med.today_statuses?.[activeTime] || 'pending';

                      return (
                        <Card key={med.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="pt-5 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Pill className="h-5 w-5 text-purple-600" />
                                  <h4 className="font-medium text-gray-900">{med.medicine_name}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{med.dosage} • {med.frequency}</p>
                                {med.instructions ? (
                                  <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                ) : null}
                              </div>
                              {med.completed ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                  <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                                  Dose Completed
                                </span>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <p>Total doses: <span className="font-semibold text-gray-800">{med.total_doses || 0}</span></p>
                              <p>Remaining: <span className="font-semibold text-gray-800">{med.doses_remaining || 0}</span></p>
                              <p>Taken: <span className="font-semibold text-green-700">{med.doses_taken || 0}</span></p>
                              <p>Skipped: <span className="font-semibold text-red-700">{med.doses_skipped || 0}</span></p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Completion</span>
                                <span>{completionPercentage}%</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${completionPercentage}%` }} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                Select dose time
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(med.reminder_times || []).map((timeSlot) => {
                                  const slotStatus = med.today_statuses?.[timeSlot] || 'pending';
                                  const selected = activeTime === timeSlot;
                                  const baseClass = selected
                                    ? 'border-blue-500 bg-blue-100 text-blue-800'
                                    : 'border-gray-300 bg-white text-gray-700';
                                  const statusClass =
                                    slotStatus === 'taken' || slotStatus === 'late'
                                      ? 'ring-1 ring-green-400'
                                      : slotStatus === 'skipped'
                                        ? 'ring-1 ring-red-400'
                                        : '';

                                  return (
                                    <button
                                      key={`${med.id}-${timeSlot}`}
                                      type="button"
                                      className={`rounded-full border px-3 py-1 text-xs font-medium ${baseClass} ${statusClass}`}
                                      onClick={() =>
                                        setSelectedTimes((previous) => ({ ...previous, [med.id]: timeSlot }))
                                      }
                                    >
                                      {timeSlot}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-gray-500">Selected slot status: {doseStatus}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={Boolean(med.completed) || loggingId.startsWith(`${med.id}:`)}
                                onClick={() => handleLogDose(med, 'taken')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Taken
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={Boolean(med.completed) || loggingId.startsWith(`${med.id}:`)}
                                onClick={() => handleLogDose(med, 'skipped')}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Skip
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
