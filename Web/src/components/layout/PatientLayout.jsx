import { useAuthStore } from '@/store/useAuthStore';
import PillNav from '@/components/ui/PillNav';
import Aurora from '@/components/ui/Aurora';
import { Bot, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

export default function PatientLayout({ children }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(scrollY > 100);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mainNavItems = [
    { label: 'Dashboard', href: '/patient/dashboard' },
    { label: 'Appointments', href: '/patient/appointments' },
    { label: 'Prescriptions', href: '/patient/prescriptions' },
    { label: 'Medications', href: '/patient/medications' },
    { label: 'Records', href: '/patient/records' },
    { label: 'Orders', href: '/patient/orders' },
    { label: 'Doctors', href: '/patient/doctors' },
    { label: 'Calorie Tracker', href: '/patient/calorie-tracker' },
    { label: 'Profile', href: '/patient/profile' },
  ];

  const aiNavItems = [
    { label: 'Symptom Checker', href: '/ai/symptom-checker' },
    { label: 'Prescription Analyzer', href: '/ai/prescription-analyzer' },
    { label: 'Report Explainer', href: '/ai/report-explainer' },
    { label: 'Smart Chat', href: '/ai/chat' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden text-white pt-40 pb-12 px-4 sm:px-6 lg:px-8" data-patient-theme="true">
      {/* Background Component: Aurora with blue/purple theme for patients */}
      <Aurora 
        colorStops={["#3b82f6", "#8b5cf6", "#06b6d4"]} 
        blend={0.5} 
        amplitude={1.0} 
        speed={1} 
      />
      
      {/* Navbar Container - Two Rows with PillNav */}
      <div className="fixed top-0 left-0 w-full z-50 p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* First Row - Main Navigation */}
          <div className="flex justify-between items-center bg-black/30 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2 text-white flex-shrink-0 mr-4">
              <Bot className="h-8 w-8 text-blue-400" />
            </div>
            
            <div className="flex-1 flex justify-center min-w-0">
              <PillNav
                items={mainNavItems}
                activeHref={location.pathname}
                baseColor="#3b82f6"
                pillColor="rgba(255,255,255,0.1)"
                hoveredPillTextColor="#000"
                pillTextColor="#fff"
              />
            </div>

            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 whitespace-nowrap rounded-full flex-shrink-0 ml-4" 
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Second Row - AI Features with PillNav - Hides on scroll */}
          <div 
            className={`flex justify-center items-center transition-all duration-300 ease-out ${
              isScrolled 
                ? 'opacity-0 -translate-y-full pointer-events-none' 
                : 'opacity-100 translate-y-0'
            }`}
            style={{
              maxHeight: isScrolled ? '0' : '100px',
              overflow: 'hidden'
            }}
          >
            <div className="bg-black/30 backdrop-blur-xl rounded-full px-6 py-3 border border-purple-500/30 shadow-lg">
              <div className="flex items-center gap-4">
                <span className="text-purple-300 text-sm font-semibold whitespace-nowrap flex items-center gap-2">
                  <span>🤖</span>
                  <span className="hidden sm:inline">AI Features:</span>
                </span>
                <div className="flex-shrink-0">
                  <PillNav
                    items={aiNavItems}
                    activeHref={location.pathname}
                    baseColor="#a855f7"
                    pillColor="rgba(255,255,255,0.1)"
                    hoveredPillTextColor="#000"
                    pillTextColor="#fff"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
