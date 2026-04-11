# Frontend Testing Guide

## 🧪 Complete Testing Workflow

This guide walks you through testing every feature of the frontend to ensure everything works correctly.

## 🚀 Prerequisites

1. **Backend Running**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend Running**
   ```bash
   cd Web
   npm run dev
   ```

3. **Browser Open**
   - Navigate to `http://localhost:5173`

## 📋 Test Scenarios

### 1. Authentication Flow

#### Test Registration
1. Go to `/register`
2. Fill in the form:
   - Name: "Test Patient"
   - Email: "patient@test.com"
   - Password: "password123"
   - Phone: "+1234567890"
   - Role: "Patient"
3. Click "Create Account"
4. ✅ Should redirect to `/patient/dashboard`
5. ✅ Should see welcome message with user name

#### Test Login
1. Logout from current session
2. Go to `/login`
3. Enter credentials:
   - Email: "patient@test.com"
   - Password: "password123"
4. Click "Sign In"
5. ✅ Should redirect to `/patient/dashboard`
6. ✅ Should see dashboard with metrics

#### Test Auto-Redirect
1. While logged in, try to access `/login`
2. ✅ Should redirect to dashboard
3. Logout
4. Try to access `/patient/dashboard`
5. ✅ Should redirect to `/login`

### 2. Patient Dashboard Tests

#### Dashboard Metrics
1. Login as patient
2. Go to `/patient/dashboard`
3. ✅ Should see 4 metric cards:
   - Total Appointments
   - Prescriptions
   - Active Medications
   - Notifications
4. ✅ Should see AI Health Summary (if available)
5. ✅ Should see upcoming appointments section
6. ✅ Should see active medications section

#### Navigation
1. Click on sidebar items
2. ✅ Each link should navigate correctly
3. ✅ Active page should be highlighted
4. ✅ Mobile menu should work on small screens

### 3. Appointments Tests

#### Book Appointment
1. Go to `/patient/appointments`
2. Click "Book Appointment"
3. Fill in the form:
   - Select a doctor
   - Choose date and time
   - Enter reason: "Regular checkup"
   - Add notes (optional)
4. Click "Book Appointment"
5. ✅ Should see success message
6. ✅ New appointment should appear in list
7. ✅ Status should be "pending"

#### Cancel Appointment
1. Find a pending appointment
2. Click "Cancel" button
3. Confirm cancellation
4. ✅ Appointment should be removed or status updated

### 4. Medical Records Tests

#### Upload Record
1. Go to `/patient/records`
2. Click "Upload Record"
3. Fill in the form:
   - Title: "Blood Test Results"
   - Type: "Lab Report"
   - Upload a file (image or PDF)
   - Add notes (optional)
4. Click "Upload"
5. ✅ Should see success message
6. ✅ New record should appear in list
7. ✅ Should be able to view file

### 5. Doctor Search Tests

#### Search Doctors
1. Go to `/patient/doctors`
2. Use search box to filter doctors
3. ✅ Should see filtered results
4. ✅ Should see doctor details:
   - Name
   - Specialty
   - Email
   - Phone

### 6. AI Features Tests

#### Symptom Checker
1. Go to `/ai/symptom-checker`
2. Fill in the form:
   - Symptoms: "Headache and fever for 2 days"
   - Age: 30
   - Gender: Male
   - Duration: 2 days
3. Optionally upload an image
4. Click "Analyze Symptoms"
5. ✅ Should see loading state
6. ✅ Should see analysis results:
   - Severity level
   - Possible conditions
   - Red flags (if any)
   - Next steps
   - Home care tips
   - Recommended specialist

#### Prescription Analyzer
1. Go to `/ai/prescription-analyzer`
2. Upload a prescription image or paste text
3. Fill in patient details (optional)
4. Click "Analyze Prescription"
5. ✅ Should see extracted medicines
6. ✅ Should see dosage instructions
7. ✅ Should see side effects
8. ✅ Should see drug interactions

#### Report Explainer
1. Go to `/ai/report-explainer`
2. Upload a medical report or paste text
3. Select report type
4. Fill in patient details (optional)
5. Click "Explain Report"
6. ✅ Should see plain language summary
7. ✅ Should see parameter analysis
8. ✅ Should see abnormalities (if any)
9. ✅ Should see recommendations

#### Smart Chat
1. Go to `/ai/chat`
2. Type a health question: "What are the symptoms of diabetes?"
3. Press Enter or click Send
4. ✅ Should see loading animation
5. ✅ Should see AI response
6. ✅ Should see follow-up suggestions
7. Click a suggestion
8. ✅ Should populate input field
9. Send another message
10. ✅ Should maintain conversation context

### 7. Doctor Dashboard Tests

#### Setup Doctor Account
1. Logout from patient account
2. Register as doctor:
   - Name: "Dr. Smith"
   - Email: "doctor@test.com"
   - Password: "password123"
   - Role: "Doctor"
3. ✅ Should redirect to `/doctor/dashboard`

#### Doctor Dashboard
1. ✅ Should see metrics:
   - Total Appointments
   - Today's Appointments
   - Pending Requests
   - Prescriptions Issued
2. ✅ Should see AI workload summary
3. ✅ Should see today's appointments
4. ✅ Should see pending appointments

