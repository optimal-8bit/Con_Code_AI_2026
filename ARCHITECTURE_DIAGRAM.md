# Architecture Diagram - Smart Chat Orchestrator

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                                │
│                     backend/app/static/index.html                           │
│                     backend/app/static/app.js                               │
│                     backend/app/static/style.css                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/HTTPS
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI)                                 │
│                     backend/app/main.py                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
┌───────────────────▼──────────────┐   ┌───────────▼────────────────┐
│      API Routes Layer            │   │   Existing Routes          │
│  backend/app/api/ai_routes.py    │   │   (Unchanged)              │
│                                  │   │                            │
│  NEW:                            │   │  /ai/symptom-checker       │
│  POST /ai/chat-orchestrator      │   │  /ai/prescription-analyzer │
│                                  │   │  /ai/report-explainer      │
│  LEGACY (Preserved):             │   │  /ai/smart-chat            │
│  POST /ai/smart-chat             │   │                            │
└───────────────────┬──────────────┘   └────────────────────────────┘
                    │
                    │
┌───────────────────▼──────────────────────────────────────────────────────┐
│                    Service Layer                                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │         Chat Orchestrator Service (NEW)                        │    │
│  │         backend/app/services/chat_orchestrator.py              │    │
│  │                                                                │    │
│  │  ┌──────────────────────────────────────────────────────┐     │    │
│  │  │  process_chat_request()                              │     │    │
│  │  │    - Receives: message, file, intent, history        │     │    │
│  │  │    - Returns: answer, agent_used, actions            │     │    │
│  │  └──────────────────────────────────────────────────────┘     │    │
│  │                                                                │    │
│  │  ┌──────────────────────────────────────────────────────┐     │    │
│  │  │  _determine_agent()                                  │     │    │
│  │  │    - Intent-based routing logic                      │     │    │
│  │  │    - Default: symptom checker                        │     │    │
│  │  └──────────────────────────────────────────────────────┘     │    │
│  │                                                                │    │
│  │  Routes to:                                                    │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │    │
│  │  │ _route_to_     │  │ _route_to_     │  │ _route_to_   │   │    │
│  │  │ symptom_agent  │  │ prescription_  │  │ report_agent │   │    │
│  │  │                │  │ agent          │  │              │   │    │
│  │  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘   │    │
│  │           │                   │                  │           │    │
│  │           └───────────────────┴──────────────────┘           │    │
│  │                               │                              │    │
│  └───────────────────────────────┼──────────────────────────────┘    │
│                                  │                                   │
│  ┌───────────────────────────────▼──────────────────────────────┐   │
│  │         LLM Service (Existing - Unchanged)                    │   │
│  │         backend/app/services/llm_service.py                   │   │
│  │                                                               │   │
│  │  - invoke() for text-only                                    │   │
│  │  - invoke_with_image() for multimodal                        │   │
│  │  - invoke_json() for structured output                       │   │
│  └───────────────────────────────┬──────────────────────────────┘   │
│                                  │                                   │
│  ┌───────────────────────────────▼──────────────────────────────┐   │
│  │         File Service (Existing - Unchanged)                   │   │
│  │         backend/app/services/file_service.py                  │   │
│  │                                                               │   │
│  │  - validate_file_size()                                      │   │
│  │  - file_to_base64()                                          │   │
│  │  - detect_mime_type()                                        │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│                    External Services                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Google Gemini API                                    │  │
│  │         - gemini-1.5-flash (text)                            │  │
│  │         - gemini-1.5-flash (vision)                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         MongoDB Database                                     │  │
│  │         - ai_chat_records collection                         │  │
│  │         - Stores chat history and metadata                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  User clicks upload button:             │
        │  🩺 Symptom / 💊 Prescription / 📊 Report │
        │  OR just types text                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND PROCESSING (app.js)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Capture:                               │
        │  - message (text input)                 │
        │  - upload_intent (button clicked)       │
        │  - file (if uploaded)                   │
        │  - chat_history (previous messages)     │
        │  - session_id (conversation ID)         │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Create FormData:                       │
        │  - Append all fields                    │
        │  - Convert history to JSON string       │
        │  - Add file if present                  │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  POST /api/v1/ai/chat-orchestrator      │
        │  with Authorization header              │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. API ENDPOINT (ai_routes.py)                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Authenticate user (JWT token)          │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Parse request:                         │
        │  - Extract message                      │
        │  - Extract upload_intent                │
        │  - Parse chat_history JSON              │
        │  - Process file if present              │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  If file present:                       │
        │  - Read file bytes                      │
        │  - Validate size                        │
        │  - Convert to base64                    │
        │  - Detect MIME type                     │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. ORCHESTRATOR SERVICE (chat_orchestrator.py)                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  process_chat_request()                 │
        │  - Receives all parameters              │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  _determine_agent()                     │
        │                                         │
        │  IF upload_intent == "symptom"          │
        │    → return "symptom"                   │
        │  ELIF upload_intent == "prescription"   │
        │    → return "prescription"              │
        │  ELIF upload_intent == "report"         │
        │    → return "report"                    │
        │  ELSE                                   │
        │    → return "symptom" (default)         │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Route to appropriate handler:          │
        │                                         │
        │  - _route_to_symptom_agent()            │
        │  - _route_to_prescription_agent()       │
        │  - _route_to_report_agent()             │
        │  - _route_to_general_chat()             │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. AGENT HANDLER (within orchestrator)                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Build context from chat history        │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Construct system prompt                │
        │  (agent-specific instructions)          │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Construct user prompt                  │
        │  - Include history context              │
        │  - Include current message              │
        │  - Add image instruction if file        │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. LLM SERVICE (llm_service.py)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  IF file_data present:                  │
        │    invoke_with_image()                  │
        │  ELSE:                                  │
        │    invoke()                             │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Call Google Gemini API                 │
        │  - Send system + user prompts           │
        │  - Include image if multimodal          │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Receive AI response                    │
        │  - Parse response text                  │
        │  - Handle errors gracefully             │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE FORMATTING (orchestrator)                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Format response:                       │
        │  {                                      │
        │    "answer": "AI response",             │
        │    "agent_used": "symptom_checker",     │
        │    "supports_actions": true,            │
        │    "suggested_actions": [               │
        │      {"label": "...", "action": "..."}  │
        │    ],                                   │
        │    "disclaimer": "..."                  │
        │  }                                      │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. DATABASE SAVE (ai_routes.py)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Save to MongoDB:                       │
        │  - user_id                              │
        │  - session_id                           │
        │  - message                              │
        │  - answer                               │
        │  - metadata (agent_used, intent, etc.)  │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. RETURN TO FRONTEND                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  JSON response with:                    │
        │  - answer (markdown)                    │
        │  - session_id                           │
        │  - agent_used                           │
        │  - suggested_actions                    │
        │  - disclaimer                           │
        │  - record_id                            │
        └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 10. FRONTEND RENDERING (app.js)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Remove typing indicator                │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Render AI response:                    │
        │  - Parse markdown with marked.js        │
        │  - Create chat bubble                   │
        │  - Add disclaimer if present            │
        │  - Add action buttons if present        │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Update state:                          │
        │  - Add to chat history                  │
        │  - Update session_id                    │
        │  - Clear file upload                    │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Scroll to bottom                       │
        │  Ready for next message                 │
        └─────────────────────────────────────────┘
