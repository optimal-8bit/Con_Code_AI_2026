import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function GoogleCallbackPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens and user data from URL
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userB64 = params.get('user');

        if (!accessToken || !refreshToken || !userB64) {
          setError('Missing authentication data');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Decode user data
        const userJson = atob(userB64);
        const userData = JSON.parse(userJson);
        
        // Update auth store with complete data (this also stores in localStorage)
        setAuth({
          access_token: accessToken,
          refresh_token: refreshToken,
          user: userData,
        });
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          const role = userData.role;
          navigate(`/${role}/dashboard`, { replace: true });
        }, 100);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate, setAuth]);

  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden bg-[#0A0A10] font-sans text-white flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-400 text-lg mb-4">{error}</div>
            <div className="text-white/50 text-sm">Redirecting...</div>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <div className="text-white/90 text-lg">Completing sign in...</div>
            <div className="text-white/50 text-sm mt-2">Please wait</div>
          </>
        )}
      </div>
    </div>
  );
}
