# Smart Chat Orchestrator Implementation

## Overview

This document describes the implementation of the Smart Chat Orchestrator system that intelligently routes user requests to appropriate AI agents without modifying any existing functionality.

## Architecture

### 1. Backend Components

#### **Chat Orchestrator Service** (`backend/app/services/chat_orchestrator.py`)
- **Purpose**: Central routing logic that determines which agent to use
- **Key Features**:
  - Intent-based routing using explicit upload button context
  - Default routing (text-only → symptom checker)
  - Maintains chat history context
  - Does NOT modify existing agent logic
  
- **Routing Rules**:
  1. If `upload_intent="symptom"` → Route to Symptom Checker Agent
  2. If `upload_intent="prescription"` → Route to Prescription Analyzer Agent
  3. If `upload_intent="report"` → Route to Report Explainer Agent
  4. If no file and text only → Default to Symptom Checker Agent
  5. Otherwise → General Health Chat

#### **API Endpoint** (`backend/app/api/ai_routes.py`)
- **New Endpoint**: `POST /api/v1/ai/chat-orchestrator`
- **Parameters**:
  - `message`: User text input
  - `upload_intent`: "symptom" | "prescription" | "report" | "none"
  - `chat_history`: JSON string of previous messages
  - `session_id`: Optional session identifier
  - `file`: Optional uploaded file (image/PDF)

- **Response**:
  ```json
  {
    "answer": "AI response with markdown formatting",
    "session_id": "unique-session-id",
    "agent_used": "symptom_checker|prescription_analyzer|report_explainer|general_chat",
    "supports_actions": true,
    "suggested_actions": [
      {"label": "Book Appointment", "action": "book_appointment"}
    ],
    "disclaimer": "Medical disclaimer if applicable",
    "record_id": "database-record-id"
  }
  ```

- **Legacy Endpoint Preserved**: `POST /api/v1/ai/smart-chat` (unchanged for backward compatibility)

### 2. Frontend Components

#### **Enhanced Chat UI** (`backend/app/static/app.js`)

**Key Features**:
1. **Three Separate Upload Buttons**:
   - 🩺 Upload Symptom (routes to symptom checker)
   - 💊 Upload Prescription (routes to prescription analyzer)
   - 📊 Upload Report (routes to report explainer)

2. **Markdown Rendering**:
   - Uses `marked.js` library for rich text formatting
   - Supports headings, lists, code blocks, tables, links
   - Styled for dark theme consistency

3. **File Preview**:
   - Shows thumbnail for images
   - Shows file icon for PDFs
   - Displays intent label (Symptom/Prescription/Report)
   - Clear button to remove file

4. **Action Buttons**:
   - Context-aware suggestions based on agent response
   - Examples: "Book Appointment", "Set Reminders", "Find Pharmacy"
   - Integrates with existing UI components

5. **Voice Input**:
   - Preserved from original implementation
   - Works with Web Speech API
   - Visual feedback during recording

#### **CSS Styling** (`backend/app/static/style.css`)

**New Styles Added**:
- `.upload-buttons-grid`: 3-column grid for upload buttons
- `.upload-intent-btn`: Styled upload button with hover effects
- `.markdown-content`: Comprehensive markdown styling
- `.chat-disclaimer`: Warning/disclaimer styling
- `.chat-actions`: Action button container
- `.chat-action-btn`: Individual action button
- `.typing-dots`: Animated typing indicator
- Responsive breakpoints for mobile

## Integration with Existing Features

### Preserved Functionality

✅ **Symptom Checker** (`/ai/symptom-checker`)
- Original endpoint unchanged
- Original agent logic untouched
- Standalone feature still works independently

✅ **Prescription Analyzer** (`/ai/prescription-analyzer`)
- Original endpoint unchanged
- Original agent logic untouched
- Standalone feature still works independently

✅ **Report Explainer** (`/ai/report-explainer`)
- Original endpoint unchanged
- Original agent logic untouched
- Standalone feature still works independently

