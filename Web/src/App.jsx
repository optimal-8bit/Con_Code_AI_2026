import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Patient Pages
import PatientDashboard from '@/pages/patient/PatientDashboard';
import PatientAppointments from '@/pages/patient/PatientAppointments';
import PatientPrescriptions from '@/pages/patient/PatientPrescriptions';
import PatientMedications from '@/pages/patient/PatientMedications';
import PatientRecords from '@/pages/patient/PatientRecords';
import PatientOrders from '@/pages/patient/PatientOrders';
import PatientDoctors from '@/pages/patient/PatientDoctors';
import PatientProfile from '@/pages/patient/PatientProfile';
import MedicationSchedule from '@/pages/patient/MedicationSchedule';
import PharmacyOrder from '@/pages/patient/PharmacyOrder';

// Doctor Pages
import DoctorDashboard from '@/pages/doctor/DoctorDashboard';
import DoctorAppointments from '@/pages/doctor/DoctorAppointments';
import DoctorPatients from '@/pages/doctor/DoctorPatients';
import DoctorPrescriptions from '@/pages/doctor/DoctorPrescriptions';
import DoctorProfile from '@/pages/doctor/DoctorProfile';

// Pharmacy Pages
import PharmacyDashboard from '@/pages/pharmacy/PharmacyDashboard';
import PharmacyOrders from '@/pages/pharmacy/PharmacyOrders';
import PharmacyPrescriptions from '@/pages/pharmacy/PharmacyPrescriptions';
import PharmacyInventory from '@/pages/pharmacy/PharmacyInventory';
import PharmacyProfile from '@/pages/pharmacy/PharmacyProfile';

// AI Features
import SymptomChecker from '@/pages/ai/SymptomChecker';
import PrescriptionAnalyzer from '@/pages/ai/PrescriptionAnalyzer';
import ReportExplainer from '@/pages/ai/ReportExplainer';
import SmartChat from '@/pages/ai/SmartChat';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Role-based Dashboard Redirect
function DashboardRedirect() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'patient':
      return <Navigate to="/patient/dashboard" replace />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'pharmacy':
      return <Navigate to="/pharmacy/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Redirect */}
        <Route path="/" element={<DashboardRedirect />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientPrescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/medications"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientMedications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/orders"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctors"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/medication-schedule"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MedicationSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/pharmacy-order"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PharmacyOrder />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorPrescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfile />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Routes */}
        <Route
          path="/pharmacy/dashboard"
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/orders"
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyPrescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/inventory"
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/profile"
          element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyProfile />
            </ProtectedRoute>
          }
        />

        {/* AI Features - Accessible to all authenticated users */}
        <Route
          path="/ai/symptom-checker"
          element={
            <ProtectedRoute>
              <SymptomChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/prescription-analyzer"
          element={
            <ProtectedRoute>
              <PrescriptionAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/report-explainer"
          element={
            <ProtectedRoute>
              <ReportExplainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/chat"
          element={
            <ProtectedRoute>
              <SmartChat />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
