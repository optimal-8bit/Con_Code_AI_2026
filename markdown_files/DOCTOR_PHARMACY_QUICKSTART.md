# Doctor & Pharmacy System - Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `stripe==11.2.0` - Payment processing

### 2. Configure Stripe (Optional for Testing)

Add to `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

Get test keys from: https://dashboard.stripe.com/test/apikeys

### 3. Seed Test Data

```bash
cd backend
python seed_test_data.py
```

This creates:
- 5 doctors (various specialties)
- 3 pharmacies (with full inventory)
- 1 test patient
- Doctor availability for next 7 days
- 20+ medicines in each pharmacy

### 4. Start the Backend

```bash
cd backend
python -m app.main
```

API will be available at: http://localhost:8000

## 📋 Test Accounts

### Doctors
```
Email: doctor1@test.com | Password: password123 | Specialty: Cardiology
Email: doctor2@test.com | Password: password123 | Specialty: Orthopedics
Email: doctor3@test.com | Password: password123 | Specialty: Gynecology
Email: doctor4@test.com | Password: password123 | Specialty: General Physician
Email: doctor5@test.com | Password: password123 | Specialty: Dermatology
```

### Pharmacies
```
Email: pharmacy1@test.com | Password: password123 | HealthPlus Pharmacy
Email: pharmacy2@test.com | Password: password123 | MediCare Pharmacy
Email: pharmacy3@test.com | Password: password123 | QuickMeds Pharmacy
```

### Patient
```
Email: patient@test.com | Password: password123
```

## 🧪 Testing the Complete Flow

### 1. Patient Journey: Symptom to Medicine Order

#### Step 1: Login as Patient
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "patient@test.com", "password": "password123"}'
```

Save the `access_token` from response.

#### Step 2: Check Symptoms (AI Analysis)
```bash
curl -X POST http://localhost:8000/api/v1/ai/symptom-checker \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptom_text": "I have chest pain and shortness of breath",
    "patient_age": 35,
    "duration_days": 2
  }'
```

AI will suggest: "Cardiology" specialist

#### Step 3: Search for Cardiologists
```bash
curl -X GET "http://localhost:8000/api/v1/patient/doctors?specialty=cardiology" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 4: Check Doctor Availability
```bash
curl -X GET "http://localhost:8000/api/v1/doctor/public/DOCTOR_ID/availability/2026-04-15"
```

#### Step 5: Book Appointment
```bash
curl -X POST http://localhost:8000/api/v1/patient/appointments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "DOCTOR_ID",
    "scheduled_at": "2026-04-15T10:00:00",
    "reason": "Chest pain consultation"
  }'
```

#### Step 6: Upload Prescription (After Doctor Visit)
```bash
curl -X POST http://localhost:8000/api/v1/ai/prescription-analyzer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prescription_text": "Aspirin 75mg - 1 tablet daily for 30 days\nAmlodipine 5mg - 1 tablet daily for 30 days"
  }'
```

#### Step 7: Match Pharmacies
```bash
curl -X POST http://localhost:8000/api/v1/patient/match-pharmacies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medicines": [
      {"name": "Aspirin", "quantity": 30},
      {"name": "Amlodipine", "quantity": 30}
    ]
  }'
```

Response shows pharmacies with availability and pricing.

#### Step 8: Create Order
```bash
curl -X POST http://localhost:8000/api/v1/patient/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pharmacy_id": "PHARMACY_ID",
    "medicines": [
      {
        "medicine_name": "Aspirin",
        "quantity": 30,
        "price_per_unit": 0.50,
        "inventory_item_id": "INVENTORY_ID"
      }
    ],
    "delivery_address": "123 Main St, New York, NY"
  }'
```

#### Step 9: Create Payment Intent
```bash
curl -X POST http://localhost:8000/api/v1/patient/orders/ORDER_ID/payment-intent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns `client_secret` for Stripe payment.

#### Step 10: Confirm Payment (After Stripe Payment)
```bash
curl -X POST http://localhost:8000/api/v1/patient/orders/ORDER_ID/confirm-payment \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Doctor Journey

#### Login as Doctor
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor1@test.com", "password": "password123"}'
```

#### View Dashboard
```bash
curl -X GET http://localhost:8000/api/v1/doctor/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Shows:
- Today's appointments
- Pending appointment requests
- Recent patients
- Prescriptions issued

#### Set Availability
```bash
curl -X POST http://localhost:8000/api/v1/doctor/availability \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-04-20",
    "available_slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]
  }'
```

#### Confirm Appointment
```bash
curl -X PATCH http://localhost:8000/api/v1/doctor/appointments/APPOINTMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

#### Issue Prescription
```bash
curl -X POST http://localhost:8000/api/v1/doctor/prescriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PATIENT_ID",
    "appointment_id": "APPOINTMENT_ID",
    "medicines": [
      {
        "name": "Aspirin",
        "dosage": "75mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "Take with food"
      }
    ],
    "notes": "Follow up in 2 weeks"
  }'
```

