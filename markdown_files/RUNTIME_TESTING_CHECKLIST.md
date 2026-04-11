# ✅ Runtime Testing Checklist

**Purpose:** Validate frontend-backend integration with actual runtime testing  
**Status:** Ready to execute  
**Estimated Time:** 30-45 minutes

---

## 🚀 PRE-TESTING SETUP

### 1. Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**✅ Verify:**
- [ ] Server starts without errors
- [ ] Console shows: `Uvicorn running on http://127.0.0.1:8000`
- [ ] No import errors
- [ ] MongoDB connection successful

### 2. Start Frontend Server
```bash
cd Web
npm run dev
```

**✅ Verify:**
- [ ] Vite starts without errors
- [ ] Console shows: `Local: http://localhost:5173/`
- [ ] No build errors
- [ ] No missing dependencies

### 3. Open Browser DevTools
- [ ] Open `http://localhost:5173`
- [ ] Press F12 to open DevTools
- [ ] Go to Network tab
- [ ] Enable "Preserve log"
- [ ] Clear existing logs

---

## 🔐 AUTHENTICATION TESTING

### Test 1: Patient Login
**Steps:**
1. Navigate to `/login`
2. Enter: `patient@test.com` / `password123`
3. Click "Login"

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/auth/login`
- [ ] Status: 200 OK
- [ ] Response contains: `access_token`, `refresh_token`, `user`
- [ ] Redirects to `/patient/dashboard`
- [ ] No console errors

**❌ If Failed:**
- Check backend logs for errors
- Verify MongoDB is running
- Verify test data was seeded

---

### Test 2: Token Refresh
**Steps:**
1. Stay logged in
2. Wait for token to expire (or manually delete access_token from localStorage)
3. Make any API call (e.g., refresh dashboard)

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/auth/refresh`
- [ ] Status: 200 OK
- [ ] New tokens received
- [ ] Original request retried successfully
- [ ] No logout/redirect

**❌ If Failed:**
- Check `api-client.js` interceptor logic
- Verify refresh token is valid

---

## 🏥 PATIENT FEATURES TESTING

### Test 3: Patient Dashboard
**Steps:**
1. Login as patient
2. View dashboard

**✅ Expected Results:**
- [ ] Network request: `GET http://localhost:8000/api/v1/patient/dashboard`
- [ ] Status: 200 OK
- [ ] Dashboard displays:
  - [ ] Metrics cards
  - [ ] Upcoming appointments
  - [ ] Active medications
  - [ ] Recent prescriptions
  - [ ] Notifications
  - [ ] AI health summary
- [ ] No console errors

---

### Test 4: Symptom Checker
**Steps:**
1. Navigate to `/ai/symptom-checker`
2. Fill in:
   - Symptoms: "Headache and fever for 3 days"
   - Age: 30
   - Gender: Male
   - Duration: 3
3. Click "Analyze Symptoms"

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/ai/symptom-checker`
- [ ] Request Content-Type: `multipart/form-data`
- [ ] Status: 200 OK
- [ ] Response contains:
  - [ ] `possible_conditions` array
  - [ ] `severity` field
  - [ ] `next_steps` array
  - [ ] `disclaimer` text
- [ ] Results display correctly
- [ ] No console errors

**❌ If Failed:**
- Check if LLM service is enabled
- Check backend logs for AI service errors
- Verify FormData is sent correctly

---

### Test 5: Prescription Analyzer
**Steps:**
1. Navigate to `/ai/prescription-analyzer`
2. Upload a prescription image OR paste text
3. Fill optional fields (age, conditions)
4. Click "Analyze Prescription"

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/ai/prescription-analyzer`
- [ ] Request Content-Type: `multipart/form-data`
- [ ] Status: 200 OK
- [ ] Response contains:
  - [ ] `medicines` array with details
  - [ ] `summary_instructions`
  - [ ] `drug_interactions`
- [ ] Results display correctly
- [ ] No console errors

---

### Test 6: Report Explainer
**Steps:**
1. Navigate to `/ai/report-explainer`
2. Upload a medical report image OR paste text
3. Select report type
4. Click "Explain Report"

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/ai/report-explainer`
- [ ] Request Content-Type: `multipart/form-data`
- [ ] Status: 200 OK
- [ ] Response contains:
  - [ ] `plain_language_summary`
  - [ ] `parameters` array
  - [ ] `urgency` field
  - [ ] `actionable_insights`
- [ ] Results display correctly
- [ ] No console errors

---

### Test 7: Smart Chat
**Steps:**
1. Navigate to `/ai/smart-chat`
2. Type: "What are the symptoms of diabetes?"
3. Press Send

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/ai/smart-chat`
- [ ] Request Content-Type: `application/json`
- [ ] Status: 200 OK
- [ ] Response contains:
  - [ ] `answer` text
  - [ ] `session_id`
  - [ ] `follow_up_questions` array
  - [ ] `disclaimer`
- [ ] Message displays in chat
- [ ] Follow-up questions are clickable
- [ ] No console errors

---

### Test 8: Book Appointment
**Steps:**
1. Navigate to `/patient/appointments`
2. Click "Book Appointment"
3. Select doctor, date, time, reason
4. Submit

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/patient/appointments`
- [ ] Request Content-Type: `application/json`
- [ ] Status: 201 Created
- [ ] Appointment appears in list
- [ ] Doctor receives notification
- [ ] No console errors

---

### Test 9: Upload Medical Record
**Steps:**
1. Navigate to `/patient/records`
2. Click "Upload Record"
3. Fill title, type, upload file
4. Submit

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/patient/records`
- [ ] Request Content-Type: `multipart/form-data`
- [ ] Status: 201 Created
- [ ] Record appears in list
- [ ] File is saved to backend
- [ ] No console errors

