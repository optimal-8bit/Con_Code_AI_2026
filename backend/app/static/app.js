/**
 * NextGen Health — Core Frontend Logic
 */

// ─── STATE & CONSTANTS ───────────────────────────────────────────────────────
let state = {
  user: null,
  token: localStorage.getItem('token'),
  activeView: 'dashboard',
  viewData: {},
  chatHistory: [],
  session_id: null
};

const API_BASE = '/api/v1';

// ─── UTILS ───────────────────────────────────────────────────────────────────
const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

const apiRequest = async (path, options = {}) => {
  const headers = { ...options.headers };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (response.status === 401 && state.token) {
    logout();
    throw new Error('Session expired');
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${text || 'Something went wrong'}`);
    }
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }
  return data;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const initAuth = () => {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    });
  });

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-inline">Signing in...</span>';
      
      try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        handleAuthSuccess(data);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span> <span class="btn-arrow">→</span>';
      }
    };
  }

  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      try {
        const payload = {
          name: document.getElementById('reg-name').value,
          email: document.getElementById('reg-email').value,
          password: document.getElementById('reg-password').value,
          role: document.getElementById('reg-role').value,
          phone: document.getElementById('reg-phone').value
        };
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        handleAuthSuccess(data);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    };
  }
};

const handleAuthSuccess = (data) => {
  state.token = data.access_token;
  state.user = data.user;
  localStorage.setItem('token', data.access_token);
  showToast(`Welcome back, ${data.user.name}!`, 'success');
  startApp();
};

const logout = () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
};

// ─── ROUTING & VIEW ENGINE ───────────────────────────────────────────────────
const startApp = async () => {
  try {
    if (!state.user) {
      state.user = await apiRequest('/auth/me');
    }
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('user-badge').textContent = state.user.role.toUpperCase();
    
    renderSidebar();
    navigateTo('dashboard');
  } catch (err) {
    logout();
  }
};

const navigateTo = (view) => {
  state.activeView = view;
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
  renderView(view);
};

const renderSidebar = () => {
  const nav = document.getElementById('sidebar-nav');
  const role = state.user.role;
  
  let menu = `
    <div class="nav-section-title">General</div>
    <button class="nav-item" data-view="dashboard" onclick="navigateTo('dashboard')">
      <span class="nav-icon">📊</span> Dashboard
    </button>
  `;

  if (role === 'patient') {
    menu += `
      <div class="nav-section-title">My Health</div>
      <button class="nav-item" data-view="appointments" onclick="navigateTo('appointments')">
        <span class="nav-icon">📅</span> Appointments
      </button>
      <button class="nav-item" data-view="medications" onclick="navigateTo('medications')">
        <span class="nav-icon">💊</span> Medications
      </button>
      <button class="nav-item" data-view="prescription-schedule" onclick="navigateTo('prescription-schedule')">
        <span class="nav-icon">📋</span> Prescription Schedule
      </button>
      <button class="nav-item" data-view="prescription-history" onclick="navigateTo('prescription-history')">
        <span class="nav-icon">📚</span> Prescription History
      </button>
      <button class="nav-item" data-view="records" onclick="navigateTo('records')">
        <span class="nav-icon">📁</span> Medical Records
      </button>
      <button class="nav-item" data-view="report-analyzer" onclick="navigateTo('report-analyzer')">
        <span class="nav-icon">🔬</span> Report Analyzer
      </button>
      <button class="nav-item" data-view="report-history" onclick="navigateTo('report-history')">
        <span class="nav-icon">📊</span> Report History
      </button>
      <div class="nav-section-title">AI Assistants</div>
      <button class="nav-item" data-view="ai-symptoms" onclick="navigateTo('ai-symptoms')">
        <span class="nav-icon">🧬</span> Symptom Checker
      </button>
      <button class="nav-item" data-view="ai-chat" onclick="navigateTo('ai-chat')">
        <span class="nav-icon">💬</span> Health AI Chat
      </button>
    `;
  } else if (role === 'doctor') {
    menu += `
      <button class="nav-item" data-view="doctor-appointments" onclick="navigateTo('doctor-appointments')">
        <span class="nav-icon">📅</span> Patient Visits
      </button>
      <div class="nav-section-title">AI Tools</div>
      <button class="nav-item" data-view="ai-report" onclick="navigateTo('ai-report')">
        <span class="nav-icon">📄</span> Report Explainer
      </button>
    `;
  } else if (role === 'pharmacy') {
    menu += `
      <button class="nav-item" data-view="pharmacy-orders" onclick="navigateTo('pharmacy-orders')">
        <span class="nav-icon">📋</span> Prescriptions
      </button>
      <div class="nav-section-title">AI Tools</div>
      <button class="nav-item" data-view="ai-prescription" onclick="navigateTo('ai-prescription')">
        <span class="nav-icon">🤳</span> RX Analyzer
      </button>
    `;
  }

  nav.innerHTML = menu;
};

const renderView = async (view) => {
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

  try {
    switch (view) {
      case 'dashboard': await renderDashboard(main); break;
      case 'records': await renderRecords(main); break;
      case 'ai-symptoms': await renderSymptomChecker(main); break;
      case 'ai-chat': await renderChat(main); break;
      case 'ai-report': await renderReportExplainer(main); break;
      case 'report-analyzer': await renderReportAnalyzer(main); break;
      case 'ai-prescription': await renderRXAnalyzer(main); break;
      case 'prescription-schedule': await renderPrescriptionSchedule(main); break;
      case 'prescription-history': await renderPrescriptionHistory(main); break;
      case 'report-history': await renderReportHistory(main); break;
      case 'medications': await renderMedications(main); break;
      case 'appointments': await renderPatientAppointments(main); break;
      case 'doctor-appointments': await renderDoctorAppointments(main); break;
      case 'pharmacy-orders': await renderPharmacyOrders(main); break;
      default: main.innerHTML = '<h2>View Coming Soon</h2>';
    }
  } catch (err) {
    main.innerHTML = `<div class="card"><p class="text-danger">${err.message}</p></div>`;
  }
};

// ─── DASHBOARD RENDERING ────────────────────────────────────────────────────
const renderDashboard = async (container) => {
  const role = state.user.role;
  const data = await apiRequest(`/${role}/dashboard`);
  
  let html = `
    <div class="page-header">
      <h1 class="page-title">Welcome, ${state.user.name}</h1>
      <p class="page-sub">Your health overview at a glance.</p>
    </div>
    
    <div class="ai-box mb-24">
      <div class="ai-box-label">AI Health Analysis</div>
      <p class="ai-box-text">${data.ai_health_summary || data.ai_workload_summary || data.ai_inventory_summary || "Analyzing your data..."}</p>
    </div>

    <div class="grid-4 mb-24">
      ${Object.entries(data.metrics || {}).map(([k, v]) => `
        <div class="stat-card">
          <div class="stat-value">${v}</div>
          <div class="stat-label">${k.replace(/_/g, ' ')}</div>
        </div>
      `).join('')}
    </div>
  `;

  if (role === 'patient') {
    // Load AI history
    let prescriptionSchedules = [];
    let reportAnalyses = [];
    try {
      prescriptionSchedules = await apiRequest('/patient/ai/prescription-schedules?limit=3');
    } catch (e) {}
    try {
      reportAnalyses = await apiRequest('/patient/ai/report-analyses?limit=3');
    } catch (e) {}

    html += `
      <div class="grid-2 mb-24">
        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title">Recent Prescription Schedules</div>
            <button class="btn btn-ghost btn-sm" onclick="navigateTo('prescription-schedule')">View All</button>
          </div>
          <div>
            ${prescriptionSchedules.length > 0 ? prescriptionSchedules.map(s => `
              <div class="flex-between mb-12 pb-12" style="border-bottom: 1px solid var(--border);">
                <div>
                  <div class="font-bold">${s.output?.total_medicines || 0} medicines</div>
                  <div class="text-xs text-muted">${formatDate(s.created_at)}</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="viewPrescriptionSchedule('${s.id}')">View</button>
              </div>
            `).join('') : '<p class="text-muted">No prescription schedules yet. Upload a prescription to get started.</p>'}
          </div>
        </div>
        <div class="card">
          <div class="flex-between mb-16">
            <div class="card-title">Recent Report Analyses</div>
            <button class="btn btn-ghost btn-sm" onclick="navigateTo('report-analyzer')">View All</button>
          </div>
          <div>
            ${reportAnalyses.length > 0 ? reportAnalyses.map(r => `
              <div class="flex-between mb-12 pb-12" style="border-bottom: 1px solid var(--border);">
                <div>
                  <div class="font-bold">${r.input?.report_type || 'Medical Report'}</div>
                  <div class="text-xs text-muted">${formatDate(r.created_at)}</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="viewReportAnalysis('${r.id}')">View</button>
              </div>
            `).join('') : '<p class="text-muted">No report analyses yet. Upload a medical report to get started.</p>'}
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">Medications</div>
          <div class="mt-16">
            ${(data.active_medications || []).map(m => `
              <div class="rx-med">
                <div class="rx-med-name">${m.medicine_name}</div>
                <div class="rx-med-detail">${m.dosage} • ${m.frequency}</div>
              </div>
            `).join('')}
            ${!data.active_medications?.length ? '<p class="text-muted">No active medications.</p>' : ''}
          </div>
        </div>
        <div class="card">
          <div class="card-title">Recent Records</div>
          <div class="mt-16">
            ${(data.recent_records || []).map(r => `
              <div class="flex-between mb-12">
                <div>
                  <div class="font-bold">${r.title}</div>
                  <div class="text-xs text-muted">${formatDate(r.created_at)}</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="viewRecord('${r.id}')">View</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
};

// ─── AI FEATURE: SYMPTOM CHECKER ───────────────────────────────────────────
const renderSymptomChecker = (container) => {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">AI Symptom Checker</h1>
      <p class="page-sub">Describe your symptoms by typing or speaking.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <form id="symptom-form">
          <div class="field-group mb-16">
            <label>Symptoms</label>
            <div style="position: relative;">
              <textarea id="sym-text" rows="4" placeholder="How are you feeling? Click the mic to speak..."></textarea>
              <button type="button" id="voice-btn" class="btn btn-ghost" style="position: absolute; right: 10px; bottom: 10px; padding: 8px 12px; min-width: auto;">
                🎤
              </button>
            </div>
            <div id="voice-status" style="display: none; margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 0.9rem;"></div>
          </div>
          <div class="field-group mb-16">
            <label>Upload Photo (Optional)</label>
            <input type="file" id="sym-file" accept="image/*">
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="sym-btn">Analyze Symptoms ✨</button>
        </form>
      </div>
      <div id="sym-result" class="card">
        <div class="empty-state">Results will appear here.</div>
      </div>
    </div>
  `;

  // Voice recognition setup
  let recognition = null;
  let isListening = false;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('voice-status');
    const symText = document.getElementById('sym-text');
    let finalTranscript = '';

    voiceBtn.onclick = () => {
      if (isListening) {
        recognition.stop();
        isListening = false;
        voiceBtn.innerHTML = '🎤';
        voiceBtn.style.background = '';
        voiceStatus.style.display = 'none';
      } else {
        recognition.start();
        isListening = true;
        voiceBtn.innerHTML = '⏹️';
        voiceBtn.style.background = 'var(--red)';
        voiceBtn.style.color = 'white';
        voiceStatus.style.display = 'block';
        voiceStatus.style.background = '#e0f2fe';
        voiceStatus.style.color = '#0369a1';
        voiceStatus.innerHTML = '🎤 Listening... Speak now';
        finalTranscript = symText.value;
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      symText.value = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
      voiceStatus.innerHTML = '🎤 Listening... "' + (interimTranscript || 'Speak now') + '"';
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      voiceBtn.innerHTML = '🎤';
      voiceBtn.style.background = '';
      voiceStatus.style.display = 'block';
      voiceStatus.style.background = '#fee';
      voiceStatus.style.color = '#c33';
      
      let errorMsg = 'Error: ';
      switch(event.error) {
        case 'no-speech':
          errorMsg += 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMsg += 'Microphone not found. Please check your device.';
          break;
        case 'not-allowed':
          errorMsg += 'Microphone permission denied. Please allow access.';
          break;
        default:
          errorMsg += event.error;
      }
      voiceStatus.innerHTML = '❌ ' + errorMsg;
      
      setTimeout(() => {
        voiceStatus.style.display = 'none';
      }, 5000);
    };

    recognition.onend = () => {
      if (isListening) {
        isListening = false;
        voiceBtn.innerHTML = '🎤';
        voiceBtn.style.background = '';
        voiceStatus.style.display = 'block';
        voiceStatus.style.background = '#d1fae5';
        voiceStatus.style.color = '#065f46';
        voiceStatus.innerHTML = '✓ Recording complete. You can edit the text or submit.';
        
        setTimeout(() => {
          voiceStatus.style.display = 'none';
        }, 3000);
      }
    };
  } else {
    // Hide voice button if not supported
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
      voiceBtn.style.display = 'none';
    }
  }

  document.getElementById('symptom-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('sym-btn');
    const res = document.getElementById('sym-result');
    btn.disabled = true; btn.innerHTML = 'Analyzing...';
    try {
      const formData = new FormData();
      formData.append('symptom_text', document.getElementById('sym-text').value);
      const file = document.getElementById('sym-file').files[0];
      if (file) formData.append('image_file', file);
      const data = await apiRequest('/ai/symptom-checker', { method: 'POST', body: formData });
      res.innerHTML = `
        <div class="ai-box mb-16">
          <div class="ai-box-label">Possible Conditions</div>
          ${data.possible_conditions.map(c => `<p><b>${c.name}</b> (${c.probability}): ${c.description}</p>`).join('')}
        </div>
        <p><b>Severity:</b> ${data.severity}</p>
        <p><b>Next Steps:</b> ${data.next_steps.join(', ')}</p>
      `;
    } catch (err) { showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Analyze Symptoms ✨'; }
  };
};

// ─── AI FEATURE: SMART CHAT ORCHESTRATOR ────────────────────────────────────
const renderChat = (container) => {
  // Reset chat state
  state.chatHistory = [];
  state.session_id = null;
  state.currentUploadIntent = 'none';
  state.currentFile = null;

  container.innerHTML = `
    <div class="page-header mb-16">
      <h1 class="page-title">💬 Smart Health Chat</h1>
      <p class="page-sub">Your intelligent health assistant with specialized analysis</p>
    </div>

    <div class="chat-container glass-card">
      <div class="chat-messages" id="chat-messages">
        <div class="chat-bubble assistant">
          <div class="markdown-content">
            <p>👋 Hello! I'm your Smart Health Assistant.</p>
            <p>I can help you with:</p>
            <ul>
              <li><strong>🩺 Symptoms</strong> - Upload a photo or describe how you're feeling</li>
              <li><strong>💊 Prescriptions</strong> - Upload and analyze your prescription</li>
              <li><strong>📊 Medical Reports</strong> - Understand your lab results</li>
              <li><strong>💬 General Questions</strong> - Ask anything about health</li>
            </ul>
            <p>Use the upload buttons below to attach files, or just type your question!</p>
          </div>
        </div>
      </div>
      
      <!-- Upload Buttons Section -->
      <div class="chat-upload-section">
        <div class="upload-buttons-grid">
          <button class="upload-intent-btn" id="upload-symptom-btn" data-intent="symptom">
            <div class="upload-btn-icon">🩺</div>
            <div class="upload-btn-label">Upload Symptom</div>
            <div class="upload-btn-desc">Photo of symptoms</div>
          </button>
          <button class="upload-intent-btn" id="upload-prescription-btn" data-intent="prescription">
            <div class="upload-btn-icon">💊</div>
            <div class="upload-btn-label">Upload Prescription</div>
            <div class="upload-btn-desc">Prescription image</div>
          </button>
          <button class="upload-intent-btn" id="upload-report-btn" data-intent="report">
            <div class="upload-btn-icon">📊</div>
            <div class="upload-btn-label">Upload Report</div>
            <div class="upload-btn-desc">Lab/medical report</div>
          </button>
        </div>
        <input type="file" id="chat-file-input" accept="image/*,application/pdf" style="display: none;">
        <div id="chat-file-preview" style="display: none;"></div>
      </div>

      <div class="chat-input-area">
        <div style="position: relative; flex: 1;">
          <textarea class="chat-input" id="chat-input" placeholder="Type your message or use upload buttons above..."></textarea>
          <button type="button" id="chat-voice-btn" class="btn btn-ghost" style="position: absolute; right: 10px; bottom: 10px; padding: 8px 12px; min-width: auto;">
            🎤
          </button>
        </div>
        <button class="btn btn-primary" id="chat-send">Send</button>
      </div>
      <div id="chat-voice-status" style="display: none; margin: 8px 16px; padding: 8px; border-radius: 6px; font-size: 0.9rem;"></div>
    </div>
  `;

  const input = document.getElementById('chat-input');
  const msgBox = document.getElementById('chat-messages');
  const fileInput = document.getElementById('chat-file-input');
  const filePreview = document.getElementById('chat-file-preview');

  // Setup upload intent buttons
  document.querySelectorAll('.upload-intent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const intent = btn.dataset.intent;
      state.currentUploadIntent = intent;
      fileInput.click();
    });
  });

  // Handle file selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      state.currentFile = file;
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const intentLabels = {
          symptom: '🩺 Symptom Photo',
          prescription: '💊 Prescription',
          report: '📊 Medical Report'
        };
        
        filePreview.style.display = 'block';
        if (file.type.startsWith('image/')) {
          filePreview.innerHTML = `
            <div style="padding: 12px; background: var(--surface); border-radius: 8px; margin: 8px 16px; display: flex; align-items: center; gap: 12px;">
              <img src="${event.target.result}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text);">${intentLabels[state.currentUploadIntent]}</div>
                <div style="font-size: 0.85rem; color: var(--text-2);">${file.name}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="clearChatFile()">✕</button>
            </div>
          `;
        } else {
          filePreview.innerHTML = `
            <div style="padding: 12px; background: var(--surface); border-radius: 8px; margin: 8px 16px; display: flex; align-items: center; gap: 12px;">
              <div style="width: 60px; height: 60px; background: var(--primary-glow); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📄</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text);">${intentLabels[state.currentUploadIntent]}</div>
                <div style="font-size: 0.85rem; color: var(--text-2);">${file.name}</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="clearChatFile()">✕</button>
            </div>
          `;
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Voice recognition for chat
  setupChatVoiceRecognition(input);

  // Send message handler
  document.getElementById('chat-send').onclick = () => sendChatMessage();

  // Enter to send (Shift+Enter for new line)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Scroll to bottom
  msgBox.scrollTop = msgBox.scrollHeight;
};

// Clear uploaded file
window.clearChatFile = () => {
  state.currentFile = null;
  state.currentUploadIntent = 'none';
  document.getElementById('chat-file-input').value = '';
  document.getElementById('chat-file-preview').style.display = 'none';
};

// Setup voice recognition
const setupChatVoiceRecognition = (input) => {
  let chatRecognition = null;
  let isChatListening = false;

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    chatRecognition = new SpeechRecognition();
    chatRecognition.continuous = true;
    chatRecognition.interimResults = true;
    chatRecognition.lang = 'en-US';

    const voiceBtn = document.getElementById('chat-voice-btn');
    const voiceStatus = document.getElementById('chat-voice-status');
    let finalTranscript = '';

    voiceBtn.onclick = () => {
      if (isChatListening) {
        chatRecognition.stop();
        isChatListening = false;
        voiceBtn.innerHTML = '🎤';
        voiceBtn.style.background = '';
        voiceStatus.style.display = 'none';
      } else {
        chatRecognition.start();
        isChatListening = true;
        voiceBtn.innerHTML = '⏹️';
        voiceBtn.style.background = 'var(--red)';
        voiceBtn.style.color = 'white';
        voiceStatus.style.display = 'block';
        voiceStatus.style.background = '#e0f2fe';
        voiceStatus.style.color = '#0369a1';
        voiceStatus.innerHTML = '🎤 Listening... Speak now';
        finalTranscript = input.value;
      }
    };

    chatRecognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      input.value = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
      voiceStatus.innerHTML = '🎤 Listening... "' + (interimTranscript || 'Speak now') + '"';
    };

    chatRecognition.onerror = (event) => {
      isChatListening = false;
      voiceBtn.innerHTML = '🎤';
      voiceBtn.style.background = '';
      voiceStatus.style.display = 'block';
      voiceStatus.style.background = '#fee';
      voiceStatus.style.color = '#c33';
      voiceStatus.innerHTML = '❌ Error: ' + event.error;
      setTimeout(() => { voiceStatus.style.display = 'none'; }, 5000);
    };

    chatRecognition.onend = () => {
      if (isChatListening) {
        isChatListening = false;
        voiceBtn.innerHTML = '🎤';
        voiceBtn.style.background = '';
        voiceStatus.style.display = 'block';
        voiceStatus.style.background = '#d1fae5';
        voiceStatus.style.color = '#065f46';
        voiceStatus.innerHTML = '✓ Recording complete';
        setTimeout(() => { voiceStatus.style.display = 'none'; }, 3000);
      }
    };
  } else {
    const voiceBtn = document.getElementById('chat-voice-btn');
    if (voiceBtn) voiceBtn.style.display = 'none';
  }
};

