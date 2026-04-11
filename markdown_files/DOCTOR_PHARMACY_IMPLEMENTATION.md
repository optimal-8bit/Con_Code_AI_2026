# Doctor & Pharmacy Dashboard Implementation Guide

## Overview
This document outlines the implementation of Doctor and Pharmacy roles with dedicated dashboards, creating a connected healthcare ecosystem where patients, doctors, and pharmacies interact seamlessly.

## Backend Implementation ✅

### 1. Database Schema Extensions

#### New Collections:
- **orders**: Pharmacy orders with payment tracking
- **doctor_availability**: Doctor scheduling slots
- Enhanced **users** collection with role-based profiles

#### Key Fields Added:
```python
# User Profile (for doctors)
profile: {
    "specialty": "Cardiology",  # or "Orthopedics", "Gynecology", etc.
    "qualifications": "MD, MBBS",
    "experience_years": 10,
    "city": "New York",
    "rating": 4.8
}

# User Profile (for pharmacies)
profile: {
    "pharmacy_name": "HealthPlus Pharmacy",
    "license_number": "PH12345",
    "city": "New York",
    "phone": "+1234567890"
}
```

### 2. API Endpoints

#### Patient Routes (Enhanced)
- `POST /api/v1/patient/match-pharmacies` - Match pharmacies for prescription
- `POST /api/v1/patient/orders` - Create pharmacy order
- `GET /api/v1/patient/orders` - List patient orders
- `GET /api/v1/patient/orders/{order_id}` - Get order details
- `POST /api/v1/patient/orders/{order_id}/payment-intent` - Create Stripe payment
- `POST /api/v1/patient/orders/{order_id}/confirm-payment` - Confirm payment
- `GET /api/v1/patient/doctors?specialty=cardiology` - Search doctors by specialty

#### Doctor Routes (Enhanced)
- `GET /api/v1/doctor/dashboard` - Doctor dashboard with metrics
- `GET /api/v1/doctor/appointments` - List appointments
- `PATCH /api/v1/doctor/appointments/{id}` - Update appointment status
- `POST /api/v1/doctor/prescriptions` - Issue prescription
- `GET /api/v1/doctor/patients` - List patients
- `GET /api/v1/doctor/patients/{id}` - Get patient details
- `POST /api/v1/doctor/availability` - Set available time slots
- `GET /api/v1/doctor/availability/{date}` - Get availability
- `GET /api/v1/doctor/public/{doctor_id}/availability/{date}` - Public availability check

#### Pharmacy Routes (Enhanced)
- `GET /api/v1/pharmacy/dashboard` - Pharmacy dashboard with revenue metrics
- `GET /api/v1/pharmacy/orders` - List pharmacy orders
- `GET /api/v1/pharmacy/orders/{order_id}` - Get order details
- `PATCH /api/v1/pharmacy/orders/{order_id}/status` - Update order status
- `GET /api/v1/pharmacy/inventory` - List inventory
- `POST /api/v1/pharmacy/inventory` - Add inventory item
- `PATCH /api/v1/pharmacy/inventory/{item_id}/quantity` - Update stock
- `GET /api/v1/pharmacy/inventory/low-stock` - Low stock alerts

### 3. Payment Integration (Stripe)

#### Setup:
1. Add Stripe test keys to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

2. Install Stripe: `pip install stripe==11.2.0`

#### Payment Flow:
1. Patient creates order → `POST /patient/orders`
2. Patient initiates payment → `POST /patient/orders/{id}/payment-intent`
3. Frontend uses Stripe.js with client_secret
4. After successful payment → `POST /patient/orders/{id}/confirm-payment`
5. Pharmacy receives notification of paid order

### 4. Doctor-Patient Matching

#### Symptom-Based Doctor Recommendation:
The system analyzes patient symptoms and suggests relevant specialties:

```python
# Example mapping (can be enhanced with AI)
symptom_to_specialty = {
    "chest pain": "Cardiology",
    "bone fracture": "Orthopedics",
    "pregnancy": "Gynecology",
    "fever": "General Physician",
    "skin rash": "Dermatology",
}
```