### 3. Pharmacy Journey

#### Login as Pharmacy
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "pharmacy1@test.com", "password": "password123"}'
```

#### View Dashboard
```bash
curl -X GET http://localhost:8000/api/v1/pharmacy/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Shows:
- Pending orders
- Revenue metrics
- Low stock alerts
- Inventory summary

#### View Orders
```bash
curl -X GET http://localhost:8000/api/v1/pharmacy/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Order Status
```bash
curl -X PATCH "http://localhost:8000/api/v1/pharmacy/orders/ORDER_ID/status?status=preparing" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Status flow: `pending` → `confirmed` → `preparing` → `ready` → `delivered`

#### View Inventory
```bash
curl -X GET http://localhost:8000/api/v1/pharmacy/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Add Medicine to Inventory
```bash
curl -X POST http://localhost:8000/api/v1/pharmacy/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medicine_name": "New Medicine",
    "quantity": 100,
    "price_per_unit": 5.99,
    "unit": "tablets",
    "reorder_level": 20
  }'
```

## 🛠️ Admin Tools

### View System Statistics
```bash
cd backend
python admin_tools.py stats
```

### List All Doctors
```bash
python admin_tools.py list-doctors
```

### List All Pharmacies
```bash
python admin_tools.py list-pharmacies
```

### View Pharmacy Inventory
```bash
python admin_tools.py list-inventory --email pharmacy1@test.com
```

### View Orders
```bash
python admin_tools.py list-orders --email pharmacy1@test.com
```

### View Appointments
```bash
python admin_tools.py list-appointments --email doctor1@test.com
```

## 💳 Stripe Test Cards

For testing payments, use these test card numbers:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

## 🔄 Complete User Flow Example

### Scenario: Patient with Chest Pain

1. **Patient** logs in and uses symptom checker
   - Enters: "chest pain, shortness of breath"
   - AI suggests: Cardiology specialist

2. **Patient** searches for cardiologists
   - Finds Dr. Sarah Johnson (Cardiology)
   - Checks her availability

3. **Patient** books appointment
   - Selects date: April 15, 2026
   - Time: 10:00 AM

4. **Doctor** receives notification
   - Reviews appointment request
   - Confirms appointment

5. **Patient** attends appointment (simulated)

6. **Doctor** issues prescription
   - Aspirin 75mg - 30 days
   - Amlodipine 5mg - 30 days

7. **Patient** receives prescription notification

8. **Patient** uploads prescription to system
   - AI analyzes and extracts medicines

9. **Patient** matches pharmacies
   - System shows 3 pharmacies
   - HealthPlus: 100% available, $45.00
   - MediCare: 100% available, $47.50
   - QuickMeds: 50% available, $22.50

10. **Patient** selects HealthPlus and creates order

11. **Patient** pays via Stripe
    - Uses test card: 4242 4242 4242 4242
    - Payment succeeds

12. **Pharmacy** receives order notification
    - Views order details
    - Updates status: preparing → ready

13. **Patient** receives status notifications
    - "Your order is being prepared"
    - "Your order is ready for pickup"

## 📊 API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
sudo systemctl start mongod
```

### Stripe Payment Fails
- Check if STRIPE_SECRET_KEY is set in .env
- Verify you're using test mode keys (sk_test_...)
- Use test card numbers only

### No Pharmacies Found
```bash
# Re-run seed script
python seed_test_data.py
```

### Doctor Availability Not Showing
```bash
# Check if availability is set
python admin_tools.py list-appointments --email doctor1@test.com
```

## 📝 Next Steps

1. **Frontend Development**
   - Create Doctor Dashboard UI
   - Create Pharmacy Dashboard UI
   - Integrate Stripe payment UI
   - Add real-time notifications

2. **Enhancements**
   - Add WebSocket for real-time updates
   - Implement prescription image upload
   - Add doctor ratings and reviews
   - Add pharmacy delivery tracking
   - Implement appointment reminders

3. **Production Readiness**
   - Switch to production Stripe keys
   - Add proper error handling
   - Implement rate limiting
   - Add comprehensive logging
   - Set up monitoring

## 🎯 Key Features Implemented

✅ Role-based authentication (Patient, Doctor, Pharmacy)
✅ Doctor profiles with specialties
✅ Doctor availability scheduling
✅ Appointment booking with time slots
✅ Symptom-based doctor recommendations
✅ Pharmacy inventory management
✅ Prescription-to-pharmacy matching
✅ Order creation and tracking
✅ Stripe payment integration (test mode)
✅ Real-time notifications
✅ Revenue tracking for pharmacies
✅ Low stock alerts
✅ Complete patient-doctor-pharmacy workflow

## 📞 Support

For issues or questions:
- Check API docs: http://localhost:8000/api/docs
- Review implementation guide: DOCTOR_PHARMACY_IMPLEMENTATION.md
- Run admin tools for debugging: `python admin_tools.py stats`
