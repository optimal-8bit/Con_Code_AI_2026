import { Input } from "@/components/ui/input";
import UploadBox from "@/components/UploadBox";

export default function ReportUpload({
  file,
  question,
  onQuestionChange,
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
      <p className="text-muted-foreground">AI explanation</p>
      <div className="space-y-2 text-foreground/90">
        <div>
          <p className="mb-1 text-muted-foreground">Abnormal values</p>
          <ul className="list-disc space-y-1 pl-5">
            {(result.abnormal_values || []).map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">Summary</p>
          <p>{result.explanation}</p>
        </div>
        <div>
          <p className="mb-1 text-muted-foreground">Recommended action</p>
          <p>{result.recommended_action}</p>
        </div>
      </div>
    </div>
  ) : null;

  const historyContent = (
    <div className="space-y-3 text-sm">
      {history.length === 0 ? (
        <p className="text-muted-foreground">No report history available.</p>
      ) : (
        history.map((item, index) => {
          const summary = item.summary || {};
          return (
            <details key={`${item.created_at || "created"}-${index}`} className="rounded-lg border border-white/15 bg-background/30 p-3">
              <summary className="cursor-pointer list-none text-foreground/90">
                {(item.file_metadata?.filename || "Report").toString()} - {(summary.abnormal_values || []).length} abnormal value(s)
              </summary>
              <div className="mt-3 space-y-2 text-foreground/90">
                <p>{summary.explanation || "No explanation available."}</p>
                <p className="text-muted-foreground">
                  Action: {summary.recommended_action || "Not available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : "Stored recently"}
                </p>
              </div>
            </details>
          );
        })
      )}
    </div>
  );

  return (
    <UploadBox
      title="Report Upload"
      description="Upload diagnostic PDF reports for plain-language interpretation."
      accept="application/pdf"
      file={file}
      onFileChange={onFileChange}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
      submitLabel="Explain Report"
      currentContent={currentContent}
      historyContent={historyContent}
      onHistoryOpen={onHistoryOpen}
      preUploadContent={
        <Input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Optional question (e.g., Is this urgent?)"
          className="glass-input border-white/20"
        />
      }
    />
  );
}
