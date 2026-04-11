import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bot, CalendarClock, FileText, Pill, Sparkles } from "lucide-react";

import ChatUI from "@/components/ChatUI";
import GlassButton from "@/components/GlassButton";
import GlassCard from "@/components/GlassCard";
import PrescriptionUpload from "@/components/PrescriptionUpload";
import ReminderCard from "@/components/ReminderCard";
import ReportUpload from "@/components/ReportUpload";
import SymptomInput from "@/components/SymptomInput";
import {
  getChatHistory,
  getOrCreatePatientId,
  getPrescriptionHistory,
  getReminderHistory,
  getReportHistory,
  postChat,
  postGenerateReminder,
  postPrescriptionAnalyze,
  postReportExplain,
  postSymptomCheck,
} from "@/services/api";

function toChatMessages(records) {
  const entries = [];
  const ordered = [...records].reverse();

  ordered.forEach((record) => {
    if (record.message) {
      entries.push({ role: "user", content: record.message });
    }
    const assistantMessage = record.response?.response;
    if (assistantMessage) {
      entries.push({ role: "assistant", content: assistantMessage });
    }
  });

  return entries;
}

export default function PatientDashboard() {
  const hasHydratedChatRef = useRef(false);
  const [patientId, setPatientId] = useState("");

  const [symptomInput, setSymptomInput] = useState("");
  const [symptomResult, setSymptomResult] = useState(null);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [symptomError, setSymptomError] = useState("");

  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionResult, setPrescriptionResult] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  const [reportFile, setReportFile] = useState(null);
  const [reportQuestion, setReportQuestion] = useState("");
  const [reportResult, setReportResult] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const [reminderForm, setReminderForm] = useState({
    medicineName: "",
    dosage: "",
    timings: "09:00, 21:00",
    instructions: "",
    timezone: "UTC",
  });
  const [reminderResult, setReminderResult] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState("");

  const [historyData, setHistoryData] = useState({
    reports: [],
    prescriptions: [],
    chat: [],
    reminders: [],
  });

  const [historyLoaded, setHistoryLoaded] = useState({
    reports: false,
    prescriptions: false,
    chat: false,
    reminders: false,
  });

  const [historyLoading, setHistoryLoading] = useState({
    reports: false,
    prescriptions: false,
    chat: false,
    reminders: false,
  });

  const [historyErrors, setHistoryErrors] = useState({
    reports: "",
    prescriptions: "",
    chat: "",
    reminders: "",
  });

  useEffect(() => {
    setPatientId(getOrCreatePatientId());
  }, []);

  const loadHistory = useCallback(
    async (key, force = false) => {
      if (!patientId) {
        return;
      }
      if (historyLoaded[key] && !force) {
        return;
      }

      setHistoryLoading((previous) => ({ ...previous, [key]: true }));
      setHistoryErrors((previous) => ({ ...previous, [key]: "" }));

      try {
        let records = [];

        if (key === "reports") {
          records = await getReportHistory(patientId);
        }
        if (key === "prescriptions") {
          records = await getPrescriptionHistory(patientId);
        }
        if (key === "chat") {
          records = await getChatHistory(patientId);
        }
        if (key === "reminders") {
          records = await getReminderHistory(patientId);
        }

        setHistoryData((previous) => ({ ...previous, [key]: records }));
        setHistoryLoaded((previous) => ({ ...previous, [key]: true }));
      } catch (error) {
        setHistoryErrors((previous) => ({
          ...previous,
          [key]: error instanceof Error ? error.message : "Failed to load history",
        }));
      } finally {
        setHistoryLoading((previous) => ({ ...previous, [key]: false }));
      }
    },
    [historyLoaded, patientId],
  );

  useEffect(() => {
    if (!patientId || historyLoaded.chat) {
      return;
    }

    loadHistory("chat", true);
  }, [historyLoaded.chat, loadHistory, patientId]);

  useEffect(() => {
    if (!historyLoaded.chat || hasHydratedChatRef.current) {
      return;
    }
    setChatMessages(toChatMessages(historyData.chat));
    hasHydratedChatRef.current = true;
  }, [historyData.chat, historyLoaded.chat]);

  const reminderPreview = useMemo(() => {
    if (!reminderResult?.schedule) {
      return [];
    }
    return reminderResult.schedule;
  }, [reminderResult]);

  async function handleSymptomSubmit() {
    if (!symptomInput.trim() || !patientId) {
      return;
    }

    setSymptomError("");
    setSymptomLoading(true);

    try {
      const result = await postSymptomCheck({
        patientId,
        text: symptomInput.trim(),
      });

      setSymptomResult(result);
      setSymptomHistory((previous) => [
        {
          user_input: symptomInput.trim(),
          result,
          created_at: new Date().toISOString(),
        },
        ...previous,
      ]);
    } catch (error) {
      setSymptomError(error instanceof Error ? error.message : "Failed to analyze symptoms");
    } finally {
      setSymptomLoading(false);
    }
  }

  async function handlePrescriptionSubmit() {
    if (!prescriptionFile || !patientId) {
      return;
    }

    setPrescriptionError("");
    setPrescriptionLoading(true);

    try {
      const result = await postPrescriptionAnalyze({
        patientId,
        file: prescriptionFile,
      });

      setPrescriptionResult(result);
      const createdRecord = {
        medicines: result.medicines || [],
        notes: result.notes,
        extracted_text: result.extracted_text,
        created_at: new Date().toISOString(),
        file_metadata: {
          filename: prescriptionFile.name,
          content_type: prescriptionFile.type,
          size_bytes: prescriptionFile.size,
        },
      };

      setHistoryData((previous) => ({
        ...previous,
        prescriptions: [createdRecord, ...previous.prescriptions],
      }));
      setHistoryLoaded((previous) => ({ ...previous, prescriptions: true }));
      setPrescriptionFile(null);
    } catch (error) {
      setPrescriptionError(error instanceof Error ? error.message : "Failed to analyze prescription");
    } finally {
      setPrescriptionLoading(false);
    }
  }

  async function handleReportSubmit() {
    if (!reportFile || !patientId) {
      return;
    }

    setReportError("");
    setReportLoading(true);

    try {
      const result = await postReportExplain({
        patientId,
        file: reportFile,
        question: reportQuestion,
      });

      setReportResult(result);
      const createdRecord = {
        summary: result,
        question: reportQuestion,
        created_at: new Date().toISOString(),
        file_metadata: {
          filename: reportFile.name,
          content_type: reportFile.type,
          size_bytes: reportFile.size,
        },
      };

      setHistoryData((previous) => ({
        ...previous,
        reports: [createdRecord, ...previous.reports],
      }));
      setHistoryLoaded((previous) => ({ ...previous, reports: true }));
      setReportFile(null);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Failed to explain report");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !patientId) {
      return;
    }

    const message = chatInput.trim();
    const nextMessages = [...chatMessages, { role: "user", content: message }];

    setChatError("");
    setChatInput("");
    setChatMessages(nextMessages);
    setChatLoading(true);

    try {
      const result = await postChat({
        patientId,
        message,
        history: nextMessages.slice(-14).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        contexts: {
          latest_symptom: symptomResult,
          latest_report: reportResult,
        },
      });

      const assistantText =
        result.response ||
        result.chat_result?.response ||
        "I could not generate a response right now.";

      const suggestions = Array.isArray(result.suggested_next_steps)
        ? result.suggested_next_steps
        : [];

      const formattedAssistantText =
        suggestions.length > 0
          ? `${assistantText}\n\nNext steps:\n${suggestions.map((step) => `- ${step}`).join("\n")}`
          : assistantText;

      const assistantMessage = {
        role: "assistant",
        content: formattedAssistantText,
      };

      setChatMessages((previous) => [...previous, assistantMessage]);

      const historyRecord = {
        message,
        response: { response: assistantText },
        created_at: new Date().toISOString(),
      };

      setHistoryData((previous) => ({
        ...previous,
        chat: [historyRecord, ...previous.chat],
      }));
      setHistoryLoaded((previous) => ({ ...previous, chat: true }));
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Failed to send chat message");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleGenerateReminder() {
    if (!patientId || !reminderForm.medicineName.trim()) {
      return;
    }

    setReminderError("");
    setReminderLoading(true);

    try {
      const timings = reminderForm.timings
        .split(",")
        .map((time) => time.trim())
        .filter(Boolean);

      const result = await postGenerateReminder({
        patientId,
        timezone: reminderForm.timezone || "UTC",
        medicines: [
          {
            medicine_name: reminderForm.medicineName.trim(),
            dosage: reminderForm.dosage.trim(),
            timings,
            instructions: reminderForm.instructions.trim(),
          },
        ],
      });

      setReminderResult(result);

      const historyRecord = {
        timezone: reminderForm.timezone || "UTC",
        schedule: result,
        created_at: new Date().toISOString(),
      };

      setHistoryData((previous) => ({
        ...previous,
        reminders: [historyRecord, ...previous.reminders],
      }));
      setHistoryLoaded((previous) => ({ ...previous, reminders: true }));
    } catch (error) {
      setReminderError(error instanceof Error ? error.message : "Failed to generate reminders");
    } finally {
      setReminderLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="glass-nav rounded-2xl border border-white/10 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Patient Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AI-assisted healthcare workspace powered by Gemini and persistent patient context.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              <span className="max-w-[280px] truncate">{patientId || "Initializing patient session..."}</span>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="size-4" />
            Symptom Intelligence
          </div>
          <SymptomInput
            value={symptomInput}
            onChange={setSymptomInput}
            onSubmit={handleSymptomSubmit}
            loading={symptomLoading}
            error={symptomError}
            result={symptomResult}
            history={symptomHistory}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="size-4" />
              Prescription Intelligence
            </div>
            <PrescriptionUpload
              file={prescriptionFile}
              onFileChange={setPrescriptionFile}
              onSubmit={handlePrescriptionSubmit}
              loading={prescriptionLoading}
              error={prescriptionError || historyErrors.prescriptions}
              result={prescriptionResult}
              history={historyData.prescriptions}
              onHistoryOpen={() => loadHistory("prescriptions")}
            />
            {historyLoading.prescriptions ? (
              <p className="text-xs text-muted-foreground">Loading prescription history...</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" />
              Report Intelligence
            </div>
            <ReportUpload
              file={reportFile}
              question={reportQuestion}
              onQuestionChange={setReportQuestion}
              onFileChange={setReportFile}
              onSubmit={handleReportSubmit}
              loading={reportLoading}
              error={reportError || historyErrors.reports}
              result={reportResult}
              history={historyData.reports}
              onHistoryOpen={() => loadHistory("reports")}
            />
            {historyLoading.reports ? (
              <p className="text-xs text-muted-foreground">Loading report history...</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="size-4" />
            Conversational Assistant
          </div>
          <ChatUI
            messages={chatMessages}
            value={chatInput}
            onChange={setChatInput}
            onSend={handleSendChat}
            loading={chatLoading}
            error={chatError || historyErrors.chat}
            history={historyData.chat}
            onHistoryOpen={() => loadHistory("chat")}
          />
          {historyLoading.chat ? <p className="text-xs text-muted-foreground">Loading chat history...</p> : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" />
            Medication Reminders
          </div>

          <GlassCard
            title="Reminder Planner"
            description="Create and view medicine schedules linked to this patient session."
            className="transition-all duration-300"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={reminderForm.medicineName}
                onChange={(event) =>
                  setReminderForm((previous) => ({ ...previous, medicineName: event.target.value }))
                }
                placeholder="Medicine name"
                className="glass-input rounded-md border border-white/20 bg-background/40 px-3 py-2 text-sm"
              />
              <input
                value={reminderForm.dosage}
                onChange={(event) =>
                  setReminderForm((previous) => ({ ...previous, dosage: event.target.value }))
                }
                placeholder="Dosage (e.g., 500mg)"
                className="glass-input rounded-md border border-white/20 bg-background/40 px-3 py-2 text-sm"
              />
              <input
                value={reminderForm.timings}
                onChange={(event) =>
                  setReminderForm((previous) => ({ ...previous, timings: event.target.value }))
                }
                placeholder="Timings comma-separated (e.g., 09:00, 21:00)"
                className="glass-input rounded-md border border-white/20 bg-background/40 px-3 py-2 text-sm"
              />
              <input
                value={reminderForm.timezone}
                onChange={(event) =>
                  setReminderForm((previous) => ({ ...previous, timezone: event.target.value }))
                }
                placeholder="Timezone (e.g., Asia/Kolkata)"
                className="glass-input rounded-md border border-white/20 bg-background/40 px-3 py-2 text-sm"
              />
            </div>

            <textarea
              rows={2}
              value={reminderForm.instructions}
              onChange={(event) =>
                setReminderForm((previous) => ({ ...previous, instructions: event.target.value }))
              }
              placeholder="Instructions"
              className="glass-input w-full resize-none rounded-md border border-white/20 bg-background/40 p-3 text-sm"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <GlassButton disabled={reminderLoading} onClick={handleGenerateReminder}>
                {reminderLoading ? "Generating..." : "Generate Reminder"}
              </GlassButton>
              <GlassButton
                variant="secondary"
                className="border-white/20 bg-white/10 text-foreground hover:bg-white/20"
                onClick={() => loadHistory("reminders")}
              >
                Load Reminder History
              </GlassButton>
            </div>

            {reminderError || historyErrors.reminders ? (
              <p className="text-sm text-destructive">{reminderError || historyErrors.reminders}</p>
            ) : null}
            {historyLoading.reminders ? (
              <p className="text-xs text-muted-foreground">Loading reminder history...</p>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Current schedule</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {reminderPreview.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Generate a reminder to see schedule cards.</p>
                ) : (
                  reminderPreview.map((reminder, index) => (
                    <ReminderCard
                      key={`${reminder.medicine_name}-${reminder.time}-${index}`}
                      reminder={reminder}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">History</p>
              {historyData.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved reminders found.</p>
              ) : (
                historyData.reminders.map((entry, index) => (
                  <details key={`${entry.created_at || "reminder"}-${index}`} className="rounded-lg border border-white/15 bg-background/30 p-3">
                    <summary className="cursor-pointer list-none text-sm text-foreground/90">
                      Reminder batch - {entry.schedule?.total_reminders || 0} reminders
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {(entry.schedule?.schedule || []).map((reminder, reminderIndex) => (
                        <ReminderCard
                          key={`${reminder.medicine_name}-${reminder.time}-${reminderIndex}`}
                          reminder={reminder}
                        />
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
