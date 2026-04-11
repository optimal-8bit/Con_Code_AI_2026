# Unified Smart Health Chat - Quick Setup Guide

## Prerequisites

- Backend server running (Python FastAPI)
- Frontend server running (React + Vite)
- MongoDB database connected
- Google Gemini API key configured (for AI features)

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install new dependency (if not already installed)
pip install langgraph

# Verify the unified chat agent is in place
ls agents/unified_chat_agent.py

# Restart backend server
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd Web

# No new dependencies needed (all already installed)

# Verify the new component exists
ls src/pages/ai/UnifiedSmartChat.jsx

# Restart frontend server
npm run dev
```

### 3. Verify Installation

1. **Check Backend**
   ```bash
   curl http://localhost:8000/docs
   # Look for /ai/smart-chat endpoint
   ```

2. **Check Frontend**
   - Navigate to `http://localhost:5173`
   - Login as a patient
   - Go to `/ai/smart-chat`
   - You should see the unified chat interface

## Configuration

### Backend Configuration

**File**: `backend/agents/unified_chat_agent.py`

Customize intent detection keywords:
```python
# Symptom keywords
symptom_keywords = ["symptom", "pain", "fever", "headache", "cough", "sick"]

# Appointment keywords
appointment_keywords = ["appointment", "book", "schedule", "doctor", "visit"]

# Report keywords
report_keywords = ["report", "test result", "lab", "blood test", "scan"]

# Prescription keywords
prescription_keywords = ["prescription", "medicine", "medication", "drug", "pill"]
```

### Frontend Configuration

**File**: `Web/src/pages/ai/UnifiedSmartChat.jsx`

Customize quick actions:
```javascript
const quickActions = [
  { icon: AlertCircle, label: 'Check Symptoms', message: 'I have some symptoms I want to check' },
  { icon: Calendar, label: 'Book Appointment', message: 'I want to book an appointment' },
  { icon: FileText, label: 'Analyze Report', message: 'I have a medical report to analyze' },
  { icon: Pill, label: 'Process Prescription', message: 'I have a prescription to process' },
];
```

## Testing

### 1. Test Symptom Analysis
```
Input: "I have a severe headache and fever"
Expected: Symptom analysis with doctor recommendations
```

### 2. Test Prescription Upload
```
Action: Upload prescription image
Expected: Medicine extraction with reminders and pharmacy options
```

### 3. Test Report Upload
```
Action: Upload blood test report
Expected: Report analysis with abnormal values highlighted
```

### 4. Test General Chat
```
Input: "What is diabetes?"
Expected: Informative response with follow-up suggestions
```

## Troubleshooting

### Issue: "Module 'langgraph' not found"
**Solution:**
```bash
pip install langgraph
```

### Issue: "UnifiedChatAgent not found"
**Solution:**
```bash
# Verify file exists
ls backend/agents/unified_chat_agent.py

# Check imports in ai_routes.py
grep "UnifiedChatAgent" backend/app/api/ai_routes.py
```

### Issue: "Route not found" (404)
**Solution:**
```bash
# Verify route is registered
grep "smart-chat" Web/src/App.jsx

# Check if component is imported
grep "UnifiedSmartChat" Web/src/App.jsx
```

### Issue: File upload not working
**Solution:**
- Check file size (max 10MB)
- Check file type (images, PDFs only)
- Verify backend file handling in `file_service.py`

### Issue: Intent detection not working
**Solution:**
- Check LLM service is enabled
- Verify API key is configured
- Check backend logs for errors

### Issue: Actions not navigating
**Solution:**
- Verify routes exist in `App.jsx`
- Check navigation paths in `handleAction` function
- Verify user has required permissions

## Environment Variables

Ensure these are set in `backend/.env`:
```env
# Required for AI features
GOOGLE_API_KEY=your_gemini_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nextgen_health

# JWT
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
```

## File Structure

