# Quick Start Guide - Smart Chat Orchestrator

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Open the Application

Navigate to: `http://localhost:8000/static/index.html`

### Step 3: Try the Chat!

1. **Login/Register** with any credentials
2. Click **"Health AI Chat"** in the sidebar
3. See the new interface with **three upload buttons**

---

## 💡 Try These Examples

### Example 1: Symptom Analysis

**Steps:**
1. Click **"🩺 Upload Symptom"** button
2. Select a photo (or skip and just type)
3. Type: *"I have a rash on my arm that's itchy and red"*
4. Click **Send**

**Expected Result:**
- AI analyzes your symptoms
- Provides possible conditions
- Shows severity level
- Suggests next steps
- Action buttons: "Book Appointment", "View History"

---

### Example 2: Prescription Analysis

**Steps:**
1. Click **"💊 Upload Prescription"** button
2. Select prescription image/PDF (or skip)
3. Type: *"Explain these medicines: Amoxicillin 500mg twice daily"*
4. Click **Send**

**Expected Result:**
- AI explains each medicine
- Dosage instructions
- Side effects to watch for
- Drug interactions
- Action buttons: "Set Reminders", "Find Pharmacy"

---

### Example 3: Report Analysis

**Steps:**
1. Click **"📊 Upload Report"** button
2. Select lab report (or skip)
3. Type: *"What do these results mean? Glucose: 120, Cholesterol: 200"*
4. Click **Send**

**Expected Result:**
- Plain language summary
- Parameter explanations
- Abnormalities highlighted
- Lifestyle recommendations
- Action buttons: "Book Follow-up", "Save Record"

---

### Example 4: Simple Text Question

**Steps:**
1. Don't click any upload button
2. Just type: *"I have a headache and fever"*
3. Click **Send**

**Expected Result:**
- Routes to symptom checker (default)
- Provides health advice
- Suggests when to see a doctor

---

## 🎨 UI Features to Notice

### 1. Upload Buttons
- **Three distinct buttons** with icons
- Hover to see lift animation
- Click to select file type

### 2. File Preview
- Shows thumbnail for images
- Shows file icon for PDFs
- Displays which button you used
- Clear button (✕) to remove

### 3. Markdown Formatting
- **Bold text** for emphasis
- *Italic text* for notes
- Lists (bullets and numbered)
- Code blocks for technical info
- Tables for structured data

### 4. Action Buttons
- Context-aware suggestions
- Click to navigate to relevant features
- Examples:
  - "Book Appointment" → Opens appointments
  - "Set Reminders" → Opens medications
  - "Save Record" → Opens medical records

### 5. Disclaimers
- Yellow warning boxes
- Medical advice disclaimers
- Safety reminders

---

## 🧪 Test the Routing

### Test 1: Verify Symptom Routing
```
Input: "I have a headache"
Button: None (text only)
Expected: Routes to Symptom Checker ✓
```

### Test 2: Verify Prescription Routing
```
Input: "Explain this medicine"
Button: 💊 Upload Prescription
Expected: Routes to Prescription Analyzer ✓
```

### Test 3: Verify Report Routing
```
Input: "What do these results mean?"
Button: 📊 Upload Report
Expected: Routes to Report Explainer ✓
```

---

## 🔍 Verify Implementation

### Check 1: Existing Features Still Work

1. Navigate to **"Symptom Checker"** (standalone)
   - Should work independently ✓
   
2. Navigate to **"RX Analyzer"** (standalone)
   - Should work independently ✓
   
3. Navigate to **"Report Explainer"** (standalone)
   - Should work independently ✓

### Check 2: New Chat Features

1. Three upload buttons visible ✓
2. File preview shows after selection ✓
3. Markdown renders correctly ✓
4. Action buttons appear in responses ✓
5. Chat history maintained ✓

---

## 🐛 Troubleshooting

### Issue: Upload buttons not visible
**Solution:** Clear browser cache and refresh

### Issue: Markdown not rendering
**Solution:** Check browser console for marked.js errors

### Issue: File upload fails
**Solution:** Check file size (max 10MB) and type (images/PDF only)

### Issue: Wrong agent selected
**Solution:** Verify you clicked the correct upload button

### Issue: Action buttons don't work
**Solution:** Check browser console for JavaScript errors

---

## 📱 Mobile Testing

1. Open on mobile device or use browser dev tools
2. Verify upload buttons stack vertically
3. Check file preview is readable
4. Test touch interactions
5. Verify markdown is readable on small screen

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Can login/register
- [ ] Can access Health AI Chat
- [ ] See three upload buttons
- [ ] Can upload files
- [ ] File preview works
- [ ] Messages send successfully
- [ ] Markdown renders correctly
- [ ] Action buttons appear
- [ ] Action buttons navigate correctly
- [ ] Chat history maintained
- [ ] Voice input works (if supported)
- [ ] Existing features still work

---

## 🎉 You're Ready!

The Smart Chat Orchestrator is now fully functional. Users can:

✅ Upload symptoms, prescriptions, or reports  
✅ Get intelligent routing to the right agent  
✅ See beautifully formatted responses  
✅ Take action with integrated buttons  
✅ Maintain conversation context  

**Enjoy your enhanced healthcare chat experience!** 💚

---

## 📚 Next Steps

- Read `ORCHESTRATOR_IMPLEMENTATION.md` for technical details
- Read `IMPLEMENTATION_SUMMARY.md` for architecture overview
- Run `python test_orchestrator.py` to verify backend
- Customize styles in `style.css` if needed
- Add more action button handlers in `app.js`

---

## 🆘 Need Help?

1. Check the documentation files
2. Run the test suite
3. Check browser console
4. Check backend logs
5. Verify environment variables

**Happy coding! 🚀**
