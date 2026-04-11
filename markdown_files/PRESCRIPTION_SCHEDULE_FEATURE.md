# 💊 Prescription Schedule Feature

## Overview

This feature allows users to upload a photo of a doctor's prescription and instantly understand what medicines they need to take and when. The system uses AI to analyze prescriptions, extract medicine information, and create a structured daily medication schedule.

## Features

### 🎯 Core Functionality

1. **Prescription Upload & Analysis**
   - Upload prescription images (JPG, PNG, WEBP) or PDFs
   - AI-powered OCR and text extraction
   - Handles both handwritten and printed prescriptions
   - Extracts medicine names, dosages, frequency, and duration

2. **Smart Schedule Generation**
   - Converts medical abbreviations (BD → twice daily, TDS → thrice daily, etc.)
   - Generates specific timing for each medicine
   - Standard timing conventions:
     - Once daily: 08:00
     - Twice daily: 08:00, 20:00
     - Thrice daily: 08:00, 14:00, 20:00
     - Four times daily: 08:00, 12:00, 16:00, 20:00

3. **Next Dose Tracking**
   - Highlights the next upcoming dose across all medicines
   - Real-time calculation based on current time
   - Prominent display with medicine details

4. **Medication Adherence**
   - Mark medicines as "taken" or "skipped"
   - Track medication compliance
   - Historical adherence logs

5. **User-Friendly Interface**
   - Clean, intuitive medicine cards
   - Visual timing indicators
   - Special instructions highlighted
   - Responsive design for mobile and desktop

## API Endpoints

### 1. Analyze Prescription & Generate Schedule

**POST** `/api/v1/ai/prescription-schedule`

Upload a prescription and get a structured medication schedule.

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/prescription-schedule \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "prescription_file=@prescription.jpg" \
  -F "prescription_text=" \
  -F "image_description="
```

**Response:**
```json
{
  "medicines": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "times_per_day": 3,
      "duration_days": 7,
      "timing": ["08:00", "14:00", "20:00"],
      "instructions": "Take after meals",
      "next_dose": "14:00"
    }
  ],
  "schedule_summary": "You have 3 medicines to take. Follow the schedule below for the next 7 days.",
  "total_medicines": 3,
  "next_upcoming_dose": {
    "medicine": "Amoxicillin",
    "dosage": "500mg",
    "time": "14:00",
    "instructions": "Take after meals"
  },
  "record_id": "507f1f77bcf86cd799439011"
}
```

### 2. Get User's Prescription Schedules

**GET** `/api/v1/ai/prescription-schedules`

Retrieve all prescription schedules for the authenticated user.

**Request:**
```bash
curl -X GET http://localhost:8000/api/v1/ai/prescription-schedules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Log Medication Adherence

**POST** `/api/v1/ai/medication-adherence`

Log when a user takes or skips a medication.

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/medication-adherence \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "medicine_name=Amoxicillin" \
  -F "scheduled_time=08:00" \
  -F "status=taken"
```

**Response:**
```json
{
  "success": true,
  "message": "Medication taken",
  "record_id": "507f1f77bcf86cd799439012"
}
```

## Database Schema

### prescription_schedules Collection
```javascript
{
  "_id": ObjectId,
  "user_id": "string",
  "input": {
    "prescription_text": "string",
    "file_url": "/uploads/prescriptions/abc123.jpg"
  },
  "output": {
    "medicines": [...],
    "schedule_summary": "string",
    "total_medicines": 3,
    "next_upcoming_dose": {...}
  },
  "created_at": ISODate
}
```

### medication_adherence_logs Collection
```javascript
{
  "_id": ObjectId,
  "user_id": "string",
  "medicine_name": "Amoxicillin",
  "scheduled_time": "08:00",
  "taken_at": ISODate,
  "status": "taken|skipped|pending",
  "logged_at": ISODate
}
```

## Frontend Interface

### Location
`backend/web/index.html`

### Access
Navigate to: `http://localhost:8000/web/`

### Features
- Drag-and-drop prescription upload
- Real-time image preview
- Loading states with spinner
- Next dose banner with prominent display
- Medicine cards with:
  - Medicine name and dosage
  - Daily schedule with time pills
  - Duration and frequency
  - Special instructions
  - Adherence tracking buttons
