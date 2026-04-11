import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import PatientLayout from './PatientLayout';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  ShoppingBag,
  Users,
  Stethoscope,
  Package,
  User,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Activity,
  ClipboardList,
  Bot,
} from 'lucide-react';

const patientNavItems = [
  { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { path: '/patient/prescriptions', label: 'Prescriptions', icon: FileText },
  { path: '/patient/medications', label: 'Medications', icon: Pill },
  { path: '/patient/records', label: 'Medical Records', icon: ClipboardList },
  { path: '/patient/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/patient/doctors', label: 'Find Doctors', icon: Stethoscope },
];

const doctorNavItems = [
  { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { path: '/doctor/patients', label: 'Patients', icon: Users },
  { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
];

const pharmacyNavItems = [
  { path: '/pharmacy/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pharmacy/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/pharmacy/prescriptions', label: 'Prescriptions', icon: FileText },
  { path: '/pharmacy/inventory', label: 'Inventory', icon: Package },
];

const aiFeatures = [
  { path: '/ai/symptom-checker', label: 'Symptom Checker', icon: Activity },
  { path: '/ai/prescription-analyzer', label: 'Prescription Analyzer', icon: FileText },
  { path: '/ai/report-explainer', label: 'Report Explainer', icon: ClipboardList },
  { path: '/ai/chat', label: 'Smart Chat', icon: MessageSquare },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'patient':
        return patientNavItems;
      case 'doctor':
        return doctorNavItems;
      case 'pharmacy':
        return pharmacyNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const profilePath = `/${user?.role}/profile`;

  // Use themed PatientLayout for patient users
  if (user?.role === 'patient') {
    return <PatientLayout>{children}</PatientLayout>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">NextGen Health</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* AI Features Section - Only for Patients */}
            {user?.role === 'patient' && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  AI Features
                </p>
                {aiFeatures.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to={profilePath}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors mb-2"
              onClick={() => setSidebarOpen(false)}
            >
              <User className="h-5 w-5 text-gray-700" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <h1 className="text-2xl font-bold text-gray-900 ml-4 lg:ml-0">
                {navItems.find((item) => item.path === location.pathname)?.label ||
                  (user?.role === 'patient' && aiFeatures.find((item) => item.path === location.pathname)?.label) ||
                  'Dashboard'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