// Send chat message
const sendChatMessage = async () => {
  const input = document.getElementById('chat-input');
  const msgBox = document.getElementById('chat-messages');
  const message = input.value.trim();
  
  if (!message && !state.currentFile) {
    showToast('Please enter a message or upload a file', 'error');
    return;
  }

  // Add user message to chat
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerHTML = `<div class="markdown-content">${escapeHtml(message || '📎 File uploaded')}</div>`;
  msgBox.appendChild(userBubble);
  
  // Clear input
  input.value = '';
  
  // Show typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble assistant';
  typingBubble.id = 'typing-indicator';
  typingBubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  msgBox.appendChild(typingBubble);
  msgBox.scrollTop = msgBox.scrollHeight;

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('upload_intent', state.currentUploadIntent || 'none');
    formData.append('chat_history', JSON.stringify(state.chatHistory));
    if (state.session_id) {
      formData.append('session_id', state.session_id);
    }
    if (state.currentFile) {
      formData.append('file', state.currentFile);
    }

    // Call orchestrator API
    const data = await apiRequest('/ai/chat-orchestrator', {
      method: 'POST',
      body: formData
    });

    // Remove typing indicator
    typingBubble.remove();

    // Add AI response with markdown rendering
    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble assistant';
    
    // Render markdown
    const markdownHtml = marked.parse(data.answer);
    aiBubble.innerHTML = `<div class="markdown-content">${markdownHtml}</div>`;
    
    // Add disclaimer if present
    if (data.disclaimer) {
      const disclaimer = document.createElement('div');
      disclaimer.className = 'chat-disclaimer';
      disclaimer.textContent = data.disclaimer;
      aiBubble.appendChild(disclaimer);
    }
    
    // Add action buttons if supported
    if (data.supports_actions && data.suggested_actions && data.suggested_actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'chat-actions';
      data.suggested_actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'chat-action-btn';
        btn.textContent = action.label;
        btn.onclick = () => handleChatAction(action.action);
        actionsDiv.appendChild(btn);
      });
      aiBubble.appendChild(actionsDiv);
    }
    
    msgBox.appendChild(aiBubble);

    // Update state
    state.session_id = data.session_id;
    state.chatHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: data.answer }
    );

    // Clear file after sending
    clearChatFile();

    msgBox.scrollTop = msgBox.scrollHeight;
  } catch (err) {
    typingBubble.remove();
    showToast(err.message, 'error');
  }
};

