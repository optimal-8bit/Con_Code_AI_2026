# 🔄 End-to-End Data Flow Analysis

**Date:** 2026-04-11  
**Status:** ✅ ALL FLOWS VERIFIED

---

## 📊 STEP 3: DATA FLOW TRACING (COMPLETED)

### 1. SYMPTOM CHECKER FLOW ✅

**Frontend → Backend → Response**

```
USER ACTION:
└─ SymptomChecker.jsx (Web/src/pages/ai/SymptomChecker.jsx)
   └─ Form submission with FormData
      ├─ symptom_text (required)
      ├─ patient_age (optional)
      ├─ patient_gender (optional)
      ├─ known_conditions (optional)
      ├─ current_medications (optional)
      ├─ duration_days (optional)
      └─ image_file (optional)

SERVICE LAYER:
└─ aiService.checkSymptoms(formData)
   └─ POST /api/v1/ai/symptom-checker
      └─ Headers: { 'Content-Type': 'multipart/form-data' }

BACKEND:
└─ ai_routes.py: @ai_router.post("/symptom-checker")
   └─ Accepts FormData with Form(...) parameters
   └─ Processes image if provided
   └─ Calls llm_service.invoke_json()
   └─ Saves to ai_record_service.save_symptom_check()
   └─ Returns SymptomCheckerResponse

RESPONSE STRUCTURE:
{
  "possible_conditions": [
    {
      "name": "string",
      "probability": "string",
      "description": "string"
    }
  ],
  "severity": "low|moderate|high|critical",
  "red_flags": ["string"],
  "next_steps": ["string"],
  "recommended_specialist": "string|null",
  "home_care_tips": ["string"],
  "disclaimer": "string",
  "record_id": "string"
}

FRONTEND RENDERING:
└─ SymptomChecker.jsx displays:
   ├─ Severity badge with color coding
   ├─ Possible conditions list
   ├─ Red flags (if any)
   ├─ Next steps
   ├─ Home care tips
   ├─ Recommended specialist
   └─ Disclaimer
```

**✅ STATUS:** Flow is correct. FormData format matches backend expectations.

---

### 2. PRESCRIPTION ANALYZER FLOW ✅

**Frontend → Backend → Response**

```
USER ACTION:
└─ PrescriptionAnalyzer.jsx (Web/src/pages/ai/PrescriptionAnalyzer.jsx)
   └─ Form submission with FormData
      ├─ prescription_text (optional)
      ├─ patient_age (optional)
      ├─ patient_conditions (optional)
      └─ prescription_file (optional - image or PDF)

SERVICE LAYER:
└─ aiService.analyzePrescription(formData)
   └─ POST /api/v1/ai/prescription-analyzer
      └─ Headers: { 'Content-Type': 'multipart/form-data' }

BACKEND:
└─ ai_routes.py: @ai_router.post("/prescription-analyzer")
   └─ Accepts FormData with Form(...) parameters
   └─ Processes file (PDF text extraction or image OCR)
   └─ Calls llm_service.invoke_json()
   └─ Saves to ai_record_service.save_prescription_analysis()
   └─ Returns PrescriptionAnalyzerResponse

RESPONSE STRUCTURE:
{
  "medicines": [
    {
      "name": "string",
      "generic_name": "string|null",
      "dosage": "string",
      "frequency": "string",
      "duration": "string",
      "instructions": "string",
      "side_effects": ["string"],
      "interactions": ["string"]
    }
  ],
  "summary_instructions": ["string"],
  "drug_interactions": ["string"],
  "dietary_restrictions": ["string"],
  "storage_instructions": ["string"],
  "record_id": "string"
}

FRONTEND RENDERING:
└─ PrescriptionAnalyzer.jsx displays:
   ├─ Medicine cards with details
   ├─ Side effects per medicine
   ├─ Drug interactions warnings
   ├─ Summary instructions
   ├─ Dietary restrictions
   └─ Storage instructions
```

**✅ STATUS:** Flow is correct. Supports both image and PDF uploads.

---

### 3. REPORT EXPLAINER FLOW ✅

**Frontend → Backend → Response**

