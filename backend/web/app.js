const el = (id) => document.getElementById(id);

function apiBase() {
  return (el("apiBase").value || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function postJson(path, payload) {
  const response = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function getJson(path) {
  const response = await fetch(`${apiBase()}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json();
}

function out(id, data) {
  el(id).textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      const panel = document.getElementById(button.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });
}

async function createStakeholder() {
  out("stakeholderOut", "Creating stakeholder...");
  try {
    const data = await postJson("/api/v1/stakeholders", {
      name: el("stName").value,
      role: el("stRole").value,
      email: el("stEmail").value || null,
      profile: {},
    });
    out("stakeholderOut", data);

    if (data.role === "patient") el("symPatientId").value = data.id;
    if (data.role === "doctor") {
      el("symDoctorId").value = data.id;
      el("rxDoctorId").value = data.id;
      el("repDoctorId").value = data.id;
      el("chatDoctorId").value = data.id;
    }
    if (data.role === "pharmacy") {
      el("symPharmacyId").value = data.id;
      el("rxPharmacyId").value = data.id;
      el("chatPharmacyId").value = data.id;
    }

    el("dashStakeholderId").value = data.id;
    el("dashRole").value = data.role;
  } catch (error) {
    out("stakeholderOut", `Error: ${error.message}`);
  }
}

async function runSymptom() {
  out("aiOut", "Running symptom checker...");
  try {
    const data = await postJson("/api/v1/agents/symptom-checker", {
      patient_id: el("symPatientId").value || null,
      doctor_id: el("symDoctorId").value || null,
      pharmacy_id: el("symPharmacyId").value || null,
      symptom_text: el("symptomText").value,
      voice_transcript: el("voiceText").value,
      image_description: el("imageDesc").value,
      patient_age: 30,
      patient_gender: "unknown",
      known_conditions: [],
    });
    out("aiOut", data);
  } catch (error) {
    out("aiOut", `Error: ${error.message}`);
  }
}

async function runPrescription() {
  out("aiOut", "Running prescription analyzer...");
  try {
    const data = await postJson("/api/v1/agents/prescription-analyzer", {
      patient_id: el("rxPatientId").value || null,
      doctor_id: el("rxDoctorId").value || null,
      pharmacy_id: el("rxPharmacyId").value || null,
      prescription_text: el("rxText").value,
      image_description: el("rxImage").value,
    });
    out("aiOut", data);
  } catch (error) {
    out("aiOut", `Error: ${error.message}`);
  }
}

async function runReport() {
  out("aiOut", "Running report explainer...");
  try {
    const data = await postJson("/api/v1/agents/report-explainer", {
      patient_id: el("repPatientId").value || null,
      doctor_id: el("repDoctorId").value || null,
      report_text: el("reportText").value,
      patient_age: 30,
      patient_gender: "unknown",
      question: el("reportQuestion").value,
    });
    out("aiOut", data);
  } catch (error) {
    out("aiOut", `Error: ${error.message}`);
  }
}

async function runChat() {
  out("aiOut", "Asking smart assistant...");
  try {
    const data = await postJson("/api/v1/agents/smart-chat", {
      patient_id: el("chatPatientId").value || null,
      doctor_id: el("chatDoctorId").value || null,
      pharmacy_id: el("chatPharmacyId").value || null,
      question: el("chatQuestion").value,
      report_context: el("chatContext").value,
      chat_history: [],
    });
    out("aiOut", data);
  } catch (error) {
    out("aiOut", `Error: ${error.message}`);
  }
}

async function loadDashboard() {
  out("dashboardOut", "Loading dashboard snapshot...");
  const role = el("dashRole").value;
  const stakeholderId = el("dashStakeholderId").value;

  if (!stakeholderId) {
    out("dashboardOut", "Please enter stakeholder ID.");
    return;
  }

  try {
    const data = await getJson(`/api/v1/dashboards/${role}/${stakeholderId}`);
    out("dashboardOut", data);
  } catch (error) {
    out("dashboardOut", `Error: ${error.message}`);
  }
}

function bindEvents() {
  el("createStakeholder").addEventListener("click", createStakeholder);
  el("runSymptom").addEventListener("click", runSymptom);
  el("runPrescription").addEventListener("click", runPrescription);
  el("runReport").addEventListener("click", runReport);
  el("runChat").addEventListener("click", runChat);
  el("loadDashboard").addEventListener("click", loadDashboard);
}

initTabs();
bindEvents();