// Handle chat action buttons
const handleChatAction = (action) => {
  switch (action) {
    case 'book_appointment':
      navigateTo('appointments');
      showToast('Opening appointments...', 'info');
      break;
    case 'view_history':
      navigateTo('records');
      showToast('Opening medical records...', 'info');
      break;
    case 'set_reminders':
      navigateTo('medications');
      showToast('Opening medications...', 'info');
      break;
    case 'find_pharmacy':
      showToast('Pharmacy finder coming soon!', 'info');
      break;
    case 'order_medicines':
      showToast('Medicine ordering coming soon!', 'info');
      break;
    case 'save_record':
      navigateTo('records');
      showToast('Opening medical records...', 'info');
      break;
    case 'share_doctor':
      showToast('Share feature coming soon!', 'info');
      break;
    default:
      showToast('Action not implemented yet', 'info');
  }
};

// Escape HTML for security
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ─── AI FEATURE: REPORT EXPLAINER ──────────────────────────────────────────
const renderReportExplainer = (container) => {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">AI Report Explainer</h1>
      <p class="page-sub">Upload your medical report for analysis.</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <form id="rep-form">
          <input type="file" id="rep-file" class="mb-16" required>
          <button type="submit" class="btn btn-primary btn-full" id="rep-btn">Explain Report ✨</button>
        </form>
      </div>
      <div id="rep-result" class="card">Results will appear here.</div>
    </div>
  `;
  document.getElementById('rep-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('rep-btn');
    btn.disabled = true; btn.innerHTML = 'Processing...';
    try {
      const formData = new FormData();
      formData.append('report_file', document.getElementById('rep-file').files[0]);
      const data = await apiRequest('/ai/report-explainer', { method: 'POST', body: formData });
      document.getElementById('rep-result').innerHTML = `
        <h3>Summary</h3><p>${data.plain_language_summary}</p>
        <h4>Finds</h4><ul>${data.abnormalities.map(a => `<li>${a}</li>`).join('')}</ul>
      `;
    } catch (err) { showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Explain Report ✨'; }
  };
};

// ─── AI FEATURE: RX ANALYZER ──────────────────────────────────────────────
const renderRXAnalyzer = (container) => {
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">RX Analyzer</h1></div>
    <div class="grid-2">
      <div class="card">
        <form id="rx-form">
          <input type="file" id="rx-file" class="mb-16" required>
          <button type="submit" class="btn btn-primary btn-full" id="rx-btn">Analyze RX ✨</button>
        </form>
      </div>
      <div id="rx-result" class="card">Results will appear here.</div>
    </div>
  `;
  document.getElementById('rx-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('rx-btn');
    btn.disabled = true; btn.innerHTML = 'Processing...';
    try {
      const formData = new FormData();
      formData.append('prescription_file', document.getElementById('rx-file').files[0]);
      const data = await apiRequest('/ai/prescription-analyzer', { method: 'POST', body: formData });
      document.getElementById('rx-result').innerHTML = `
        <h4>Meds Found:</h4>
        ${data.medicines.map(m => `<p>${m.name}: ${m.instructions}</p>`).join('')}
      `;
    } catch (err) { showToast(err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Analyze RX ✨'; }
  };
};

// ─── DOCTOR VIEWS ──────────────────────────────────────────────────────────
const renderDoctorAppointments = async (container) => {
  const appts = await apiRequest('/doctor/appointments');
  container.innerHTML = `
    <div class="page-header flex-between">
      <h1 class="page-title">Doctor Visits</h1>
      <button class="btn btn-primary btn-sm" onclick="navigateTo('dashboard')">Refresh</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Patient</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${appts.map(a => `
            <tr>
              <td>Patient #${a.patient_id.slice(-5)}</td>
              <td>${formatDate(a.scheduled_at)}</td>
              <td><span class="badge badge-${a.status === 'confirmed' ? 'green' : 'amber'}">${a.status}</span></td>
              <td><button class="btn btn-ghost btn-sm" onclick="showToast('Visit Logic Ready')">Manage</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// ─── PHARMACY VIEWS ────────────────────────────────────────────────────────
const renderPharmacyOrders = async (container) => {
  const orders = await apiRequest('/pharmacy/prescriptions/all-pending');
  container.innerHTML = `
    <div class="page-header"><h1 class="page-title">Pending Orders</h1></div>
    <div class="grid-2">
      ${orders.map(o => `
        <div class="card">
          <div class="flex-between mb-8"><b>Order #${o.id.slice(-5)}</b> <span class="badge badge-amber">${o.status}</span></div>
          <div class="mb-12">${o.medicines.map(m => `<div>- ${m.name}</div>`).join('')}</div>
          <button class="btn btn-primary btn-sm btn-full" onclick="showToast('Dispensing...')">Dispense Now</button>
        </div>
      `).join('')}
    </div>
  `;
};

// ─── PATIENT VIEWS ─────────────────────────────────────────────────────────
const renderRecords = async (container) => {
  const records = await apiRequest('/patient/records');
  container.innerHTML = `
    <div class="page-header flex-between">
      <h1 class="page-title">My Reports</h1>
      <button class="btn btn-primary btn-sm" onclick="showToast('Upload available via Dashboard')">+ New Report</button>
    </div>
    <div class="grid-3">
      ${records.map(r => `
        <div class="card">
          <div class="badge badge-blue mb-8">${r.record_type}</div>
          <div class="font-bold mb-8">${r.title}</div>
          <p class="text-xs text-muted mb-12">${r.ai_summary || "Processing..."}</p>
          <button class="btn btn-secondary btn-sm btn-full" onclick="viewRecord('${r.id}')">View Full Insight</button>
        </div>
      `).join('')}
      ${!records.length ? '<p>No records yet.</p>' : ''}
    </div>
  `;
};

const renderMedications = async (c) => { 
  const data = await apiRequest('/patient/dashboard');
  c.innerHTML = `
    <div class="page-header"><h1 class="page-title">My Medications</h1></div>
    <div class="grid-2">
      ${(data.active_medications || []).map(m => `
        <div class="card rx-med">
          <div class="flex-between"><b>${m.medicine_name}</b> <span class="badge badge-green">Active</span></div>
          <div class="text-sm mt-4">${m.dosage} • ${m.frequency}</div>
          <div class="mt-12"><button class="btn btn-ghost btn-sm" onclick="showToast('Logged!')">Log Dose</button></div>
        </div>
      `).join('')}
    </div>
  `;
};

const renderPatientAppointments = async (c) => {
  const appts = await apiRequest('/patient/appointments');
  c.innerHTML = `
    <div class="page-header"><h1 class="page-title">My Appointments</h1></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${appts.map(a => `
            <tr><td>Dr. Specialized</td><td>${formatDate(a.scheduled_at)}</td><td>${a.status}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

window.viewRecord = (id) => { showToast("Viewing record " + id); };

window.viewPrescriptionSchedule = async (id) => {
  try {
    const data = await apiRequest(`/patient/ai/prescription-schedules/${id}`);
    const schedule = data.output;
    
    let html = `
      <h2 class="mb-20">Prescription Schedule</h2>
      <p class="mb-16 text-muted">Created: ${formatDate(data.created_at)}</p>
      
      ${schedule.next_upcoming_dose ? `
        <div class="mb-20" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px;">
          <h3 style="margin-bottom: 10px;">⏰ Next Dose: ${schedule.next_upcoming_dose.time}</h3>
          <p style="margin: 0;"><strong>${schedule.next_upcoming_dose.medicine}</strong> - ${schedule.next_upcoming_dose.dosage}</p>
        </div>
      ` : ''}
      
      <p class="mb-20">${schedule.schedule_summary}</p>
      
      <h3 class="mb-16">Medicines (${schedule.total_medicines})</h3>
      ${schedule.medicines.map(m => `
        <div class="mb-16" style="padding: 15px; background: var(--surface); border-radius: 8px; border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong>${m.name}</strong>
            <span class="badge badge-blue">${m.times_per_day}x daily</span>
          </div>
          <p style="margin: 4px 0; color: var(--text-2);">${m.dosage}</p>
          <p style="margin: 4px 0; color: var(--text-2);">Duration: ${m.duration_days || 'As prescribed'} ${m.duration_days ? 'days' : ''}</p>
          <p style="margin: 4px 0; color: var(--text-2);">Times: ${m.timing.join(', ')}</p>
          ${m.instructions ? `<p style="margin: 8px 0; padding: 8px; background: var(--surface-2); border-radius: 4px; font-size: 0.9rem;">${m.instructions}</p>` : ''}
        </div>
      `).join('')}
      
      <button class="btn btn-secondary btn-full mt-20" onclick="closeModal()">Close</button>
    `;
    
    openModal('Prescription Schedule', html);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.viewReportAnalysis = async (id) => {
  try {
    const data = await apiRequest(`/patient/ai/report-analyses/${id}`);
    const report = data.output;
    
    let html = `
      <h2 class="mb-20">Medical Report Analysis</h2>
      <p class="mb-16 text-muted">Analyzed: ${formatDate(data.created_at)}</p>
      
      <div class="mb-20" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px;">
        <h3 style="margin-bottom: 10px;">📊 Summary</h3>
        <p style="margin: 0;">${report.plain_language_summary}</p>
      </div>
      
      ${report.abnormalities && report.abnormalities.length > 0 ? `
        <div class="mb-20">
          <h3 class="mb-12">⚠️ Abnormalities</h3>
          ${report.abnormalities.map(a => `
            <div style="padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 8px; border-radius: 4px; color: #856404;">
              ${a}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${report.parameters && report.parameters.length > 0 ? `
        <div class="mb-20">
          <h3 class="mb-12">📋 Parameters</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: var(--surface); border-bottom: 2px solid var(--border);">
                  <th style="padding: 10px; text-align: left;">Parameter</th>
                  <th style="padding: 10px; text-align: left;">Value</th>
                  <th style="padding: 10px; text-align: left;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${report.parameters.map(p => {
                  const statusColors = {
                    'normal': 'var(--green)',
                    'low': 'var(--amber)',
                    'high': 'var(--red)',
                    'critical': 'var(--red)'
                  };
                  return `
                    <tr style="border-bottom: 1px solid var(--border);">
                      <td style="padding: 10px; font-weight: 600;">${p.name}</td>
                      <td style="padding: 10px;">${p.value} ${p.unit || ''}</td>
                      <td style="padding: 10px;">
                        <span style="background: ${statusColors[p.status] || 'var(--text-3)'}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem;">
                          ${p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      ${report.actionable_insights && report.actionable_insights.length > 0 ? `
        <div class="mb-20">
          <h3 class="mb-12">💡 Key Insights</h3>
          ${report.actionable_insights.map(i => `
            <div style="padding: 8px 0; border-bottom: 1px solid var(--border);">
              <p style="margin: 0;">✓ ${i}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <button class="btn btn-secondary btn-full mt-20" onclick="closeModal()">Close</button>
    `;
    
    openModal('Report Analysis', html);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// ─── PRESCRIPTION SCHEDULE FEATURE ─────────────────────────────────────────
const renderPrescriptionSchedule = async (container) => {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">💊 Prescription Schedule</h1>
      <p class="page-sub">Upload your prescription and get a personalized medication schedule</p>
    </div>

    <div class="card mb-24">
      <div class="upload-area" id="upload-area" style="border: 3px dashed #667eea; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: #f8f9ff; transition: all 0.3s ease;">
        <div style="font-size: 3rem; margin-bottom: 15px;">📋</div>
        <h3 style="margin-bottom: 10px;">Upload Prescription</h3>
        <p style="color: #666;">Drag and drop your prescription image here, or click to browse</p>
        <input type="file" id="prescription-file-input" accept="image/*,application/pdf" style="display: none;">
        <button class="btn btn-primary mt-16" onclick="document.getElementById('prescription-file-input').click()">Choose File</button>
      </div>
      <div id="prescription-preview" class="mt-16"></div>
      <button class="btn btn-primary btn-full mt-16" id="analyze-prescription-btn" style="display: none;">Analyze Prescription ✨</button>
    </div>

    <div id="prescription-loading" class="card mb-24" style="display: none; text-align: center; padding: 40px;">
      <div class="spinner mb-16"></div>
      <h3>Analyzing your prescription...</h3>
      <p class="text-muted">Our AI is extracting medicine details and creating your schedule</p>
    </div>

    <div id="prescription-error" class="card mb-24" style="display: none; background: #fee; border: 1px solid #fcc; color: #c33;"></div>

    <div id="prescription-results" style="display: none;">
      <div id="next-dose-banner" class="card mb-24" style="display: none; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px;">
        <h2 style="margin-bottom: 15px;">⏰ Next Dose</h2>
        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <div id="next-dose-time" style="font-size: 3rem; font-weight: bold;"></div>
          <div>
            <h3 id="next-dose-medicine" style="font-size: 1.3rem; margin-bottom: 5px;"></h3>
            <p id="next-dose-dosage"></p>
            <p id="next-dose-instructions"></p>
          </div>
        </div>
      </div>

      <div class="card mb-24">
        <h2 style="margin-bottom: 15px;">📅 Your Medication Schedule</h2>
        <p id="schedule-summary" class="text-muted"></p>
      </div>

      <div id="medicines-grid" class="grid-2"></div>
    </div>
  `;

  // Setup file upload handlers
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('prescription-file-input');
  const analyzeBtn = document.getElementById('analyze-prescription-btn');
  const preview = document.getElementById('prescription-preview');
  let selectedFile = null;

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = '#e8ebff';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  function handleFileSelect(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" alt="Prescription preview">`;
    };
    reader.readAsDataURL(file);
    analyzeBtn.style.display = 'block';
  }

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showToast('Please select a prescription image first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('prescription_file', selectedFile);
    formData.append('prescription_text', '');
    formData.append('image_description', '');

    document.getElementById('prescription-loading').style.display = 'block';
    document.getElementById('prescription-error').style.display = 'none';
    document.getElementById('prescription-results').style.display = 'none';

    try {
      const data = await apiRequest('/ai/prescription-schedule', {
        method: 'POST',
        body: formData
      });

      displayPrescriptionResults(data);
      showToast('Prescription analyzed successfully!', 'success');
    } catch (error) {
      const errorDiv = document.getElementById('prescription-error');
      errorDiv.textContent = error.message || 'Failed to analyze prescription. Please try again.';
      errorDiv.style.display = 'block';
      showToast(error.message, 'error');
    } finally {
      document.getElementById('prescription-loading').style.display = 'none';
    }
  });

  function displayPrescriptionResults(data) {
    // Show next dose banner
    if (data.next_upcoming_dose) {
      const banner = document.getElementById('next-dose-banner');
      banner.style.display = 'block';
      document.getElementById('next-dose-time').textContent = data.next_upcoming_dose.time;
      document.getElementById('next-dose-medicine').textContent = data.next_upcoming_dose.medicine;
      document.getElementById('next-dose-dosage').textContent = data.next_upcoming_dose.dosage;
      document.getElementById('next-dose-instructions').textContent = data.next_upcoming_dose.instructions || 'No special instructions';
    }

    // Show schedule summary
    document.getElementById('schedule-summary').textContent = data.schedule_summary;

    // Display medicine cards
    const grid = document.getElementById('medicines-grid');
    grid.innerHTML = '';

    data.medicines.forEach((medicine) => {
      const card = createMedicineCard(medicine);
      grid.appendChild(card);
    });

    document.getElementById('prescription-results').style.display = 'block';
  }

  function createMedicineCard(medicine) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderLeft = '5px solid #667eea';

    const timePills = medicine.timing.map(time => {
      const isNext = time === medicine.next_dose;
      return `<span style="background: ${isNext ? '#667eea' : 'white'}; border: 2px solid #667eea; color: ${isNext ? 'white' : '#667eea'}; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; display: inline-block; margin: 4px;">${time}</span>`;
    }).join('');

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
        <div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #333; margin-bottom: 5px;">${medicine.name}</div>
          <div style="color: #667eea; font-weight: 600; font-size: 1rem;">${medicine.dosage}</div>
        </div>
        <span class="badge badge-blue">${medicine.times_per_day}x daily</span>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <span style="color: #666; font-weight: 500;">Duration</span>
          <span style="color: #333; font-weight: 600;">${medicine.duration_days || 'As prescribed'} ${medicine.duration_days ? 'days' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #666; font-weight: 500;">Frequency</span>
          <span style="color: #333; font-weight: 600;">${medicine.times_per_day} times per day</span>
        </div>
      </div>

      <div style="background: #f8f9ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
        <h4 style="color: #333; margin-bottom: 10px; font-size: 1rem;">⏰ Daily Schedule</h4>
        <div>${timePills}</div>
      </div>

      ${medicine.instructions ? `
        <div style="background: #fff9e6; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; color: #856404; font-size: 0.95rem; margin-bottom: 15px;">
          <strong>📝 Instructions:</strong> ${medicine.instructions}
        </div>
      ` : ''}

      <div style="display: flex; gap: 10px; margin-top: 15px;">
        <button class="btn btn-primary" style="flex: 1;" onclick="logMedicationAdherence('${medicine.name}', '${medicine.timing[0]}', 'taken')">
          ✓ Mark as Taken
        </button>
        <button class="btn btn-secondary" style="flex: 1;" onclick="logMedicationAdherence('${medicine.name}', '${medicine.timing[0]}', 'skipped')">
          ✗ Skipped
        </button>
      </div>
    `;

    return card;
  }
};

window.logMedicationAdherence = async (medicineName, scheduledTime, status) => {
  try {
    const formData = new FormData();
    formData.append('medicine_name', medicineName);
    formData.append('scheduled_time', scheduledTime);
    formData.append('status', status);

    await apiRequest('/ai/medication-adherence', {
      method: 'POST',
      body: formData
    });

    showToast(`✓ ${medicineName} marked as ${status}`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to log adherence', 'error');
  }
};

// ─── REPORT ANALYZER FEATURE ───────────────────────────────────────────────
const renderReportAnalyzer = async (container) => {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔬 Medical Report Analyzer</h1>
      <p class="page-sub">Upload your lab report and get an AI-powered analysis</p>
    </div>

    <div class="card mb-24">
      <div class="upload-area" id="report-upload-area" style="border: 3px dashed #667eea; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: #f8f9ff; transition: all 0.3s ease;">
        <div style="font-size: 3rem; margin-bottom: 15px;">📄</div>
        <h3 style="margin-bottom: 10px;">Upload Medical Report</h3>
        <p style="color: #666;">Drag and drop your lab report here, or click to browse</p>
        <p style="color: #999; font-size: 0.9rem; margin-top: 8px;">Supports: PDF, JPG, PNG (Blood tests, Lab reports, etc.)</p>
        <input type="file" id="report-file-input" accept="image/*,application/pdf" style="display: none;">
        <button class="btn btn-primary mt-16" onclick="document.getElementById('report-file-input').click()">Choose File</button>
      </div>
      <div id="report-preview" class="mt-16"></div>
      <button class="btn btn-primary btn-full mt-16" id="analyze-report-btn" style="display: none;">Analyze Report ✨</button>
    </div>

    <div id="report-loading" class="card mb-24" style="display: none; text-align: center; padding: 40px;">
      <div class="spinner mb-16"></div>
      <h3>Analyzing your medical report...</h3>
      <p class="text-muted">Our AI is reading and interpreting your health data</p>
    </div>

    <div id="report-error" class="card mb-24" style="display: none; background: #fee; border: 1px solid #fcc; color: #c33;"></div>

    <div id="report-results" style="display: none;">
      <div class="card mb-24" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px;">
        <h2 style="margin-bottom: 15px;">📊 Report Summary</h2>
        <p id="report-summary" style="font-size: 1.1rem; line-height: 1.6;"></p>
      </div>

      <div class="grid-2 mb-24">
        <div class="card">
          <h3 style="margin-bottom: 15px; color: #333;">⚠️ Abnormalities Found</h3>
          <div id="abnormalities-list"></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom: 15px; color: #333;">💡 Key Insights</h3>
          <div id="insights-list"></div>
        </div>
      </div>

      <div class="card mb-24">
        <h3 style="margin-bottom: 20px; color: #333;">📋 Detailed Parameters</h3>
        <div id="parameters-table"></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="margin-bottom: 15px; color: #333;">🏃 Lifestyle Recommendations</h3>
          <div id="lifestyle-list"></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom: 15px; color: #333;">🔬 Follow-up Tests</h3>
          <div id="followup-list"></div>
        </div>
      </div>
    </div>
  `;

  const uploadArea = document.getElementById('report-upload-area');
  const fileInput = document.getElementById('report-file-input');
  const analyzeBtn = document.getElementById('analyze-report-btn');
  const preview = document.getElementById('report-preview');
  let selectedFile = null;

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = '#e8ebff';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleReportFileSelect(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleReportFileSelect(e.target.files[0]);
    }
  });

  function handleReportFileSelect(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" alt="Report preview">`;
      } else {
        preview.innerHTML = `<div style="padding: 20px; background: #f8f9ff; border-radius: 12px; margin-top: 20px;"><p style="color: #333;">📄 ${file.name}</p><p style="color: #666; font-size: 0.9rem;">PDF file ready for analysis</p></div>`;
      }
    };
    reader.readAsDataURL(file);
    analyzeBtn.style.display = 'block';
  }

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showToast('Please select a report file first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('report_file', selectedFile);
    formData.append('report_text', '');
    formData.append('question', 'Analyze this medical report in detail and explain all parameters in simple language.');
    formData.append('report_type', 'general');

    document.getElementById('report-loading').style.display = 'block';
    document.getElementById('report-error').style.display = 'none';
    document.getElementById('report-results').style.display = 'none';

    try {
      const data = await apiRequest('/ai/report-explainer', {
        method: 'POST',
        body: formData
      });

      displayReportResults(data);
      showToast('Report analyzed successfully!', 'success');
    } catch (error) {
      const errorDiv = document.getElementById('report-error');
      errorDiv.textContent = error.message || 'Failed to analyze report. Please try again.';
      errorDiv.style.display = 'block';
      showToast(error.message, 'error');
    } finally {
      document.getElementById('report-loading').style.display = 'none';
    }
  });

  function displayReportResults(data) {
    document.getElementById('report-summary').textContent = data.plain_language_summary;

    const abnormalitiesList = document.getElementById('abnormalities-list');
    if (data.abnormalities && data.abnormalities.length > 0) {
      abnormalitiesList.innerHTML = data.abnormalities.map(item => 
        `<div style="padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 10px; border-radius: 4px;">
          <p style="color: #856404; margin: 0;">${item}</p>
        </div>`
      ).join('');
    } else {
      abnormalitiesList.innerHTML = '<p style="color: #10b981;">✓ No significant abnormalities detected</p>';
    }

    const insightsList = document.getElementById('insights-list');
    if (data.actionable_insights && data.actionable_insights.length > 0) {
      insightsList.innerHTML = data.actionable_insights.map(item => 
        `<div style="padding: 10px; background: #e0f2fe; border-left: 4px solid #3b82f6; margin-bottom: 10px; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0;">💡 ${item}</p>
        </div>`
      ).join('');
    } else {
      insightsList.innerHTML = '<p style="color: #666;">No specific insights at this time</p>';
    }

    const parametersTable = document.getElementById('parameters-table');
    if (data.parameters && data.parameters.length > 0) {
      parametersTable.innerHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9ff; border-bottom: 2px solid #e0e0e0;">
                <th style="padding: 12px; text-align: left; color: #333;">Parameter</th>
                <th style="padding: 12px; text-align: left; color: #333;">Value</th>
                <th style="padding: 12px; text-align: left; color: #333;">Reference Range</th>
                <th style="padding: 12px; text-align: left; color: #333;">Status</th>
                <th style="padding: 12px; text-align: left; color: #333;">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              ${data.parameters.map(param => {
                const statusColors = {
                  'normal': '#10b981',
                  'low': '#f59e0b',
                  'high': '#ef4444',
                  'critical': '#dc2626'
                };
                const statusColor = statusColors[param.status] || '#666';
                return `
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: 600; color: #333;">${param.name}</td>
                    <td style="padding: 12px; color: #333;">${param.value} ${param.unit || ''}</td>
                    <td style="padding: 12px; color: #666;">${param.reference_range || 'N/A'}</td>
                    <td style="padding: 12px;">
                      <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                        ${param.status.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding: 12px; color: #666; font-size: 0.9rem;">${param.interpretation || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      parametersTable.innerHTML = '<p style="color: #666;">No parameters extracted from the report</p>';
    }

    const lifestyleList = document.getElementById('lifestyle-list');
    if (data.lifestyle_recommendations && data.lifestyle_recommendations.length > 0) {
      lifestyleList.innerHTML = data.lifestyle_recommendations.map(item => 
        `<div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <p style="color: #333; margin: 0;">✓ ${item}</p>
        </div>`
      ).join('');
    } else {
      lifestyleList.innerHTML = '<p style="color: #666;">No specific recommendations</p>';
    }

    const followupList = document.getElementById('followup-list');
    if (data.follow_up_tests && data.follow_up_tests.length > 0) {
      followupList.innerHTML = data.follow_up_tests.map(item => 
        `<div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          <p style="color: #333; margin: 0;">🔬 ${item}</p>
        </div>`
      ).join('');
    } else {
      followupList.innerHTML = '<p style="color: #10b981;">✓ No follow-up tests needed at this time</p>';
    }

    document.getElementById('report-results').style.display = 'block';
  }
};

// ─── PRESCRIPTION HISTORY ──────────────────────────────────────────────────
const renderPrescriptionHistory = async (container) => {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  
  try {
    const schedules = await apiRequest('/patient/ai/prescription-schedules?limit=50');
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📋 Prescription History</h1>
        <p class="page-sub">View all your analyzed prescriptions</p>
      </div>

      ${schedules.length === 0 ? `
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">📋</div>
          <h3 style="margin-bottom: 10px;">No Prescription Schedules Yet</h3>
          <p class="text-muted mb-20">Upload a prescription to get started</p>
          <button class="btn btn-primary" onclick="navigateTo('prescription-schedule')">Upload Prescription</button>
        </div>
      ` : `
        <div class="grid-2">
          ${schedules.map(s => {
            const schedule = s.output;
            return `
              <div class="card">
                <div class="flex-between mb-16">
                  <div>
                    <h3 style="margin-bottom: 4px;">${schedule.total_medicines} Medicines</h3>
                    <p class="text-xs text-muted">${formatDate(s.created_at)}</p>
                  </div>
                  <button class="btn btn-ghost btn-sm" onclick="deletePrescriptionSchedule('${s.id}')">Delete</button>
                </div>
                <p class="text-sm mb-16" style="color: var(--text-2);">${schedule.schedule_summary.substring(0, 100)}...</p>
                <div class="mb-16">
                  ${schedule.medicines.slice(0, 3).map(m => `
                    <div style="padding: 8px; background: var(--surface); border-radius: 6px; margin-bottom: 6px;">
                      <strong>${m.name}</strong> - ${m.dosage}
                    </div>
                  `).join('')}
                  ${schedule.medicines.length > 3 ? `<p class="text-xs text-muted">+${schedule.medicines.length - 3} more</p>` : ''}
                </div>
                <button class="btn btn-primary btn-full" onclick="viewPrescriptionSchedule('${s.id}')">View Details</button>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  } catch (error) {
    container.innerHTML = `<div class="card"><p class="text-danger">${error.message}</p></div>`;
  }
};

// ─── REPORT HISTORY ────────────────────────────────────────────────────────
const renderReportHistory = async (container) => {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  
  try {
    const reports = await apiRequest('/patient/ai/report-analyses?limit=50');
    
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🔬 Report Analysis History</h1>
        <p class="page-sub">View all your analyzed medical reports</p>
      </div>

      ${reports.length === 0 ? `
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">🔬</div>
          <h3 style="margin-bottom: 10px;">No Report Analyses Yet</h3>
          <p class="text-muted mb-20">Upload a medical report to get started</p>
          <button class="btn btn-primary" onclick="navigateTo('report-analyzer')">Upload Report</button>
        </div>
      ` : `
        <div class="grid-2">
          ${reports.map(r => {
            const report = r.output;
            return `
              <div class="card">
                <div class="flex-between mb-16">
                  <div>
                    <h3 style="margin-bottom: 4px;">${r.input?.report_type || 'Medical Report'}</h3>
                    <p class="text-xs text-muted">${formatDate(r.created_at)}</p>
                  </div>
                  <button class="btn btn-ghost btn-sm" onclick="deleteReportAnalysis('${r.id}')">Delete</button>
                </div>
                <p class="text-sm mb-16" style="color: var(--text-2);">${report.plain_language_summary.substring(0, 120)}...</p>
                <div class="mb-16">
                  ${report.abnormalities && report.abnormalities.length > 0 ? `
                    <div style="padding: 8px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 8px;">
                      <p style="margin: 0; color: #856404; font-size: 0.9rem;">⚠️ ${report.abnormalities.length} abnormalities found</p>
                    </div>
                  ` : `
                    <div style="padding: 8px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px; margin-bottom: 8px;">
                      <p style="margin: 0; color: #065f46; font-size: 0.9rem;">✓ No abnormalities detected</p>
                    </div>
                  `}
                  ${report.parameters ? `<p class="text-xs text-muted">${report.parameters.length} parameters analyzed</p>` : ''}
                </div>
                <button class="btn btn-primary btn-full" onclick="viewReportAnalysis('${r.id}')">View Details</button>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  } catch (error) {
    container.innerHTML = `<div class="card"><p class="text-danger">${error.message}</p></div>`;
  }
};

window.deletePrescriptionSchedule = async (id) => {
  if (!confirm('Are you sure you want to delete this prescription schedule?')) return;
  
  try {
    await apiRequest(`/patient/ai/prescription-schedules/${id}`, { method: 'DELETE' });
    showToast('Schedule deleted successfully', 'success');
    navigateTo('prescription-history');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.deleteReportAnalysis = async (id) => {
  if (!confirm('Are you sure you want to delete this report analysis?')) return;
  
  try {
    await apiRequest(`/patient/ai/report-analyses/${id}`, { method: 'DELETE' });
    showToast('Report analysis deleted successfully', 'success');
    navigateTo('report-history');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// ─── MODAL CONTROLS ────────────────────────────────────────────────────────
const openModal = (title, contentHtml) => {
  const modal = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-content');
  box.innerHTML = `<h2 class="mb-20">${title}</h2>${contentHtml}`;
  modal.classList.remove('hidden');
};

const closeModal = () => {
  document.getElementById('modal-overlay').classList.add('hidden');
};

// ─── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (state.token) {
    startApp();
  } else {
    initAuth();
  }
});
