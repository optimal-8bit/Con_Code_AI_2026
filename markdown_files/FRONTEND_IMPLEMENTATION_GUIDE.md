# Frontend Implementation Guide - Doctor & Pharmacy Dashboards

## 🎨 Overview

This guide provides React component examples and implementation patterns for building the Doctor and Pharmacy dashboards.

## 📁 Recommended Project Structure

```
Web/src/
├── pages/
│   ├── auth/
│   │   └── Login.jsx (enhanced with role routing)
│   ├── patient/
│   │   ├── Dashboard.jsx
│   │   ├── PharmacyMatch.jsx (new)
│   │   ├── OrderTracking.jsx (new)
│   │   └── DoctorSearch.jsx (new)
│   ├── doctor/
│   │   ├── Dashboard.jsx (new)
│   │   ├── Appointments.jsx (new)
│   │   ├── Patients.jsx (new)
│   │   ├── Prescriptions.jsx (new)
│   │   └── Availability.jsx (new)
│   └── pharmacy/
│       ├── Dashboard.jsx (new)
│       ├── Orders.jsx (new)
│       ├── Inventory.jsx (new)
│       └── OrderDetails.jsx (new)
├── components/
│   ├── doctor/
│   │   ├── AppointmentCard.jsx
│   │   ├── PatientCard.jsx
│   │   └── AvailabilityCalendar.jsx
│   ├── pharmacy/
│   │   ├── OrderCard.jsx
│   │   ├── InventoryTable.jsx
│   │   └── StockAlert.jsx
│   └── payment/
│       └── StripeCheckout.jsx
└── services/
    ├── api.js (enhanced)
    ├── doctorApi.js (new)
    └── pharmacyApi.js (new)
```

## 🔐 1. Enhanced Login with Role Routing

```jsx
// pages/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password);
      const { access_token, user } = response;

      // Store token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Route based on role
      switch (user.role) {
        case 'patient':
          navigate('/patient/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'pharmacy':
          navigate('/pharmacy/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">NextGen Health</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-semibold">Test Accounts:</p>
          <p>Patient: patient@test.com</p>
          <p>Doctor: doctor1@test.com</p>
          <p>Pharmacy: pharmacy1@test.com</p>
          <p className="text-xs">Password: password123</p>
        </div>
      </div>
    </div>
  );
}
```

## 👨‍⚕️ 2. Doctor Dashboard

```jsx
// pages/doctor/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getDoctorDashboard } from '../../services/doctorApi';

export default function DoctorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDoctorDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Today's Appointments"
            value={dashboard.metrics.todays_appointments}
            icon="📅"
          />
          <MetricCard
            title="Pending Requests"
            value={dashboard.metrics.pending_appointments}
            icon="⏳"
          />
          <MetricCard
            title="Total Appointments"
            value={dashboard.metrics.total_appointments}
            icon="📊"
          />
          <MetricCard
            title="Prescriptions Issued"
            value={dashboard.metrics.total_prescriptions}
            icon="💊"
          />
        </div>

        {/* AI Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">AI Insights</h3>
          <p className="text-blue-800">{dashboard.ai_workload_summary}</p>
          <ul className="mt-2 space-y-1">
            {dashboard.ai_recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-700">• {rec}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="space-y-3">
              {dashboard.todays_appointments.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <div className="space-y-3">
              {dashboard.pending_appointments.map((appt) => (
                <AppointmentRequestCard
                  key={appt.id}
                  appointment={appt}
                  onConfirm={loadDashboard}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">Patient ID: {appointment.patient_id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">{appointment.reason}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(appointment.scheduled_at).toLocaleString()}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${
          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {appointment.status}
        </span>
      </div>
    </div>
  );
}

function AppointmentRequestCard({ appointment, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await updateAppointment(appointment.id, { status: 'confirmed' });
      onConfirm();
    } catch (error) {
      alert('Failed to confirm appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
      <p className="font-semibold">New Request</p>
      <p className="text-sm text-gray-600">{appointment.reason}</p>
      <p className="text-sm text-gray-500 mt-1">
        {new Date(appointment.scheduled_at).toLocaleString()}
      </p>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
      >
        {loading ? 'Confirming...' : 'Confirm Appointment'}
      </button>
    </div>
  );
}
```

## 💊 3. Pharmacy Dashboard