```
USER ACTION:
└─ ReportExplainer.jsx (Web/src/pages/ai/ReportExplainer.jsx)
   └─ Form submission with FormData
      ├─ report_text (optional)
      ├─ question (default: "Explain this medical report in simple language.")
      ├─ patient_age (optional)
      ├─ patient_gender (optional)
      ├─ report_type (default: "general")
      └─ report_file (optional - image or PDF)

SERVICE LAYER:
└─ aiService.explainReport(formData)
   └─ POST /api/v1/ai/report-explainer
      └─ Headers: { 'Content-Type': 'multipart/form-data' }

BACKEND:
└─ ai_routes.py: @ai_router.post("/report-explainer")
   └─ Accepts FormData with Form(...) parameters
   └─ Processes file (PDF text extraction or image OCR)
   └─ Calls llm_service.invoke_json()
   └─ Saves to ai_record_service.save_report_explanation()
   └─ Returns ReportExplainerResponse

RESPONSE STRUCTURE:
{
  "plain_language_summary": "string",
  "parameters": [
    {
      "name": "string",
      "value": "string",
      "unit": "string",
      "reference_range": "string",
      "status": "normal|low|high|critical",
      "interpretation": "string"
    }
  ],
  "abnormalities": ["string"],
  "risk_factors": ["string"],
  "actionable_insights": ["string"],
  "lifestyle_recommendations": ["string"],
  "follow_up_tests": ["string"],
  "urgency": "routine|soon|urgent|emergency",
  "record_id": "string"
}

FRONTEND RENDERING:
└─ ReportExplainer.jsx displays:
   ├─ Urgency badge with color coding
   ├─ Plain language summary
   ├─ Test parameters with status badges
   ├─ Abnormalities (if any)
   ├─ Risk factors
   ├─ Actionable insights
   ├─ Lifestyle recommendations
   └─ Follow-up tests
```

**✅ STATUS:** Flow is correct. Comprehensive report analysis with structured output.

---

### 4. SMART CHAT FLOW ✅

**Frontend → Backend → Response**

```
USER ACTION:
└─ SmartChat.jsx (Web/src/pages/ai/SmartChat.jsx)
   └─ Message submission with JSON payload
      ├─ question (required)
      ├─ chat_history (array of {role, content})
      ├─ session_id (optional, generated if null)
      ├─ context_type (default: "general")
      ├─ report_context (optional)
      └─ medical_history (optional)

SERVICE LAYER:
└─ aiService.chat(data)
   └─ POST /api/v1/ai/smart-chat
      └─ Headers: { 'Content-Type': 'application/json' }

BACKEND:
└─ ai_routes.py: @ai_router.post("/smart-chat")
   └─ Accepts SmartChatRequest (JSON)
   └─ Builds context from chat history
   └─ Calls llm_service.invoke_json()
   └─ Saves to ai_record_service.save_chat()
   └─ Returns SmartChatResponse

RESPONSE STRUCTURE:
{
  "answer": "string",
  "session_id": "string",
  "follow_up_questions": ["string"],
  "sources": ["string"],
  "disclaimer": "string",
  "record_id": "string"
}

FRONTEND RENDERING:
└─ SmartChat.jsx displays:
   ├─ User messages (right-aligned, blue)
   ├─ Assistant messages (left-aligned, gray)
   ├─ Follow-up question suggestions (clickable)
   ├─ Loading animation (bouncing dots)
   └─ Disclaimer at bottom
```

**✅ STATUS:** Flow is correct. Real-time chat with session management.

---

### 5. PRESCRIPTION SCHEDULE FLOW ✅

**Frontend → Backend → Response**

```
USER ACTION:
└─ Patient pages use aiService.getPrescriptionSchedule()
   └─ Form submission with FormData
      ├─ prescription_text (optional)
      ├─ image_description (optional)
      └─ prescription_file (optional - image or PDF)

SERVICE LAYER:
└─ aiService.getPrescriptionSchedule(formData)
   └─ POST /api/v1/ai/prescription-schedule
      └─ Headers: { 'Content-Type': 'multipart/form-data' }

BACKEND:
└─ ai_routes.py: @ai_router.post("/prescription-schedule")
   └─ Accepts FormData with Form(...) parameters
   └─ Processes file (PDF text extraction or image OCR)
   └─ Calls llm_service.invoke_json()
   └─ Calculates next upcoming dose
   └─ Saves to ai_record_service.save_prescription_schedule()
   └─ Returns PrescriptionScheduleResponse

RESPONSE STRUCTURE:
{
  "medicines": [
    {
      "name": "string",
      "dosage": "string",
      "times_per_day": int,
      "duration_days": int,
      "timing": ["HH:MM"],
      "instructions": "string",
      "next_dose": "HH:MM|null"
    }
  ],
  "schedule_summary": "string",
  "total_medicines": int,
  "next_upcoming_dose": {
    "medicine": "string",
    "dosage": "string",
    "time": "HH:MM",
    "instructions": "string"
  } | null,
  "record_id": "string"
}

FRONTEND USAGE:
└─ Patient can:
   ├─ View all prescription schedules
   ├─ Get reminders for next dose
   ├─ Log medication adherence
   └─ Track medication history
```

**✅ STATUS:** Flow is correct. Smart scheduling with time calculations.

---

## 🔍 AUTHENTICATION FLOW ✅

```
LOGIN:
└─ Login.jsx
   └─ authService.login(email, password)
      └─ POST /api/v1/auth/login
         └─ Backend validates credentials
         └─ Returns { access_token, refresh_token, user }
         └─ Frontend stores in localStorage
         └─ Redirects to role-based dashboard

TOKEN REFRESH:
└─ api-client.js interceptor detects 401
   └─ Calls POST /api/v1/auth/refresh
      └─ Sends refresh_token
      └─ Backend validates and returns new tokens
      └─ Frontend updates localStorage
      └─ Retries original request

PROTECTED ROUTES:
└─ ProtectedRoute.jsx checks:
   ├─ authService.isAuthenticated()
   ├─ User role matches required role
   └─ Redirects to /login if unauthorized
```

