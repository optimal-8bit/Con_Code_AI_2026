import { useEffect, useMemo, useRef, useState } from "react";

import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";

function roleClasses(role) {
  return role === "user"
    ? "ml-auto border-primary/35 bg-primary/20 text-primary-foreground"
    : "mr-auto border-white/20 bg-background/50 text-foreground";
}

function historyPreview(record) {
  const userMessage = record.message || "No message";
  const assistantMessage = record.response?.response || "No reply";
  return { userMessage, assistantMessage };
}

export default function ChatUI({
  messages,
  value,
  onChange,
  onSend,
  loading,
  error,
  history,
  onHistoryOpen,
}) {
  const [activeTab, setActiveTab] = useState("current");
  const scrollRef = useRef(null);

  const canSend = useMemo(() => value.trim().length > 0 && !loading, [value, loading]);

  useEffect(() => {
    if (activeTab === "history" && onHistoryOpen) {
      onHistoryOpen();
    }
  }, [activeTab, onHistoryOpen]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  return (
    <GlassCard
      title="AI Chat Assistant"
      description="Ask follow-up questions with context from symptoms, reports, and history."
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
      className="h-full"
      contentClassName="space-y-4"
    >
      {activeTab === "current" ? (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div ref={scrollRef} className="max-h-[360px] min-h-[240px] space-y-3 overflow-y-auto rounded-xl border border-white/15 bg-background/30 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet. Start a conversation with the AI assistant.</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                  className={cn("max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed", roleClasses(message.role))}
                >
                  {message.content}
                </div>
              ))
            )}
            {loading ? (
              <div className="mr-auto inline-flex rounded-2xl border border-white/20 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                AI is typing...
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              rows={2}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Ask about symptoms, reports, or medicine schedule..."
              className="glass-input min-h-[52px] flex-1 resize-none rounded-md border border-white/20 bg-background/40 p-3 text-sm"
            />
            <GlassButton className="sm:self-end" disabled={!canSend} onClick={onSend}>
              {loading ? "Sending..." : "Send"}
            </GlassButton>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chat history available.</p>
          ) : (
            history.map((record, index) => {
              const preview = historyPreview(record);
              return (
                <details key={`${record.created_at || "chat"}-${index}`} className="rounded-lg border border-white/15 bg-background/30 p-3">
                  <summary className="cursor-pointer list-none text-sm text-foreground/90">{preview.userMessage}</summary>
                  <div className="mt-3 rounded-lg border border-white/10 bg-background/40 p-3 text-sm text-foreground/90">
                    <p>{preview.assistantMessage}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {record.created_at ? new Date(record.created_at).toLocaleString() : "Stored recently"}
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