```jsx
// pages/pharmacy/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getPharmacyDashboard } from '../../services/pharmacyApi';

export default function PharmacyDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getPharmacyDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Pharmacy Dashboard</h1>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Pending Orders"
            value={dashboard.metrics.pending_orders}
            icon="📦"
            color="yellow"
          />
          <MetricCard
            title="Completed Orders"
            value={dashboard.metrics.completed_orders}
            icon="✅"
            color="green"
          />
          <MetricCard
            title="Today's Revenue"
            value={`$${dashboard.metrics.today_revenue.toFixed(2)}`}
            icon="💰"
            color="blue"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${dashboard.metrics.total_revenue.toFixed(2)}`}
            icon="💵"
            color="purple"
          />
        </div>

        {/* Low Stock Alerts */}
        {dashboard.low_stock_alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">
              ⚠️ Low Stock Alerts ({dashboard.low_stock_alerts.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dashboard.low_stock_alerts.map((item) => (
                <div key={item.id} className="text-sm text-red-800">
                  {item.medicine_name}: {item.quantity} left
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
            <div className="space-y-3">
              {dashboard.pending_orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdate={loadDashboard}
                />
              ))}
            </div>
          </div>

          {/* Recent Completed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Completed</h2>
            <div className="space-y-3">
              {dashboard.completed_orders.map((order) => (
                <CompletedOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, status);
      onUpdate();
    } catch (error) {
      alert('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">
            {order.medicines.length} medicine(s)
          </p>
          <p className="text-lg font-bold text-green-600 mt-1">
            ${order.total.toFixed(2)}
          </p>
        </div>
        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
          {order.payment_status}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {order.medicines.map((med, idx) => (
          <div key={idx} className="text-sm text-gray-700">
            • {med.medicine_name} x{med.quantity}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => updateStatus('preparing')}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Start Preparing
        </button>
        <button
          onClick={() => updateStatus('ready')}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Mark Ready
        </button>
      </div>
    </div>
  );
}
```

## 💳 4. Stripe Payment Integration

```jsx
// components/payment/StripeCheckout.jsx
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key');

function CheckoutForm({ orderId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch(
        `/api/v1/patient/orders/${orderId}/payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const { client_secret } = await response.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm on backend
        await fetch(`/api/v1/patient/orders/${orderId}/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded p-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Amount:</span>
          <span className="font-semibold">${amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Test card: 4242 4242 4242 4242
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripeCheckout({ orderId, amount, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm orderId={orderId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
```

## 🔍 5. Pharmacy Matching Component

```jsx
// pages/patient/PharmacyMatch.jsx
import { useState } from 'react';
import { matchPharmacies } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PharmacyMatch({ medicines }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const findPharmacies = async () => {
    setLoading(true);
    try {
      const data = await matchPharmacies(medicines);
      setMatches(data);
    } catch (error) {
      alert('Failed to match pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const selectPharmacy = (pharmacy) => {
    // Navigate to order creation with selected pharmacy
    navigate('/patient/create-order', {
      state: { pharmacy, medicines }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Find Pharmacies</h2>

      <button
        onClick={findPharmacies}
        disabled={loading}
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {loading ? 'Searching...' : 'Find Available Pharmacies'}
      </button>

      <div className="space-y-4">
        {matches.map((pharmacy) => (
          <div
            key={pharmacy.pharmacy_id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{pharmacy.pharmacy_name}</h3>
                <p className="text-sm text-gray-600">{pharmacy.pharmacy_email}</p>
                {pharmacy.pharmacy_phone && (
                  <p className="text-sm text-gray-600">{pharmacy.pharmacy_phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${pharmacy.total_price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  {pharmacy.availability_percentage}% available
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {pharmacy.available_medicines.map((med, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between text-sm p-2 rounded ${
                    med.available ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className="font-medium">{med.name}</span>
                  <span>
                    {med.available ? (
                      <span className="text-green-700">
                        ✓ ${med.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-red-700">✗ Not available</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {pharmacy.availability_percentage === 100 && (
              <button
                onClick={() => selectPharmacy(pharmacy)}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select This Pharmacy
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🛠️ 6. API Service Files

```javascript
// services/doctorApi.js
const API_BASE = 'http://localhost:8000/api/v1';

const getToken = () => localStorage.getItem('token');

export async function getDoctorDashboard() {
  const response = await fetch(`${API_BASE}/doctor/dashboard`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return response.json();
}

export async function updateAppointment(appointmentId, updates) {
  const response = await fetch(`${API_BASE}/doctor/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}

export async function setAvailability(date, slots) {
  const response = await fetch(`${API_BASE}/doctor/availability`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date, available_slots: slots }),
  });
  return response.json();
}

// services/pharmacyApi.js
export async function getPharmacyDashboard() {
  const response = await fetch(`${API_BASE}/pharmacy/dashboard`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return response.json();
}

export async function updateOrderStatus(orderId, status) {
  const response = await fetch(
    `${API_BASE}/pharmacy/orders/${orderId}/status?status=${status}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    }
  );
  return response.json();
}

export async function getInventory() {
  const response = await fetch(`${API_BASE}/pharmacy/inventory`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  return response.json();
}
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install react-router-dom
```

### 2. Update Routes
```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import PatientDashboard from './pages/patient/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import PharmacyDashboard from './pages/pharmacy/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. Configure API Base URL
```javascript
// services/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
```

## 📱 Responsive Design Tips

- Use Tailwind CSS grid system for responsive layouts
- Mobile-first approach with `md:` and `lg:` breakpoints
- Stack cards vertically on mobile, grid on desktop
- Use drawer/modal for mobile navigation

## 🎨 UI/UX Best Practices

1. **Loading States**: Show spinners during API calls
2. **Error Handling**: Display user-friendly error messages
3. **Success Feedback**: Toast notifications for actions
4. **Real-time Updates**: Poll or use WebSocket for live data
5. **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

## 🔔 Real-time Notifications (Optional)

```jsx
// hooks/useNotifications.js
import { useEffect, useState } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Poll for notifications every 30 seconds
    const interval = setInterval(async () => {
      const response = await fetch('/api/v1/patient/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setNotifications(data);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return notifications;
}
```

## ✅ Implementation Checklist

- [ ] Enhanced login with role routing
- [ ] Doctor dashboard with metrics
- [ ] Doctor appointment management
- [ ] Doctor availability calendar
- [ ] Pharmacy dashboard with revenue
- [ ] Pharmacy order management
- [ ] Pharmacy inventory management
- [ ] Patient pharmacy matching
- [ ] Patient order creation
- [ ] Stripe payment integration
- [ ] Order tracking
- [ ] Notification system
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states

## 🎯 Next Steps

1. Implement the login page with role routing
2. Build doctor dashboard components
3. Build pharmacy dashboard components
4. Integrate Stripe payment UI
5. Add real-time notifications
6. Test complete user flows
7. Polish UI/UX
8. Deploy frontend

This guide provides the foundation for building a complete, production-ready frontend for the Doctor and Pharmacy system!
