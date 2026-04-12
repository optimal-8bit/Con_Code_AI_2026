import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import PatientLayout from '@/components/layout/PatientLayout';
import BorderGlow from '@/components/ui/BorderGlow';
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
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </PatientLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <PatientLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold text-white">My Medications</h2>
        </motion.div>

        <div className="grid gap-4">
          {groupedBatches.length > 0 ? (
            groupedBatches.map((batch, batchIndex) => (
              <motion.div key={batch.batchId} variants={itemVariants}>
                <BorderGlow glowColor={`${200 + (batchIndex * 30)} 70 70`} className={batch.batchCompleted ? 'ring-2 ring-green-400/30' : ''}>
                  <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {batch.batchId === 'unlinked'
                          ? 'Unlinked Medication Entries'
                          : `Prescription Batch: ${batch.batchId.slice(0, 12)}...`}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {batch.medications.length} medicine(s) • {batch.loggedDoses}/{batch.totalDoses} doses logged
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Batch progress</span>
                      <div className="w-32 bg-white/20 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{ width: `${batch.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-medium">{batch.completionPercentage}%</span>
                    </div>
                  </div>

                  {batch.batchCompleted && (
                    <div className="rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-2 text-sm text-green-200">
                      ✓ This medicine batch is completed. A completion record is synced to Medical Records.
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {batch.medications.map((med) => {
                      const activeTime = selectedTimes[med.id] || med?.today_pending_times?.[0] || med?.reminder_times?.[0] || '08:00';
                      const completionPercentage = med.completion_percentage ?? med.adherence_rate ?? 0;
                      const doseStatus = med.today_statuses?.[activeTime] || 'pending';

                      return (
                        <BorderGlow key={med.id} glowColor="280 60 50" className="border-l-4 border-l-purple-400">
                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Pill className="h-5 w-5 text-purple-400" />
                                  <h4 className="font-medium text-white">{med.medicine_name}</h4>
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{med.dosage} • {med.frequency}</p>
                                {med.instructions ? (
                                  <p className="text-xs text-gray-400 mt-1">{med.instructions}</p>
                                ) : null}
                              </div>
                              {med.completed ? (
                                <span className="inline-flex items-center rounded-full bg-green-500/20 border border-green-400/30 px-2.5 py-1 text-xs font-medium text-green-200">
                                  <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                                  Completed
                                </span>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                              <p>Total doses: <span className="font-semibold text-white">{med.total_doses || 0}</span></p>
                              <p>Remaining: <span className="font-semibold text-white">{med.doses_remaining || 0}</span></p>
                              <p>Taken: <span className="font-semibold text-green-400">{med.doses_taken || 0}</span></p>
                              <p>Skipped: <span className="font-semibold text-red-400">{med.doses_skipped || 0}</span></p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                                <span>Completion</span>
                                <span className="text-white font-medium">{completionPercentage}%</span>
                              </div>
                              <div className="bg-white/20 rounded-full h-2">
                                <div className="bg-green-400 h-2 rounded-full" style={{ width: `${completionPercentage}%` }} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-200 flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                Select dose time
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(med.reminder_times || []).map((timeSlot) => {
                                  const slotStatus = med.today_statuses?.[timeSlot] || 'pending';
                                  const selected = activeTime === timeSlot;
                                  const baseClass = selected
                                    ? 'border-blue-400 bg-blue-500/30 text-blue-200'
                                    : 'border-white/30 bg-white/10 text-gray-300';
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
                                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all hover:scale-105 ${baseClass} ${statusClass}`}
                                      onClick={() =>
                                        setSelectedTimes((previous) => ({ ...previous, [med.id]: timeSlot }))
                                      }
                                    >
                                      {timeSlot}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-gray-400">Selected slot status: <span className="text-white font-medium">{doseStatus}</span></p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={Boolean(med.completed) || loggingId.startsWith(`${med.id}:`)}
                                onClick={() => handleLogDose(med, 'taken')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Taken
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={Boolean(med.completed) || loggingId.startsWith(`${med.id}:`)}
                                onClick={() => handleLogDose(med, 'skipped')}
                                className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Skip
                              </Button>
                            </div>
                          </div>
                        </BorderGlow>
                      );
                    })}
                  </div>
                </div>
              </BorderGlow>
            </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants}>
              <BorderGlow glowColor="200 60 40">
                <div className="py-12 text-center">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No active medications</p>
                </div>
              </BorderGlow>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PatientLayout>
  );
}
