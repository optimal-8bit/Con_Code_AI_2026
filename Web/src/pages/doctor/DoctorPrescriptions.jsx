import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doctorService } from '@/services/doctor.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { AlertCircle, FileText, Pill, Upload, X } from 'lucide-react';

const getFileExtension = (fileUrl = '') => {
  try {
    return new URL(fileUrl).pathname.split('.').pop()?.toLowerCase() || '';
  } catch {
    return fileUrl.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';
  }
};

const isImageFile = (fileUrl = '') => {
  const extension = getFileExtension(fileUrl);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'avif'].includes(extension);
};

const isPdfFile = (fileUrl = '') => getFileExtension(fileUrl) === 'pdf';

export default function DoctorPrescriptions() {
  const location = useLocation();

  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');

  const [form, setForm] = useState({
    appointment_id: '',
    notes: '',
    valid_days: 30,
    prescription_file: null,
  });

  const appointmentOptions = useMemo(
    () => appointments.filter((appointment) => appointment.status !== 'cancelled'),
    [appointments],
  );

  const selectedAppointment = useMemo(
    () => appointmentOptions.find((appointment) => appointment.id === form.appointment_id) || null,
    [appointmentOptions, form.appointment_id],
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!appointmentOptions.length) return;

    const stateAppointmentId = location.state?.appointmentId;
    const statePatientId = location.state?.patientId;

    if (stateAppointmentId && appointmentOptions.some((appointment) => appointment.id === stateAppointmentId)) {
      setForm((previous) => ({ ...previous, appointment_id: stateAppointmentId }));
      return;
    }

    if (statePatientId) {
      const patientAppointment = appointmentOptions.find(
        (appointment) => appointment.patient_id === statePatientId,
      );
      if (patientAppointment) {
        setForm((previous) => ({ ...previous, appointment_id: patientAppointment.id }));
      }
    }
  }, [appointmentOptions, location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prescriptionData, appointmentData] = await Promise.all([
        doctorService.getPrescriptions(),
        doctorService.getAppointments(),
      ]);
      setPrescriptions(prescriptionData || []);
      setAppointments(appointmentData || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePrescription = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAppointment) {
      setError('Please select an appointment/patient.');
      return;
    }

    const formData = new FormData();
    formData.append('patient_id', selectedAppointment.patient_id);
    formData.append('appointment_id', selectedAppointment.id);
    formData.append('notes', form.notes || '');
    formData.append('valid_days', String(form.valid_days || 30));
    formData.append('medicines_json', JSON.stringify([]));
    if (form.prescription_file) {
      formData.append('prescription_file', form.prescription_file);
    }

    try {
      setSubmitting(true);
      await doctorService.issuePrescriptionWithUpload(formData);
      setSuccess('Prescription issued successfully. It is now visible for this patient and in your issued list.');
      setForm((previous) => ({
        ...previous,
        notes: '',
        valid_days: 30,
        prescription_file: null,
      }));
      await loadData();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openFilePreview = (fileUrl) => {
    setPreviewFileUrl(fileUrl || '');
    setPreviewFileType(isPdfFile(fileUrl) ? 'pdf' : 'image');
  };

  const closeFilePreview = () => {
    setPreviewFileUrl('');
    setPreviewFileType('');
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </DoctorLayout>
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
    <DoctorLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold text-white">Issued Prescriptions</h2>
        </motion.div>

        <motion.div variants={itemVariants}>
          <BorderGlow glowColor="210 80 80">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Issue New Prescription</h3>
            <form onSubmit={handleIssuePrescription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Appointment / Patient</label>
                  <select
                    value={form.appointment_id}
                    onChange={(event) => setForm((previous) => ({ ...previous, appointment_id: event.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="" className="bg-gray-900">Select appointment</option>
                    {appointmentOptions.map((appointment) => (
                      <option key={appointment.id} value={appointment.id} className="bg-gray-900">
                        {(appointment.patient_name || appointment.patient_email || appointment.patient_id)} - {formatDateTime(appointment.scheduled_at)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Valid Days</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={form.valid_days}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, valid_days: Number(event.target.value || 30) }))
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {selectedAppointment && (
                <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-sm text-blue-200">
                  Issuing to: {selectedAppointment.patient_name || selectedAppointment.patient_email || selectedAppointment.patient_id}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-300">Prescription Doc/Image (stored in Cloudinary)</label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, prescription_file: event.target.files?.[0] || null }))
                  }
                  className="bg-white/10 border-white/20 text-white file:bg-blue-500/20 file:text-white file:border-0"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes for patient"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-400/30 text-sm text-green-200">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white">
                <Upload className="h-4 w-4 mr-2" />
                {submitting ? 'Issuing...' : 'Issue Prescription'}
              </Button>
            </form>
          </div>
        </BorderGlow>
      </motion.div>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((prescription, index) => (
              <motion.div key={prescription.id} variants={itemVariants}>
                <BorderGlow glowColor={`${200 + (index * 20)} 60 40`}>
                  <div className="p-6">
                    <div className={`flex gap-6 ${prescription.prescription_file_url ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                      {prescription.prescription_file_url && (
                        <div className="w-full lg:w-[360px] lg:shrink-0 space-y-3">
                          {isImageFile(prescription.prescription_file_url) && (
                            <button
                              type="button"
                              onClick={() => openFilePreview(prescription.prescription_file_url)}
                              className="block w-full"
                            >
                              <img
                                src={prescription.prescription_file_url}
                                alt="Prescription thumbnail"
                                className="h-52 w-full rounded-lg border border-white/20 object-cover cursor-zoom-in hover:border-blue-400/50 transition"
                                loading="lazy"
                              />
                            </button>
                          )}

                          {isPdfFile(prescription.prescription_file_url) && (
                            <button
                              type="button"
                              onClick={() => openFilePreview(prescription.prescription_file_url)}
                              className="block w-full"
                            >
                              <object
                                data={`${prescription.prescription_file_url}#page=1&view=FitH`}
                                type="application/pdf"
                                className="h-52 w-full rounded-lg border border-white/20 bg-white/5 pointer-events-none cursor-zoom-in hover:border-blue-400/50 transition"
                              >
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                  PDF preview unavailable
                                </div>
                              </object>
                            </button>
                          )}

                          {!isImageFile(prescription.prescription_file_url) && !isPdfFile(prescription.prescription_file_url) && (
                            <button
                              type="button"
                              onClick={() => openFilePreview(prescription.prescription_file_url)}
                              className="flex h-52 w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 text-sm text-gray-400 hover:border-blue-400/50 transition"
                            >
                              File preview unavailable
                            </button>
                          )}

                          <Button variant="outline" size="sm" asChild className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                            <a href={prescription.prescription_file_url} target="_blank" rel="noopener noreferrer">
                              View Uploaded Prescription File
                            </a>
                          </Button>
                        </div>
                      )}

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-300">Issued: {formatDateTime(prescription.issued_at)}</p>
                            <p className="text-sm text-gray-300">Patient: {prescription.patient_name || prescription.patient_id}</p>
                            {prescription.appointment_id && (
                              <p className="text-sm text-gray-300">Appointment: {prescription.appointment_id}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </div>

                        {prescription.medicines?.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-medium text-white">Medicines</p>
                            {prescription.medicines.map((medicine, medIndex) => (
                              <div key={medIndex} className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <Pill className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium text-white">{medicine.name}</p>
                                  <p className="text-sm text-gray-300">
                                    {medicine.dosage} - {medicine.frequency} for {medicine.duration}
                                  </p>
                                  {medicine.instructions && (
                                    <p className="text-sm text-gray-400 mt-1">{medicine.instructions}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {prescription.notes && (
                          <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                            <p className="text-sm text-gray-200">{prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </BorderGlow>
              </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants}>
              <BorderGlow glowColor="200 60 40">
                <div className="py-16 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">No prescriptions issued yet</p>
                </div>
              </BorderGlow>
            </motion.div>
          )}
        </div>
      </motion.div>

      {previewFileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeFilePreview}
        >
          <div
            className="relative w-full max-w-5xl rounded-xl bg-gray-900 border border-white/20 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Prescription Preview</h3>
              <Button variant="outline" size="sm" onClick={closeFilePreview} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>

            {previewFileType === 'pdf' ? (
              <object
                data={`${previewFileUrl}#page=1&view=FitH`}
                type="application/pdf"
                className="h-[80vh] w-full rounded-lg border border-white/20 bg-white"
              >
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  PDF preview unavailable in modal.
                </div>
              </object>
            ) : (
              <img
                src={previewFileUrl}
                alt="Prescription preview"
                className="max-h-[80vh] w-full rounded-lg object-contain border border-white/20"
              />
            )}
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