```

---

## Component Interaction Matrix

```
┌──────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Component        │ Creates │ Reads   │ Updates │ Deletes │ Calls   │
├──────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Chat UI          │ FormData│ State   │ State   │ -       │ API     │
│ (app.js)         │ Messages│ History │ History │         │         │
├──────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ API Endpoint     │ Response│ Request │ -       │ -       │ Orch.   │
│ (ai_routes.py)   │ Record  │ Auth    │         │         │ File    │
│                  │         │         │         │         │ DB      │
├──────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Orchestrator     │ Response│ Intent  │ -       │ -       │ LLM     │
│ (orchestrator.py)│ Actions │ History │         │         │         │
├──────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ LLM Service      │ -       │ Prompts │ -       │ -       │ Gemini  │
│ (llm_service.py) │         │ Images  │         │         │ API     │
├──────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ File Service     │ Base64  │ Files   │ -       │ -       │ -       │
│ (file_service.py)│ MIME    │         │         │         │         │
└──────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT DATA                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Message    │    │ Upload Intent│    │     File     │
│   (string)   │    │   (string)   │    │   (binary)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   FormData      │
                  │   Package       │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  HTTP Request   │
                  │  (multipart)    │
                  └────────┬────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESSING                                     │
└─────────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Parse      │  │   Validate   │  │   Convert    │
│   Request    │  │   Auth       │  │   File       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Orchestrator   │
                 │  Routing Logic  │
                 └────────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Symptom    │  │ Prescription │  │   Report     │