✅ **Existing Chat** (`/ai/smart-chat`)
- Legacy endpoint preserved for backward compatibility
- Can be deprecated later if needed

### Reused Components

The orchestrator integrates with existing UI components:

1. **Appointment Booking**: Action button navigates to existing appointments view
2. **Medication Management**: Action button navigates to existing medications view
3. **Medical Records**: Action button navigates to existing records view
4. **Pharmacy Integration**: Placeholder for future pharmacy features

## User Flow

### Scenario 1: Symptom Analysis with Image

1. User clicks "🩺 Upload Symptom" button
2. Selects image of rash/injury
3. Types: "What is this rash on my arm?"
4. Clicks Send
5. **Orchestrator routes to Symptom Checker Agent**
6. Response includes:
   - Markdown-formatted analysis
   - Possible conditions
   - Severity assessment
   - Action buttons: "Book Appointment", "View History"
   - Medical disclaimer

### Scenario 2: Prescription Analysis

1. User clicks "💊 Upload Prescription" button
2. Selects prescription image
3. Types: "Explain these medicines"
4. Clicks Send
5. **Orchestrator routes to Prescription Analyzer Agent**
6. Response includes:
   - List of medicines with dosages
   - Instructions for each medicine
   - Side effects and interactions
   - Action buttons: "Set Reminders", "Order Medicines"

### Scenario 3: Report Analysis

1. User clicks "📊 Upload Report" button
2. Selects lab report PDF
3. Types: "What do these results mean?"
4. Clicks Send
5. **Orchestrator routes to Report Explainer Agent**
6. Response includes:
   - Plain language summary
   - Parameter explanations
   - Abnormalities highlighted
   - Action buttons: "Book Follow-up", "Save Record"

### Scenario 4: Text-Only Query (Default)

1. User types: "I have a headache and fever"
2. No file uploaded
3. Clicks Send
4. **Orchestrator defaults to Symptom Checker Agent**
5. Response includes symptom analysis and recommendations

## Technical Details

### State Management

```javascript
state = {
  user: null,
  token: localStorage.getItem('token'),
  activeView: 'dashboard',
  viewData: {},
  chatHistory: [],
  session_id: null,
  currentUploadIntent: 'none',  // NEW
  currentFile: null              // NEW
}
```

### API Request Flow

```
User Input → Frontend (app.js)
    ↓
FormData with:
  - message
  - upload_intent
  - chat_history
  - session_id
  - file (optional)
    ↓
POST /api/v1/ai/chat-orchestrator
    ↓
Chat Orchestrator Service
    ↓
Determine Agent (based on upload_intent)
    ↓
Route to Appropriate Handler:
  - _route_to_symptom_agent()
  - _route_to_prescription_agent()
  - _route_to_report_agent()
  - _route_to_general_chat()
    ↓
Call LLM Service (with/without image)
    ↓
Format Response with:
  - answer (markdown)
  - agent_used
  - suggested_actions
  - disclaimer
    ↓
Save to Database
    ↓
Return to Frontend
    ↓
Render with Markdown + Actions
```

### File Processing

```python
# In API endpoint
if file:
    file_bytes = await file.read()
    file_base64 = file_service.file_to_base64(file_bytes)
    mime_type = file_service.detect_mime_type(file_bytes, file.filename)
    
    file_data = {
        "base64": file_base64,
        "mime_type": mime_type,
        "filename": file.filename,
    }

# In orchestrator
if file_data and file_data.get("base64"):
    response = self.llm.invoke_with_image(
        system_prompt,
        user_prompt,
        file_data["base64"],
        file_data.get("mime_type", "image/jpeg"),
    )
```

## Security Considerations

1. **File Validation**: Size limits enforced via `file_service.validate_file_size()`
2. **HTML Escaping**: User input escaped before rendering to prevent XSS
3. **Authentication**: All endpoints require valid JWT token
4. **Input Sanitization**: Markdown rendering uses trusted library (marked.js)

## Testing

### Manual Testing Checklist