- Responsive design for all devices

## Setup & Usage

### 1. Backend Setup

Ensure your backend is running:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/main.py
```

### 2. Environment Variables

Make sure `.env` file has:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nextgen_health
```

### 3. Access the Interface

Open your browser and navigate to:
```
http://localhost:8000/web/
```

### 4. Upload a Prescription

1. Click the upload area or drag and drop a prescription image
2. Click "Analyze Prescription"
3. Wait for AI analysis (typically 3-5 seconds)
4. View your personalized medication schedule

### 5. Track Adherence

- Click "✓ Mark as Taken" when you take a medicine
- Click "✗ Skipped" if you miss a dose
- View your adherence history (requires authentication)

## AI Prompt Engineering

The system uses a specialized prompt to extract prescription data:

```
You are a clinical pharmacist AI specializing in prescription interpretation.
Extract medicine information from handwritten or printed prescriptions accurately.
Convert medical abbreviations (e.g., 'BD' = twice daily, 'TDS' = thrice daily).
Create a clear, patient-friendly medication schedule with specific times.
```

### Medical Abbreviations Handled
- **OD/QD**: Once daily
- **BD/BID**: Twice daily
- **TDS/TID**: Thrice daily (three times daily)
- **QID**: Four times daily
- **PRN**: As needed
- **AC**: Before meals
- **PC**: After meals
- **HS**: At bedtime

## Benefits

### For Patients
- ✅ Clear understanding of medication schedule
- ✅ Reduced confusion about dosing
- ✅ Prevention of missed doses
- ✅ Easy adherence tracking
- ✅ Visual reminders for next dose

### For Healthcare Providers
- ✅ Improved patient compliance
- ✅ Reduced medication errors
- ✅ Better treatment outcomes
- ✅ Digital prescription records

## Technical Stack

- **Backend**: FastAPI (Python)
- **AI**: Google Gemini 2.0 Flash (Vision + Text)
- **Database**: MongoDB
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **File Processing**: PyMuPDF (PDF), PIL (Images)

## Future Enhancements

- [ ] Push notifications for upcoming doses
- [ ] Calendar integration
- [ ] Medication interaction warnings
- [ ] Pharmacy integration for refills
- [ ] Multi-language support
- [ ] Voice reminders
- [ ] Family member monitoring
- [ ] Medication history analytics
- [ ] Export schedule as PDF/Calendar

## Security Considerations

- All prescription images are stored securely
- User authentication required for adherence tracking
- HIPAA compliance considerations for production
- Encrypted file storage recommended
- Audit logs for all medication records

## Testing

### Manual Testing

1. **Test with Sample Prescription**
   - Use a clear prescription image
   - Verify all medicines are extracted
   - Check timing accuracy

2. **Test Edge Cases**
   - Handwritten prescriptions
   - Multiple medicines
   - Complex dosing schedules
   - Special instructions

3. **Test Adherence Tracking**
   - Mark medicines as taken
   - Skip doses
   - Verify logs are created

### API Testing

```bash
# Test prescription analysis
curl -X POST http://localhost:8000/api/v1/ai/prescription-schedule \
  -F "prescription_file=@test_prescription.jpg"

# Test adherence logging
curl -X POST http://localhost:8000/api/v1/ai/medication-adherence \
  -F "medicine_name=Test Medicine" \
  -F "scheduled_time=08:00" \
  -F "status=taken"
```

## Troubleshooting

### Issue: "Failed to analyze prescription"
- **Solution**: Ensure backend server is running on port 8000
- Check GEMINI_API_KEY is set in .env
- Verify MongoDB is running

### Issue: "File too large"
- **Solution**: Compress image before upload
- Maximum file size: 10MB (configurable in settings)

### Issue: "Unable to extract medicine name"
- **Solution**: Ensure prescription image is clear and well-lit
- Try uploading a higher resolution image
- Manually enter prescription text if OCR fails

## License

Part of NextGen Health Platform - AI-Driven Healthcare System

---

**Note**: This feature uses AI for prescription analysis. Always verify extracted information with your healthcare provider. This tool is for informational purposes and does not replace professional medical advice.
