import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patient.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { FileText, Pill } from 'lucide-react';

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

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await patientService.getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-900">My Prescriptions</h2>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx) => (
              <Card key={rx.id}>
                <CardContent className="pt-6">
                  <div className={`flex gap-6 ${rx.prescription_file_url ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                    {rx.prescription_file_url && (
                      <div className="w-full lg:w-[360px] lg:shrink-0 space-y-3">
                        {isImageFile(rx.prescription_file_url) && (
                          <button
                            type="button"
                            onClick={() => openFilePreview(rx.prescription_file_url)}
                            className="block w-full"
                          >
                            <img
                              src={rx.prescription_file_url}
                              alt="Prescription thumbnail"
                              className="h-52 w-full rounded-lg border border-gray-200 object-cover cursor-zoom-in"
                              loading="lazy"
                            />
                          </button>
                        )}

                        {isPdfFile(rx.prescription_file_url) && (
                          <button
                            type="button"
                            onClick={() => openFilePreview(rx.prescription_file_url)}
                            className="block w-full"
                          >
                            <object
                              data={`${rx.prescription_file_url}#page=1&view=FitH`}
                              type="application/pdf"
                              className="h-52 w-full rounded-lg border border-gray-200 bg-white pointer-events-none cursor-zoom-in"
                            >
                              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                PDF preview unavailable
                              </div>
                            </object>
                          </button>
                        )}

                        {!isImageFile(rx.prescription_file_url) && !isPdfFile(rx.prescription_file_url) && (
                          <button
                            type="button"
                            onClick={() => openFilePreview(rx.prescription_file_url)}
                            className="flex h-52 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600"
                          >
                            File preview unavailable
                          </button>
                        )}

                        <Button variant="outline" size="sm" asChild>
                          <a href={rx.prescription_file_url} target="_blank" rel="noopener noreferrer">
                            View Uploaded Prescription File
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Issued: {formatDateTime(rx.issued_at)}</p>
                          <p className="text-sm text-gray-600">Valid Until: {formatDateTime(rx.valid_until)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">Medicines:</p>
                        {rx.medicines && rx.medicines.map((med, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <Pill className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{med.name}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {rx.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">{rx.notes}</p>
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
                <p className="text-gray-600">No prescriptions yet</p>
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