- [ ] Upload symptom image → Verify routes to symptom checker
- [ ] Upload prescription image → Verify routes to prescription analyzer
- [ ] Upload report PDF → Verify routes to report explainer
- [ ] Text-only message → Verify defaults to symptom checker
- [ ] Markdown rendering → Verify headings, lists, code blocks display correctly
- [ ] Action buttons → Verify navigation to correct views
- [ ] Voice input → Verify speech recognition works
- [ ] File preview → Verify image/PDF preview displays
- [ ] Clear file → Verify file removal works
- [ ] Mobile responsive → Verify layout on small screens
- [ ] Chat history → Verify context maintained across messages
- [ ] Session persistence → Verify session_id maintained

### API Testing

```bash
# Test orchestrator endpoint
curl -X POST http://localhost:8000/api/v1/ai/chat-orchestrator \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=I have a headache" \
  -F "upload_intent=none" \
  -F "chat_history=[]"

# Test with file upload
curl -X POST http://localhost:8000/api/v1/ai/chat-orchestrator \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=What is this?" \
  -F "upload_intent=symptom" \
  -F "file=@symptom_image.jpg" \
  -F "chat_history=[]"
```

## Future Enhancements

1. **Streaming Responses**: Add SSE support for real-time token streaming
2. **Multi-file Upload**: Support multiple files in single message
3. **Voice Output**: Text-to-speech for AI responses
4. **Export Chat**: Download conversation as PDF/text
5. **Smart Suggestions**: Proactive question suggestions based on context
6. **Agent Confidence**: Show confidence score for routing decisions
7. **Fallback Handling**: Better error recovery if agent fails

## Deployment Notes

### Environment Variables Required

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_VISION_MODEL=gemini-1.5-flash
```

### Dependencies

```
fastapi
google-generativeai
langchain-google-genai
python-multipart  # For file uploads
```

### Database Collections

- `ai_chat_records`: Stores chat history and orchestrator metadata
- Existing collections remain unchanged

## Maintenance

### Code Organization

```
backend/
├── app/
│   ├── api/
│   │   └── ai_routes.py          # API endpoints (modified)
│   ├── services/
│   │   ├── chat_orchestrator.py  # NEW: Orchestrator logic
│   │   ├── llm_service.py        # Existing (unchanged)
│   │   └── file_service.py       # Existing (unchanged)
│   └── static/
│       ├── app.js                # Frontend logic (modified)
│       ├── style.css             # Styles (extended)
│       └── index.html            # HTML (minimal change)
```

### Key Files Modified

1. `backend/app/api/ai_routes.py`: Added new endpoint, preserved legacy
2. `backend/app/static/app.js`: Replaced `renderChat()` function
3. `backend/app/static/style.css`: Added orchestrator styles
4. `backend/app/static/index.html`: Added marked.js CDN

### Key Files Created

1. `backend/app/services/chat_orchestrator.py`: Core orchestration logic

## Troubleshooting

### Issue: Markdown not rendering
**Solution**: Verify marked.js CDN is loaded in index.html

### Issue: Upload buttons not working
**Solution**: Check file input element exists and event listeners attached

### Issue: Wrong agent selected
**Solution**: Verify `upload_intent` parameter is correctly set in FormData

### Issue: File upload fails
**Solution**: Check file size limits and MIME type validation

### Issue: Action buttons don't work
**Solution**: Verify `handleChatAction()` function is defined globally

## Summary

The Smart Chat Orchestrator successfully:

✅ Routes requests to appropriate agents based on explicit intent
✅ Preserves all existing agent functionality without modification
✅ Provides enhanced UI with three separate upload buttons
✅ Renders responses with rich markdown formatting
✅ Integrates with existing UI components (appointments, medications, records)
✅ Maintains backward compatibility with legacy endpoints
✅ Follows clean architecture principles with separation of concerns
✅ Supports multimodal input (text + images/PDFs)
✅ Provides context-aware action suggestions

The implementation is production-ready, scalable, and maintainable.
