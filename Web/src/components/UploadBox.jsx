import { useEffect, useState } from "react";

import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function UploadBox({
  title,
  description,
  accept,
  file,
  onFileChange,
  onSubmit,
  loading,
  error,
  submitLabel,
  currentContent,
  historyContent,
  onHistoryOpen,
  preUploadContent,
  className,
}) {
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    if (activeTab === "history" && onHistoryOpen) {
      onHistoryOpen();
    }
  }, [activeTab, onHistoryOpen]);

  return (
    <GlassCard
      title={title}
      description={description}
      className={cn("transition-all duration-300", className)}
      contentClassName="space-y-4"
      action={
        <div className="inline-flex rounded-lg border border-white/15 bg-background/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={cn(
              "rounded-md px-3 py-1.5 transition",
              activeTab === "current" ? "bg-white/10 text-foreground" : "text-muted-foreground",
            )}
          >
            Current
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "rounded-md px-3 py-1.5 transition",
              activeTab === "history" ? "bg-white/10 text-foreground" : "text-muted-foreground",
            )}
          >
            History
          </button>
        </div>
      }
    >
      {activeTab === "current" ? (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {preUploadContent}
          <Input
            type="file"
            accept={accept}
            className="glass-input border-white/20 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {file ? `Selected: ${file.name}` : "No file selected"}
            </p>
            <GlassButton disabled={!file || loading} onClick={onSubmit}>
              {loading ? "Processing..." : submitLabel}
            </GlassButton>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {currentContent}
        </div>
      ) : (
        <div className="animate-in fade-in-50 duration-200">{historyContent}</div>
      )}
    </GlassCard>
  );
}
