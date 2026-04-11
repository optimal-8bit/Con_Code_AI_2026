import { useEffect, useState } from "react";

import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";

function severityClassName(severity) {
  if (severity === "high") {
    return "bg-destructive/25 text-red-200 border-red-300/30";
  }
  if (severity === "medium") {
    return "bg-amber-400/20 text-amber-100 border-amber-300/30";
  }
  return "bg-emerald-400/20 text-emerald-100 border-emerald-300/30";
}

export default function SymptomInput({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  result,
  history,
  onHistoryOpen,
}) {
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    if (activeTab === "history" && onHistoryOpen) {
      onHistoryOpen();
    }
  }, [activeTab, onHistoryOpen]);

  return (
    <GlassCard
      title="Symptom Checker"
      description="Describe symptoms in detail for AI-assisted triage guidance."
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
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            className="glass-input w-full resize-none rounded-md border border-white/20 bg-background/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Example: Fever for 2 days, dry cough at night, mild body ache..."
          />
          <div className="flex items-center justify-end">
            <GlassButton disabled={!value.trim() || loading} onClick={onSubmit}>
              {loading ? "Analyzing..." : "Check Symptoms"}
            </GlassButton>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {result ? (
            <div className="rounded-xl border border-white/15 bg-background/30 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">Severity</p>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs capitalize", severityClassName(result.severity))}>
                  {result.severity || "unknown"}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-muted-foreground">Possible conditions</p>
                  <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                    {(result.possible_conditions || []).map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground">Recommended action</p>
                  <p className="text-foreground/90">{result.recommended_action}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No symptom history yet.</p>
          ) : (
            history.map((item, index) => {
              const severity = item?.result?.severity || "low";
              return (
                <details key={`${item.created_at || "now"}-${index}`} className="rounded-lg border border-white/15 bg-background/30 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
                    <span className="line-clamp-1 text-foreground/90">{item.user_input}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs capitalize", severityClassName(severity))}>
                      {severity}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-foreground/90">
                    <p>
                      <span className="text-muted-foreground">Recommended:</span>{" "}
                      {item?.result?.recommended_action || "No recommendation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                    </p>
                  </div>
                </details>
              );
            })
          )}
        </div>
      )}
    </GlassCard>
  );
}