```
backend/
├── agents/
│   ├── unified_chat_agent.py          # NEW: Unified chat agent
│   ├── base_agent.py
│   └── chat_agent.py
├── app/
│   └── api/
│       └── ai_routes.py               # UPDATED: Enhanced smart-chat endpoint
└── ...

Web/
├── src/
│   ├── pages/
│   │   └── ai/
│   │       ├── UnifiedSmartChat.jsx   # NEW: Unified chat UI
│   │       ├── SmartChat.jsx          # OLD: Basic chat
│   │       └── ...
│   └── App.jsx                        # UPDATED: Added new route
└── ...
```

## API Endpoints

### POST /ai/smart-chat
**Description**: Unified chat endpoint with intent detection

**Request:**
```json
{
  "question": "I have a headache",
  "chat_history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"}
  ],
  "session_id": "optional-session-id",
  "report_context": "",
  "medical_history": "",
  "context_type": "general"
}
```

**Response:**
```json
{
  "answer": "Based on your symptoms...",
  "session_id": "session-123",
  "follow_up_questions": [
    "How long have you had this headache?",
    "Is it accompanied by other symptoms?"
  ],
  "sources": ["action:book_appointment", "action:upload_image"],
  "disclaimer": "This is AI analysis...",
  "record_id": "record-456"
}
```

### POST /ai/symptom-checker
**Description**: Symptom analysis with image support

### POST /ai/prescription-schedule
**Description**: Prescription extraction with schedule

### POST /ai/report-explainer
**Description**: Medical report analysis

## Navigation Routes

```javascript
// Patient routes
/ai/smart-chat              // NEW: Unified chat
/ai/chat                    // OLD: Basic chat
/patient/appointments       // Appointment booking
/patient/medications        // Medication schedule
/patient/pharmacy-order     // Pharmacy ordering
/patient/records            // Medical records
```

## Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend
cd Web
npm run dev

# Terminal 3: Monitor Logs (optional)
cd backend
tail -f logs/app.log
```

## Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Unified Chat**: http://localhost:5173/ai/smart-chat

## Default Test Credentials

```
Patient:
Email: patient@test.com
Password: password123

Doctor:
Email: doctor@test.com
Password: password123

Pharmacy:
Email: pharmacy@test.com
Password: password123
```

## Sample Test Files

Prepare these files for testing:

1. **Prescription Image**: Any prescription (handwritten or printed)
2. **Blood Test Report**: PDF or image of lab results
3. **Symptom Photo**: Image showing visible symptoms (rash, injury, etc.)

## Performance Tips

1. **Backend**: Use caching for repeated queries
2. **Frontend**: Lazy load images, debounce input
3. **Database**: Index frequently queried fields
4. **API**: Use connection pooling
5. **Files**: Compress images before upload

## Security Checklist

- [ ] API authentication enabled
- [ ] File size limits enforced (10MB)
- [ ] File type validation active
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] HTTPS enabled (production)
- [ ] Rate limiting configured
- [ ] Input sanitization active

## Deployment Notes

### Production Deployment

1. **Backend**:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Frontend**:
   ```bash
   npm run build
   # Serve dist/ folder with nginx or similar
   ```

3. **Environment**:
   - Set production environment variables
   - Use production database
   - Enable HTTPS
   - Configure CDN for static files

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review implementation guide: `UNIFIED_SMART_CHAT_IMPLEMENTATION.md`
3. Check demo script: `UNIFIED_CHAT_DEMO_SCRIPT.md`
4. Review backend logs: `backend/logs/`
5. Check browser console for frontend errors

## Next Steps

After setup:
1. Test all features thoroughly
2. Customize intent keywords for your use case
3. Add more quick actions if needed
4. Configure production environment
5. Prepare demo presentation
6. Train team on features

## Success Indicators

✅ Chat interface loads without errors  
✅ File upload works correctly  
✅ Intent detection is accurate  
✅ Action buttons navigate properly  
✅ All integrations work seamlessly  
✅ Responses are formatted correctly  
✅ Loading states display properly  
✅ Error handling works gracefully  

## Congratulations!

Your Unified Smart Health Chat is now ready to use! 🎉

This single interface now handles:
- ✅ Symptom checking
- ✅ Appointment booking
- ✅ Report analysis
- ✅ Prescription processing
- ✅ Pharmacy ordering
- ✅ General health questions

All through natural conversation! 🚀