**✅ STATUS:** Authentication flow is correct with auto-refresh.

---

## 🎯 PATIENT DASHBOARD FLOW ✅

```
DASHBOARD LOAD:
└─ PatientDashboard.jsx
   └─ patientService.getDashboard()
      └─ GET /api/v1/patient/dashboard
         └─ Backend aggregates:
            ├─ Upcoming appointments
            ├─ Active medications
            ├─ Recent prescriptions
            ├─ Medical records
            ├─ Notifications
            ├─ AI health summary
            └─ AI recommendations
         └─ Returns comprehensive dashboard data

FRONTEND DISPLAYS:
├─ Metrics cards (appointments, prescriptions, medications)
├─ Upcoming appointments list
├─ Active medications with adherence tracking
├─ Recent prescriptions
├─ Notifications
├─ AI-generated health summary
└─ AI-generated recommendations
```

**✅ STATUS:** Dashboard aggregation is efficient and complete.

---

## 🏥 DOCTOR WORKFLOW FLOW ✅

```
APPOINTMENT MANAGEMENT:
└─ Doctor views pending appointments
   └─ Updates appointment status (confirmed/cancelled/completed)
      └─ PATCH /api/v1/doctor/appointments/{id}
         └─ Backend updates status
         └─ Sends notification to patient
         └─ Returns updated appointment

PRESCRIPTION ISSUANCE:
└─ Doctor issues prescription
   └─ POST /api/v1/doctor/prescriptions
      └─ Backend creates prescription
      └─ Sends notification to patient
      └─ Returns prescription with ID
```

**✅ STATUS:** Doctor workflows are streamlined and notification-enabled.

---

## 💊 PHARMACY WORKFLOW FLOW ✅

```
ORDER PROCESSING:
└─ Pharmacy receives order notification
   └─ Views order details
      └─ Updates order status (preparing/ready/delivered)
         └─ PATCH /api/v1/pharmacy/orders/{id}/status
            └─ Backend updates status
            └─ Sends notification to patient
            └─ Returns updated order

INVENTORY MANAGEMENT:
└─ Pharmacy manages stock
   └─ PATCH /api/v1/pharmacy/inventory/{id}/quantity
      └─ Backend updates quantity
      └─ Checks for low stock alerts
      └─ Returns updated inventory item
```

**✅ STATUS:** Pharmacy workflows are complete with inventory tracking.

---

## 🔄 FILE UPLOAD FLOWS ✅

### All file uploads use FormData:

1. **Symptom Checker** - Optional image upload
2. **Prescription Analyzer** - Image or PDF upload
3. **Report Explainer** - Image or PDF upload
4. **Prescription Schedule** - Image or PDF upload
5. **Medical Records** - File upload with metadata

**Backend Processing:**
- Validates file size (max 10MB)
- Detects MIME type
- Extracts text from PDFs using PyMuPDF
- Processes images with OCR (if configured)
- Saves files to `backend/uploads/` directory
- Returns file URL and extracted text

**✅ STATUS:** All file upload flows are correctly implemented.

---

## 📡 ERROR HANDLING FLOW ✅

```
FRONTEND:
└─ try/catch in all service calls
   └─ handleApiError(err) utility function
      └─ Extracts error message from:
         ├─ err.response.data.detail (FastAPI format)
         ├─ err.response.data.message
         ├─ err.message
         └─ Default: "An error occurred"

BACKEND:
└─ HTTPException with status codes:
   ├─ 400: Bad Request (validation errors)
   ├─ 401: Unauthorized (auth errors)
   ├─ 403: Forbidden (permission errors)
   ├─ 404: Not Found (resource errors)
   ├─ 413: Payload Too Large (file size errors)
   └─ 500: Internal Server Error (unexpected errors)

API CLIENT:
└─ Axios interceptors:
   ├─ Request: Adds Authorization header
   ├─ Response: Handles 401 with token refresh
   └─ Error: Propagates to caller
```

**✅ STATUS:** Error handling is comprehensive and user-friendly.

---

## 🎯 CONCLUSION

**All data flows have been traced and verified:**

✅ Symptom Checker - Complete flow verified  
✅ Prescription Analyzer - Complete flow verified  
✅ Report Explainer - Complete flow verified  
✅ Smart Chat - Complete flow verified  
✅ Prescription Schedule - Complete flow verified  
✅ Authentication - Complete flow verified  
✅ Patient Dashboard - Complete flow verified  
✅ Doctor Workflows - Complete flow verified  
✅ Pharmacy Workflows - Complete flow verified  
✅ File Uploads - Complete flow verified  
✅ Error Handling - Complete flow verified

**No integration issues found in data flow analysis.**

---

**Next Step:** Proceed to Step 4 - Runtime Inspection (requires servers to be running)
