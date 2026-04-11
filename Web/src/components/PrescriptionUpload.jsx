import UploadBox from "@/components/UploadBox";

export default function PrescriptionUpload({
  file,
  onFileChange,
  onSubmit,
  loading,
  error,
  result,
  history,
  onHistoryOpen,
}) {
  const currentContent = result ? (
    <div className="space-y-3 rounded-xl border border-white/15 bg-background/30 p-4 text-sm">
      <p className="text-muted-foreground">Extracted medicines</p>
      {(result.medicines || []).length === 0 ? (
        <p className="text-foreground/80">No medicine entries detected.</p>
      ) : (
        <div className="space-y-2">
          {result.medicines.map((medicine, index) => (
            <div key={`${medicine.medicine_name}-${index}`} className="rounded-lg border border-white/10 bg-background/40 p-3">
              <p className="font-medium text-foreground">{medicine.medicine_name}</p>
              <p className="text-muted-foreground">{medicine.dosage}</p>
              <p className="text-foreground/80">{medicine.frequency}</p>
              <p className="text-foreground/80">{medicine.instructions}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const historyContent = (
    <div className="space-y-3 text-sm">
      {history.length === 0 ? (
        <p className="text-muted-foreground">No prescription history available.</p>
      ) : (
        history.map((item, index) => (
          <details key={`${item.created_at || "created"}-${index}`} className="rounded-lg border border-white/15 bg-background/30 p-3">
            <summary className="cursor-pointer list-none text-foreground/90">
              {(item.file_metadata?.filename || "Prescription").toString()} - {(item.medicines || []).length} medicine(s)
            </summary>
            <div className="mt-3 space-y-2">
              {(item.medicines || []).map((medicine, medicineIndex) => (
                <div key={`${medicine.medicine_name}-${medicineIndex}`} className="rounded-lg border border-white/10 bg-background/40 p-2.5">
                  <p className="font-medium">{medicine.medicine_name}</p>
                  <p className="text-muted-foreground">{medicine.dosage}</p>
                  <p>{medicine.frequency}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {item.created_at ? new Date(item.created_at).toLocaleString() : "Stored recently"}
              </p>
            </div>
          </details>
        ))
      )}
    </div>
  );

  return (
    <UploadBox
      title="Prescription Upload"
      description="Upload handwritten or printed prescription image for extraction."
      accept="image/*"
      file={file}
      onFileChange={onFileChange}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
      submitLabel="Analyze Prescription"
      currentContent={currentContent}
      historyContent={historyContent}
      onHistoryOpen={onHistoryOpen}
    />
  );
}
