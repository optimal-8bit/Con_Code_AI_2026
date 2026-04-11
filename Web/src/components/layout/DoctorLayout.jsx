import { useAuthStore } from '@/store/useAuthStore';
import PillNav from '@/components/ui/PillNav';
import Aurora from '@/components/ui/Aurora';
import { Bot, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DoctorLayout({ children }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/doctor/dashboard' },
    { label: 'Appointments', href: '/doctor/appointments' },
    { label: 'Patients', href: '/doctor/patients' },
    { label: 'Prescriptions', href: '/doctor/prescriptions' },
    { label: 'Profile', href: '/doctor/profile' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden text-white pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background Component 3: Aurora (Blue Config) */}
      <Aurora 
        colorStops={["#3b82f6", "#60a5fa", "#1d4ed8"]} 
        blend={0.5} 
        amplitude={1.0} 
        speed={1} 
      />
      
      {/* Navbar Container with Component 2: PillNav */}
      <div className="fixed top-0 left-0 w-full z-50 p-4 shrink-0 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto bg-black/20 backdrop-blur-md rounded-full px-6 py-2 border border-white/10">
             <div className="flex items-center space-x-2 text-white">
               <Bot className="h-8 w-8 text-blue-400" />
             </div>
             
             <div className="flex-1 flex justify-center">
                 <PillNav
                    items={navItems}
                    activeHref={location.pathname}
                    baseColor="#3b82f6"
                    pillColor="rgba(255,255,255,0.1)"
                    hoveredPillTextColor="#000"
                    pillTextColor="#fff"
                    className="!static !mt-0 !mb-0"
                 />
             </div>

             <Button variant="ghost" className="text-white hover:bg-white/20 whitespace-nowrap rounded-full" onClick={handleLogout}>
               <LogOut className="h-5 w-5 sm:mr-2" />
               <span className="hidden sm:inline">Logout</span>
             </Button>
          </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
