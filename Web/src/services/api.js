const PATIENT_ID_STORAGE_KEY = "healthcare_dashboard_patient_id";
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
const DEFAULT_RETRIES = Number(import.meta.env.VITE_API_RETRIES || 2);

function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new Error("Missing VITE_API_URL. Add it to your environment.");
  }
  return baseUrl.replace(/\/$/, "");
}

function createPatientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `patient-${crypto.randomUUID()}`;
  }
  return `patient-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreatePatientId() {
  if (typeof window === "undefined") {
    return "patient-local";
  }

  const existing = window.localStorage.getItem(PATIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = createPatientId();
  window.localStorage.setItem(PATIENT_ID_STORAGE_KEY, generated);
  return generated;
}

function withQuery(path, queryParams) {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  if (!queryParams) {
    return url.toString();
  }

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponse(response) {
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error("Invalid API response");
  }

  if (payload.status && payload.status !== "success") {
    throw new Error(payload.message || "API request failed");
  }

  return payload.data ?? {};
}

function shouldRetryResponse(response) {
  return (
    response.status === 408 || response.status === 429 || response.status >= 500
  );
}

function shouldRetryError(error) {
  if (!error) {
    return false;
  }
  const message = String(error.message || "").toLowerCase();
  return (
    error.name === "AbortError" ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("load failed")
  );
}

function backoffDelayMs(attempt) {
  return Math.min(500 * 2 ** attempt, 4000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest(
  path,
  {
    method = "GET",
    body,
    queryParams,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = {},
) {
  const headers = {};
  let requestBody = body;

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const url = withQuery(path, queryParams);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method,
          headers,
          body: requestBody,
        },
        timeoutMs,
      );

      if (shouldRetryResponse(response) && attempt < retries) {
        await sleep(backoffDelayMs(attempt));
        continue;
      }

      return parseResponse(response);
    } catch (error) {
      if (shouldRetryError(error) && attempt < retries) {
        await sleep(backoffDelayMs(attempt));
        continue;
      }

      if (error?.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
  }

  throw new Error("Request failed after retries.");
}

function toArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.history)) {
    return payload.history;
  }
  return [];
}

export async function postSymptomCheck({ patientId, text }) {
  return apiRequest("/api/symptom-check", {
    method: "POST",
    body: {
      patient_id: patientId,
      text,
    },
  });
}

export async function postPrescriptionAnalyze({ patientId, file }) {
  const formData = new FormData();
  formData.append("patient_id", patientId);
  formData.append("file", file);

  return apiRequest("/api/prescription-analyze", {
    method: "POST",
    body: formData,
  });
}

export async function postReportExplain({ patientId, file, question }) {
  const formData = new FormData();
  formData.append("patient_id", patientId);
  formData.append("file", file);
  if (question?.trim()) {
    formData.append("question", question.trim());
  }

  return apiRequest("/api/report-explain", {
    method: "POST",
    body: formData,
  });
}

export async function postChat({
  patientId,
  message,
  history = [],
  contexts = {},
  ragContext,
  useWorkflow = false,
  symptomText,
  reportResult,
}) {
  return apiRequest("/api/chat", {
    method: "POST",
    body: {
      patient_id: patientId,
      message,
      history,
      contexts,
      rag_context: ragContext,
      use_workflow: useWorkflow,
      symptom_text: symptomText,
      report_result: reportResult,
    },
  });
}

export async function postGenerateReminder({
  patientId,
  medicines,
  timezone = "UTC",
}) {
  return apiRequest("/api/generate-reminder", {
    method: "POST",
    body: {
      patient_id: patientId,
      medicines,
      timezone,
    },
  });
}

export async function getReportHistory(patientId) {
  const payload = await apiRequest("/api/history/reports", {
    method: "GET",
    queryParams: { patient_id: patientId },
  });
  return toArray(payload);
}

export async function getPrescriptionHistory(patientId) {
  const payload = await apiRequest("/api/history/prescriptions", {
    method: "GET",
    queryParams: { patient_id: patientId },
  });
  return toArray(payload);
}

export async function getChatHistory(patientId) {
  const payload = await apiRequest("/api/history/chat", {
    method: "GET",
    queryParams: { patient_id: patientId },
  });
  return toArray(payload);
}

export async function getReminderHistory(patientId) {
  const payload = await apiRequest("/api/history/reminders", {
    method: "GET",
    queryParams: { patient_id: patientId },
  });
  return toArray(payload);
}