#### Manage Appointments
1. Go to `/doctor/appointments`
2. Find a pending appointment
3. Click "Confirm"
4. ✅ Status should change to "confirmed"
5. Find a confirmed appointment
6. Click "Mark Complete"
7. ✅ Status should change to "completed"

#### View Patients
1. Go to `/doctor/patients`
2. ✅ Should see list of patients
3. ✅ Should see patient contact info

### 8. Pharmacy Dashboard Tests

#### Setup Pharmacy Account
1. Logout from doctor account
2. Register as pharmacy:
   - Name: "City Pharmacy"
   - Email: "pharmacy@test.com"
   - Password: "password123"
   - Role: "Pharmacy"
3. ✅ Should redirect to `/pharmacy/dashboard`

#### Pharmacy Dashboard
1. ✅ Should see metrics:
   - Pending Orders
   - Total Revenue
   - Inventory Items
   - Low Stock Alerts
2. ✅ Should see AI inventory summary
3. ✅ Should see pending orders
4. ✅ Should see low stock alerts

#### Manage Inventory
1. Go to `/pharmacy/inventory`
2. Click "Add Item"
3. Fill in the form:
   - Medicine Name: "Aspirin"
   - Quantity: 100
   - Unit: "tablets"
   - Price: 0.50
   - Reorder Level: 20
4. Click "Add Item"
5. ✅ Should see new item in list
6. Click "+10" button
7. ✅ Quantity should increase
8. Click "-10" button
9. ✅ Quantity should decrease

#### Process Orders
1. Go to `/pharmacy/orders`
2. Find a pending order
3. Click "Confirm Order"
4. ✅ Status should change to "confirmed"
5. Click "Start Preparing"
6. ✅ Status should change to "preparing"
7. Click "Mark Ready"
8. ✅ Status should change to "ready"
9. Click "Mark Delivered"
10. ✅ Status should change to "delivered"

### 9. Profile Management Tests

#### Update Profile
1. Go to profile page (any role)
2. Update name
3. Update phone number
4. Click "Save Changes"
5. ✅ Should see success message
6. Refresh page
7. ✅ Changes should persist

### 10. Error Handling Tests

#### Network Error
1. Stop the backend server
2. Try to load dashboard
3. ✅ Should see error message
4. ✅ Should have retry button

#### Invalid Credentials
1. Go to `/login`
2. Enter wrong password
3. ✅ Should see error message
4. ✅ Should not redirect

#### Form Validation
1. Try to submit empty forms
2. ✅ Should see validation errors
3. ✅ Should not submit

### 11. Responsive Design Tests

#### Desktop (1920x1080)
1. Open browser at full width
2. ✅ Sidebar should be visible
3. ✅ Content should be well-spaced
4. ✅ Cards should be in grid layout

#### Tablet (768x1024)
1. Resize browser to tablet size
2. ✅ Sidebar should still be visible
3. ✅ Grid should adjust to 2 columns
4. ✅ Content should be readable

#### Mobile (375x667)
1. Resize browser to mobile size
2. ✅ Sidebar should be hidden
3. ✅ Hamburger menu should appear
4. ✅ Content should stack vertically
5. ✅ Cards should be full width
6. Click hamburger menu
7. ✅ Sidebar should slide in
8. Click outside sidebar
9. ✅ Sidebar should close

### 12. Performance Tests

#### Page Load Speed
1. Open DevTools → Network tab
2. Refresh dashboard
3. ✅ Should load in < 2 seconds
4. ✅ No failed requests

#### API Response Time
1. Open DevTools → Network tab
2. Perform an action (e.g., load appointments)
3. ✅ API should respond in < 1 second
4. ✅ Loading state should show

#### Memory Usage
1. Open DevTools → Performance tab
2. Navigate between pages
3. ✅ No memory leaks
4. ✅ Smooth transitions

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**: Ensure backend is running on port 8000

### Issue: "Token expired"
**Solution**: Login again or check token refresh logic

### Issue: "File upload fails"
**Solution**: Check file size (max 10MB) and format

### Issue: "Sidebar not showing"
**Solution**: Check screen size or click hamburger menu

### Issue: "AI features not working"
**Solution**: Ensure backend AI service is configured

## ✅ Test Completion Checklist

- [ ] All authentication flows work
- [ ] Patient dashboard loads correctly
- [ ] Can book and manage appointments
- [ ] Can upload medical records
- [ ] Can search doctors
- [ ] All AI features respond correctly
- [ ] Doctor dashboard works
- [ ] Can manage appointments as doctor
- [ ] Pharmacy dashboard works
- [ ] Can manage inventory
- [ ] Can process orders
- [ ] Profile updates work
- [ ] Error handling works
- [ ] Responsive design works
- [ ] Performance is acceptable

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Authentication: ✅ / ❌
Patient Features: ✅ / ❌
Doctor Features: ✅ / ❌
Pharmacy Features: ✅ / ❌
AI Features: ✅ / ❌
Responsive Design: ✅ / ❌
Performance: ✅ / ❌

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: PASS / FAIL
```

## 🎯 Success Criteria

The frontend is considered fully functional when:
- ✅ All test scenarios pass
- ✅ No critical bugs found
- ✅ Performance is acceptable
- ✅ UI is responsive
- ✅ Error handling works
- ✅ All features are accessible

## 🚀 Ready for Demo!

Once all tests pass, the frontend is ready for:
- Hackathon presentation
- MVP launch
- User acceptance testing
- Production deployment

**Happy Testing! 🎉**
