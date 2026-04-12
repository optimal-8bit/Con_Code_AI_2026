import { useState, useEffect } from 'react';
import PatientLayout from '@/components/layout/PatientLayout';
import BorderGlow from '@/components/ui/BorderGlow';
import { Button } from '@/components/ui/button';
import { patientService } from '@/services/patient.service';
import { formatDateTime, getStatusColor, handleApiError } from '@/lib/utils';
import { FileText, Pill } from 'lucide-react';
import { motion } from 'framer-motion';
import Shuffle from '@/components/ui/Shuffle';

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
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <Shuffle text="LOADING" />
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">My Prescriptions</h2>

        <div className="grid gap-4">
          {prescriptions.length > 0 ? (
            prescriptions.map((rx, index) => (
              <motion.div
                key={rx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <BorderGlow
                  glowColor={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][index % 4]}
                  className="p-6"
                >
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
                              className="h-52 w-full rounded-lg border border-white/20 object-cover cursor-zoom-in bg-black/20"
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
                              className="h-52 w-full rounded-lg border border-white/20 bg-black/30 pointer-events-none cursor-zoom-in"
                            >
                              <div className="flex h-full items-center justify-center text-sm text-gray-300">
                                PDF preview unavailable
                              </div>
                            </object>
                          </button>
                        )}

                        {!isImageFile(rx.prescription_file_url) && !isPdfFile(rx.prescription_file_url) && (
                          <button
                            type="button"
                            onClick={() => openFilePreview(rx.prescription_file_url)}
                            className="flex h-52 w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 text-sm text-gray-300"
                          >
                            File preview unavailable
                          </button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <a href={rx.prescription_file_url} target="_blank" rel="noopener noreferrer">
                            View Uploaded Prescription File
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-300">Issued: {formatDateTime(rx.issued_at)}</p>
                          <p className="text-sm text-gray-300">Valid Until: {formatDateTime(rx.valid_until)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium text-white">Medicines:</p>
                        {rx.medicines && rx.medicines.map((med, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
                            <Pill className="h-5 w-5 text-purple-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-white">{med.name}</p>
                              <p className="text-sm text-gray-300">
                                {med.dosage} - {med.frequency} for {med.duration}
                              </p>
                              {med.instructions && (
                                <p className="text-sm text-gray-400 mt-1">{med.instructions}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {rx.notes && (
                        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                          <p className="text-sm text-blue-200">{rx.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </BorderGlow>
              </motion.div>
            ))
          ) : (
            <BorderGlow glowColor="#6366f1" className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No prescriptions yet</p>
            </BorderGlow>
          )}
        </div>
      </div>

      {previewFileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeFilePreview}
        >
          <div
            className="relative w-full max-w-5xl rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={closeFilePreview}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Close Preview
              </Button>
            </div>

            {previewFileType === 'pdf' ? (
              <object
                data={`${previewFileUrl}#page=1&view=FitH`}
                type="application/pdf"
                className="h-[80vh] w-full rounded-lg border border-white/20 bg-black/30"
              >
                <div className="flex h-64 items-center justify-center text-sm text-gray-300">
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
    </PatientLayout>
  );
}
