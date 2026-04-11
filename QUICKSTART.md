# 🚀 Quick Start Guide - Prescription Schedule Feature

## Prerequisites

- Python 3.9+
- MongoDB (running locally or remote)
- Google Gemini API Key

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Configure Environment

Create or update `backend/.env`:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_VISION_MODEL=gemini-2.0-flash

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nextgen_health

# JWT (for authentication)
JWT_SECRET=your-secret-key-here

# CORS (for frontend)
CORS_ORIGINS=http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000

# File Upload
MAX_UPLOAD_SIZE_MB=10
```

### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and paste it in `.env`

## Step 3: Start MongoDB

### Option A: Local MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Option B: MongoDB Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Step 4: Test the Setup

```bash
cd backend
python test_prescription_schedule.py
```

Expected output:
```
============================================================
🏥 NextGen Health - Prescription Schedule Feature Tests
============================================================

🔍 Testing LLM Service Configuration...
✅ LLM service is enabled

🔍 Testing Database Connection...
✅ MongoDB connection successful

🔍 Testing Prescription Extraction...
✅ Prescription extraction successful!

📊 Results:
   Total medicines: 3
   Summary: You have 3 medicines to take...

💊 Extracted Medicines:
   1. Amoxicillin
      Dosage: 500mg
      Frequency: 3x per day
      Duration: 7 days
      Timing: 08:00, 14:00, 20:00
      Instructions: Take after meals

============================================================
📋 Test Summary
============================================================
✅ PASS - LLM Service
✅ PASS - Database Connection
✅ PASS - Prescription Extraction

🎯 Results: 3/3 tests passed

🎉 All tests passed! The prescription schedule feature is ready to use.
```

## Step 5: Start the Backend Server

```bash
cd backend
python app/main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 6: Access the Frontend

Open your browser and navigate to:

```
http://localhost:8000/web/
```

## Step 7: Test the Feature

1. **Upload a Prescription**
   - Click the upload area or drag and drop a prescription image
   - Supported formats: JPG, PNG, WEBP, PDF

2. **Analyze**
   - Click "Analyze Prescription"
   - Wait 3-5 seconds for AI processing

3. **View Schedule**
   - See your personalized medication schedule
   - View next upcoming dose
   - Check timing for each medicine

4. **Track Adherence**
   - Click "✓ Mark as Taken" when you take a medicine
   - Click "✗ Skipped" if you miss a dose

## API Testing (Optional)

### Test with cURL

```bash
# Create a test prescription image or use an existing one
curl -X POST http://localhost:8000/api/v1/ai/prescription-schedule \
  -F "prescription_file=@/path/to/prescription.jpg" \
  -F "prescription_text=" \
  -F "image_description="
```

### Test with Python

```python
import requests

url = "http://localhost:8000/api/v1/ai/prescription-schedule"

with open("prescription.jpg", "rb") as f:
    files = {"prescription_file": f}
    data = {
        "prescription_text": "",
        "image_description": ""
    }
    
    response = requests.post(url, files=files, data=data)
    print(response.json())
```

## Troubleshooting

### Issue: "LLM service is not enabled"

**Solution:**
- Check if `GEMINI_API_KEY` is set in `.env`
- Verify the API key is valid
- Ensure `.env` file is in the `backend/` directory

### Issue: "MongoDB connection failed"

**Solution:**
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify `MONGODB_URI` in `.env`
- Try: `mongodb://localhost:27017` or `mongodb://127.0.0.1:27017`

### Issue: "Module not found"

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or change the port in main.py
uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
```

### Issue: "CORS error in browser"

**Solution:**
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart the backend server

### Issue: "File too large"

**Solution:**
- Compress the image before upload
- Increase `MAX_UPLOAD_SIZE_MB` in `.env`

## Sample Prescription Format

For testing, create a text file with this format:

```
Dr. Sarah Johnson, MD
General Medicine

Patient: John Doe
Date: April 11, 2026

Rx:
1. Amoxicillin 500mg - TDS x 7 days (Take after meals)
2. Paracetamol 650mg - BD x 5 days (For fever)
3. Vitamin D3 60000 IU - Once weekly x 8 weeks

Signature: Dr. Sarah Johnson
```

Or use any real prescription image (ensure it's clear and readable).

## Next Steps

- ✅ Feature is working? Great! Try uploading different prescriptions
- 📱 Want mobile access? The interface is fully responsive
- 🔐 Need authentication? Check the auth routes in `backend/app/api/auth_routes.py`
- 📊 Want analytics? Extend the adherence tracking features
- 🔔 Need reminders? Integrate with notification service

## Support

For issues or questions:
1. Check the logs in the terminal where the server is running
2. Review `PRESCRIPTION_SCHEDULE_FEATURE.md` for detailed documentation
3. Check the API docs at `http://localhost:8000/api/docs`

---

**Happy coding! 🎉**
