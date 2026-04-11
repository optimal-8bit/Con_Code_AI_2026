import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doctorService } from '@/services/doctor.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { AlertCircle, FileText, Pill, Upload } from 'lucide-react';

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
        <h2 className="text-2xl font-bold text-gray-900">Issued Prescriptions</h2>

        <Card>
          <CardHeader>
            <CardTitle>Issue New Prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssuePrescription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Appointment / Patient</label>
                  <select
                    value={form.appointment_id}
                    onChange={(event) => setForm((previous) => ({ ...previous, appointment_id: event.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select appointment</option>
                    {appointmentOptions.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {(appointment.patient_name || appointment.patient_email || appointment.patient_id)} - {formatDateTime(appointment.scheduled_at)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Valid Days</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={form.valid_days}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, valid_days: Number(event.target.value || 30) }))
                    }
                  />
                </div>
              </div>

              {selectedAppointment && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                  Issuing to: {selectedAppointment.patient_name || selectedAppointment.patient_email || selectedAppointment.patient_id}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Prescription Doc/Image (stored in Cloudinary)</label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, prescription_file: event.target.files?.[0] || null }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Additional notes for patient"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={submitting}>
                <Upload className="h-4 w-4 mr-2" />
                {submitting ? 'Issuing...' : 'Issue Prescription'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardContent className="pt-6">
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
                              className="h-52 w-full rounded-lg border border-gray-200 object-cover cursor-zoom-in"
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
                              className="h-52 w-full rounded-lg border border-gray-200 bg-white pointer-events-none cursor-zoom-in"
                            >
                              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                PDF preview unavailable
                              </div>
                            </object>
                          </button>
                        )}

                        {!isImageFile(prescription.prescription_file_url) && !isPdfFile(prescription.prescription_file_url) && (
                          <button
                            type="button"
                            onClick={() => openFilePreview(prescription.prescription_file_url)}
                            className="flex h-52 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600"
                          >
                            File preview unavailable
                          </button>
                        )}

                        <Button variant="outline" size="sm" asChild>
                          <a href={prescription.prescription_file_url} target="_blank" rel="noopener noreferrer">
                            View Uploaded Prescription File
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Issued: {formatDateTime(prescription.issued_at)}</p>
                          <p className="text-sm text-gray-600">Patient: {prescription.patient_name || prescription.patient_id}</p>
                          {prescription.appointment_id && (
                            <p className="text-sm text-gray-600">Appointment: {prescription.appointment_id}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                      </div>

                      {prescription.medicines?.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">Medicines</p>
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                              <Pill className="h-5 w-5 text-purple-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{medicine.name}</p>
                                <p className="text-sm text-gray-600">
                                  {medicine.dosage} - {medicine.frequency} for {medicine.duration}
                                </p>
                                {medicine.instructions && (
                                  <p className="text-sm text-gray-500 mt-1">{medicine.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {prescription.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No prescriptions issued yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {previewFileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeFilePreview}
        >
          <div
            className="relative w-full max-w-5xl rounded-xl bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={closeFilePreview}>
                Close Preview
              </Button>
            </div>

            {previewFileType === 'pdf' ? (
              <object
                data={`${previewFileUrl}#page=1&view=FitH`}
                type="application/pdf"
                className="h-[80vh] w-full rounded-lg border border-gray-200"
              >
                <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                  PDF preview unavailable in modal.
                </div>
              </object>
            ) : (
              <img
                src={previewFileUrl}
                alt="Prescription preview"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