#### Appointment Booking Flow:
1. Patient checks symptoms → AI suggests specialty
2. Patient searches doctors by specialty → `GET /patient/doctors?specialty=cardiology`
3. Patient views doctor availability → `GET /doctor/public/{doctor_id}/availability/{date}`
4. Patient books appointment → `POST /patient/appointments`
5. Doctor receives notification
6. Doctor confirms/updates appointment → `PATCH /doctor/appointments/{id}`

### 5. Pharmacy Matching Algorithm

#### How It Works:
1. Patient uploads prescription → AI extracts medicines
2. Patient requests pharmacy matches → `POST /patient/match-pharmacies`
3. System checks all pharmacies' inventory
4. Returns sorted list by availability percentage
5. Shows individual medicine prices and total cost

#### Response Format:
```json
{
  "pharmacy_id": "123",
  "pharmacy_name": "HealthPlus Pharmacy",
  "available_medicines": [
    {
      "name": "Aspirin",
      "available": true,
      "price": 15.99,
      "quantity": 30
    }
  ],
  "total_price": 45.99,
  "availability_percentage": 100.0
}
```

## Frontend Implementation (TODO)

### 1. Login Page Enhancement

Update login flow to route based on user role:
```javascript
// After successful login
if (user.role === 'patient') {
  navigate('/patient/dashboard');
} else if (user.role === 'doctor') {
  navigate('/doctor/dashboard');
} else if (user.role === 'pharmacy') {
  navigate('/pharmacy/dashboard');
}
```

### 2. Doctor Dashboard Components

#### Required Pages:
- `/doctor/dashboard` - Overview with today's appointments
- `/doctor/appointments` - Appointment management
- `/doctor/patients` - Patient list
- `/doctor/prescriptions` - Prescription history
- `/doctor/availability` - Schedule management
- `/doctor/profile` - Edit profile (specialty, qualifications)

#### Key Features:
- **Today's Schedule**: List of appointments with patient details
- **Pending Requests**: New appointment requests requiring confirmation
- **Quick Actions**: Confirm appointment, Issue prescription, View patient history
- **Availability Calendar**: Set available time slots for each day
- **Patient Records**: View patient medical history, previous prescriptions

#### Sample Dashboard Metrics:
```javascript
{
  total_appointments: 45,
  pending_appointments: 3,
  todays_appointments: 5,
  completed_appointments: 38,
  total_prescriptions: 52
}
```

### 3. Pharmacy Dashboard Components

#### Required Pages:
- `/pharmacy/dashboard` - Overview with orders and revenue
- `/pharmacy/orders` - Order management
- `/pharmacy/inventory` - Stock management
- `/pharmacy/prescriptions` - Prescription fulfillment
- `/pharmacy/profile` - Edit pharmacy details

#### Key Features:
- **Order Queue**: Pending orders with medicine details
- **Revenue Tracking**: Daily/monthly sales, total revenue
- **Inventory Management**: Add/update stock, low stock alerts
- **Order Processing**: Update order status (preparing → ready → delivered)
- **Real-time Updates**: New order notifications

#### Sample Dashboard Metrics:
```javascript
{
  pending_orders: 5,
  completed_orders: 120,
  total_revenue: 15420.50,
  today_revenue: 850.00,
  low_stock_alerts: 3,
  total_inventory_items: 250
}
```

### 4. Patient Dashboard Enhancements

#### New Features to Add:
- **Pharmacy Matching**: After prescription analysis, show "Find Pharmacies" button
- **Order Tracking**: View order status and history
- **Doctor Search**: Search by specialty with filters
- **Appointment Booking**: Select doctor, date, and time slot
- **Payment Integration**: Stripe checkout for medicine orders

#### Prescription to Order Flow:
```
1. Upload Prescription → AI Analysis
2. Click "Find Pharmacies" → Show matched pharmacies
3. Select Pharmacy → Review cart with prices
4. Proceed to Checkout → Stripe payment
5. Confirm Payment → Order placed
6. Track Order → View status updates
```