---

## 👨‍⚕️ DOCTOR FEATURES TESTING

### Test 10: Doctor Login & Dashboard
**Steps:**
1. Logout
2. Login as: `doctor1@test.com` / `password123`
3. View dashboard

**✅ Expected Results:**
- [ ] Login successful
- [ ] Redirects to `/doctor/dashboard`
- [ ] Network request: `GET http://localhost:8000/api/v1/doctor/dashboard`
- [ ] Dashboard displays:
  - [ ] Today's appointments
  - [ ] Pending appointments
  - [ ] Recent patients
  - [ ] Metrics
- [ ] No console errors

---

### Test 11: Update Appointment Status
**Steps:**
1. View appointments
2. Click on pending appointment
3. Change status to "Confirmed"
4. Save

**✅ Expected Results:**
- [ ] Network request: `PATCH http://localhost:8000/api/v1/doctor/appointments/{id}`
- [ ] Status: 200 OK
- [ ] Appointment status updates
- [ ] Patient receives notification
- [ ] No console errors

---

### Test 12: Issue Prescription
**Steps:**
1. View patient details
2. Click "Issue Prescription"
3. Add medicines with dosage, frequency, duration
4. Submit

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/doctor/prescriptions`
- [ ] Status: 201 Created
- [ ] Prescription created
- [ ] Patient receives notification
- [ ] No console errors

---

## 💊 PHARMACY FEATURES TESTING

### Test 13: Pharmacy Login & Dashboard
**Steps:**
1. Logout
2. Login as: `pharmacy1@test.com` / `password123`
3. View dashboard

**✅ Expected Results:**
- [ ] Login successful
- [ ] Redirects to `/pharmacy/dashboard`
- [ ] Network request: `GET http://localhost:8000/api/v1/pharmacy/dashboard`
- [ ] Dashboard displays:
  - [ ] Pending orders
  - [ ] Inventory items
  - [ ] Low stock alerts
  - [ ] Metrics
- [ ] No console errors

---

### Test 14: Update Order Status
**Steps:**
1. View orders
2. Click on pending order
3. Change status to "Preparing"
4. Save

**✅ Expected Results:**
- [ ] Network request: `PATCH http://localhost:8000/api/v1/pharmacy/orders/{id}/status`
- [ ] Status: 200 OK
- [ ] Order status updates
- [ ] Patient receives notification
- [ ] No console errors

---

### Test 15: Manage Inventory
**Steps:**
1. Navigate to inventory
2. Update stock quantity for an item
3. Save

**✅ Expected Results:**
- [ ] Network request: `PATCH http://localhost:8000/api/v1/pharmacy/inventory/{id}/quantity`
- [ ] Status: 200 OK
- [ ] Quantity updates
- [ ] Low stock alert triggers if below threshold
- [ ] No console errors

---

## 🔍 ERROR HANDLING TESTING

### Test 16: Invalid Login
**Steps:**
1. Logout
2. Try login with: `wrong@email.com` / `wrongpassword`

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/auth/login`
- [ ] Status: 401 Unauthorized
- [ ] Error message displays: "Invalid email or password"
- [ ] No console errors
- [ ] User stays on login page

---

### Test 17: Unauthorized Access
**Steps:**
1. Logout
2. Try to access: `http://localhost:5173/patient/dashboard`

**✅ Expected Results:**
- [ ] Redirects to `/login`
- [ ] No API calls made
- [ ] No console errors

---

### Test 18: File Too Large
**Steps:**
1. Login as patient
2. Try to upload a file > 10MB to symptom checker

**✅ Expected Results:**
- [ ] Network request: `POST http://localhost:8000/api/v1/ai/symptom-checker`
- [ ] Status: 413 Payload Too Large
- [ ] Error message displays: "File too large"
- [ ] No console errors

---

## 📊 INTEGRATION HEALTH CHECK

### Network Tab Analysis
**✅ All requests should:**
- [ ] Use correct base URL: `http://localhost:8000/api/v1`
- [ ] Include Authorization header (except login/register)
- [ ] Use correct HTTP methods (GET, POST, PATCH, DELETE)
- [ ] Send correct Content-Type headers
- [ ] Receive valid JSON responses

### Console Tab Analysis
**✅ Console should:**
- [ ] Have no red errors
- [ ] Have no CORS errors
- [ ] Have no 404 errors
- [ ] Have no unhandled promise rejections

### Application Tab Analysis
**✅ LocalStorage should contain:**
- [ ] `access_token`
- [ ] `refresh_token`
- [ ] `user` (JSON string)

---

## 🎯 FINAL VALIDATION

### Overall System Health
- [ ] All 18 tests passed
- [ ] No critical errors in console
- [ ] No 500 errors from backend
- [ ] All features work as expected
- [ ] Token refresh works automatically
- [ ] File uploads work correctly
- [ ] Notifications are sent/received
- [ ] Role-based access control works

---

## 📝 ISSUE REPORTING

**If any test fails, document:**

1. **Test Number:** (e.g., Test 4)
2. **Feature:** (e.g., Symptom Checker)
3. **Steps to Reproduce:** (exact steps)
4. **Expected Result:** (what should happen)
5. **Actual Result:** (what actually happened)
6. **Network Request:** (URL, method, status code)
7. **Console Errors:** (copy exact error messages)
8. **Backend Logs:** (copy relevant backend logs)

---

## ✅ COMPLETION

**When all tests pass:**
- [ ] Mark this checklist as complete
- [ ] Document any edge cases found
- [ ] Update `INTEGRATION_STATUS_SUMMARY.md` with results
- [ ] Proceed to Step 8: Cleanup

**System is PRODUCTION READY when all checkboxes are marked ✅**

---

**Good luck with testing! 🚀**