│   Handler    │  │   Handler    │  │   Handler    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   LLM Service   │
                │   (Gemini API)  │
                └────────┬────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OUTPUT DATA                                    │
└─────────────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Answer     │  │   Actions    │  │  Disclaimer  │
│  (markdown)  │  │   (array)    │  │   (string)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  JSON Response  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Save to DB     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Return to UI   │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Render with    │
                │  Markdown       │
                └─────────────────┘
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND STATE (app.js)                          │
└─────────────────────────────────────────────────────────────────────┘

state = {
  user: {
    id: "user_123",
    name: "John Doe",
    role: "patient",
    email: "john@example.com"
  },
  
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  
  activeView: "ai-chat",
  
  chatHistory: [
    { role: "user", content: "I have a headache" },
    { role: "assistant", content: "Let me help you..." }
  ],
  
  session_id: "550e8400-e29b-41d4-a716-446655440000",
  
  currentUploadIntent: "symptom",  // "symptom" | "prescription" | "report" | "none"
  
  currentFile: File {
    name: "symptom.jpg",
    size: 245678,
    type: "image/jpeg"
  }
}

┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND STATE (MongoDB)                          │
└─────────────────────────────────────────────────────────────────────┘

ai_chat_records = {
  _id: ObjectId("..."),
  user_id: "user_123",
  session_id: "550e8400-e29b-41d4-a716-446655440000",
  question: "I have a headache",
  answer: "Let me help you...",
  metadata: {
    agent_used: "symptom_checker",
    upload_intent: "none",
    has_file: false
  },
  created_at: ISODate("2026-04-11T10:30:00Z")
}
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                                │
└─────────────────────────────────────────────────────────────────────┘

1. File Too Large
   ├─ Detected: API endpoint (file_service.validate_file_size)
   ├─ Response: HTTP 413 "File too large"
   └─ UI: Show error toast

2. Invalid File Type
   ├─ Detected: API endpoint (file_service.detect_mime_type)
   ├─ Response: HTTP 400 "Invalid file type"
   └─ UI: Show error toast

3. Authentication Failed
   ├─ Detected: API endpoint (get_current_user)
   ├─ Response: HTTP 401 "Unauthorized"
   └─ UI: Redirect to login

4. LLM API Error
   ├─ Detected: LLM service (invoke/invoke_with_image)
   ├─ Fallback: Use default response
   └─ UI: Show response with warning

5. Network Error
   ├─ Detected: Frontend (fetch)
   ├─ Response: Connection error
   └─ UI: Show error toast, retry option

6. Invalid JSON
   ├─ Detected: API endpoint (JSON parsing)
   ├─ Response: HTTP 400 "Invalid request"
   └─ UI: Show error toast

7. Database Error
   ├─ Detected: API endpoint (MongoDB operations)
   ├─ Response: HTTP 500 "Internal server error"
   └─ UI: Show error toast, data not saved
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Scalable and maintainable code
- ✅ Robust error handling
- ✅ Efficient data flow
- ✅ Secure authentication
- ✅ Graceful degradation