### 5. Stripe Payment Integration (Frontend)

#### Install Stripe.js:
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### Payment Component:
```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_your_publishable_key');

// Payment Form Component
function CheckoutForm({ orderId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get payment intent
    const { client_secret } = await fetch(`/api/v1/patient/orders/${orderId}/payment-intent`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    });
    
    if (error) {
      console.error(error);
    } else if (paymentIntent.status === 'succeeded') {
      // Confirm on backend
      await fetch(`/api/v1/patient/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onSuccess();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}
```

## Testing the System

### 1. Create Test Users

```bash
# Register a doctor
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "doctor@test.com",
    "password": "password123",
    "role": "doctor",
    "profile": {
      "specialty": "Cardiology",
      "qualifications": "MD, MBBS",
      "experience_years": 10
    }
  }'

# Register a pharmacy
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HealthPlus Pharmacy",
    "email": "pharmacy@test.com",
    "password": "password123",
    "role": "pharmacy",
    "profile": {
      "pharmacy_name": "HealthPlus Pharmacy",
      "license_number": "PH12345"
    }
  }'
```

### 2. Add Pharmacy Inventory

```bash
# Login as pharmacy and add medicines
curl -X POST http://localhost:8000/api/v1/pharmacy/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medicine_name": "Aspirin",
    "quantity": 500,
    "price_per_unit": 0.50,
    "unit": "tablets"
  }'
```

### 3. Set Doctor Availability

```bash
# Login as doctor and set availability
curl -X POST http://localhost:8000/api/v1/doctor/availability \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-04-15",
    "available_slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]
  }'
```

### 4. Test Complete Flow

1. **Patient**: Upload prescription → Get medicine list
2. **Patient**: Match pharmacies → See prices and availability
3. **Patient**: Create order → Select pharmacy
4. **Patient**: Pay with Stripe test card (4242 4242 4242 4242)
5. **Pharmacy**: Receive order notification
6. **Pharmacy**: Update order status → preparing → ready
7. **Patient**: Receive status notifications

## Database Seeding Script

Create a script to populate test data:

```python
# backend/seed_data.py
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Create test doctor
doctor_data = {
    "name": "Dr. Sarah Johnson",
    "email": "doctor@test.com",
    "password": "password123",
    "role": "doctor",
    "profile": {
        "specialty": "Cardiology",
        "qualifications": "MD, MBBS",
        "experience_years": 10,
        "city": "New York"
    }
}

# Create test pharmacy
pharmacy_data = {
    "name": "HealthPlus Pharmacy",
    "email": "pharmacy@test.com",
    "password": "password123",
    "role": "pharmacy",
    "profile": {
        "pharmacy_name": "HealthPlus Pharmacy",
        "license_number": "PH12345",
        "city": "New York"
    }
}

# Add medicines to pharmacy inventory
medicines = [
    {"medicine_name": "Aspirin", "quantity": 500, "price_per_unit": 0.50},
    {"medicine_name": "Ibuprofen", "quantity": 300, "price_per_unit": 0.75},
    {"medicine_name": "Amoxicillin", "quantity": 200, "price_per_unit": 2.50},
    {"medicine_name": "Metformin", "quantity": 400, "price_per_unit": 1.20},
]

# Run seeding...
```

## Next Steps

1. ✅ Backend API implementation complete
2. ⏳ Frontend dashboard development
3. ⏳ Stripe payment UI integration
4. ⏳ Real-time notifications (WebSocket/SSE)
5. ⏳ Doctor availability calendar UI
6. ⏳ Pharmacy order management UI
7. ⏳ Testing and bug fixes

## Notes

- All backend routes are protected with JWT authentication
- Role-based access control is enforced on all endpoints
- Stripe test mode is configured (use test cards)
- Real-time updates can be added with WebSocket later
- AI-powered doctor recommendations can be enhanced
- Inventory management includes automatic low-stock alerts
