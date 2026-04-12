import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { AlertCircle } from 'lucide-react';
import { handleApiError } from '@/lib/utils';
import SoftAurora from '@/components/ui/SoftAurora';

// All aurora props outside the component — prevents the WebGL effect
// from restarting every time the user types in the form fields.
const AURORA_SPEED = 0.6;
const AURORA_SCALE = 1.5;
const AURORA_BRIGHTNESS = 1;
const AURORA_COLOR1 = '#f7f7f7';
const AURORA_COLOR2 = '#e100ff';
const AURORA_NOISE_FREQ = 2.5;
const AURORA_NOISE_AMP = 1;
const AURORA_BAND_HEIGHT = 0.5;
const AURORA_BAND_SPREAD = 1;
const AURORA_OCTAVE_DECAY = 0.1;
const AURORA_LAYER_OFFSET = 0;
const AURORA_COLOR_SPEED = 1;
const AURORA_MOUSE_INFLUENCE = 0.25;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const role = data.user.role;
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { authService } = await import('@/services/auth.service');
      const authUrl = await authService.initiateGoogleLogin();
      window.location.href = authUrl;
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden bg-[#0A0A10] font-sans text-white flex items-center justify-center">
      {/* SoftAurora Background - mouse-reactive aurora effect */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <SoftAurora
          speed={AURORA_SPEED}
          scale={AURORA_SCALE}
          brightness={AURORA_BRIGHTNESS}
          color1={AURORA_COLOR1}
          color2={AURORA_COLOR2}
          noiseFrequency={AURORA_NOISE_FREQ}
          noiseAmplitude={AURORA_NOISE_AMP}
          bandHeight={AURORA_BAND_HEIGHT}
          bandSpread={AURORA_BAND_SPREAD}
          octaveDecay={AURORA_OCTAVE_DECAY}
          layerOffset={AURORA_LAYER_OFFSET}
          colorSpeed={AURORA_COLOR_SPEED}
          enableMouseInteraction
          mouseInfluence={AURORA_MOUSE_INFLUENCE}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full px-4 flex items-center justify-center h-full sm:h-auto my-auto overflow-y-auto">
        {/* Glassmorphism Card */}
        <div className="w-full max-w-[440px] rounded-[24px] border border-white/10 bg-[#0c0c16]/70 sm:p-10 p-6 backdrop-blur-[32px] shadow-[0_0_80px_-20px_rgba(82,39,255,0.3)]">
          <div className="mb-8 mt-2">
            <h1 className="text-[28px] tracking-tight font-bold text-white mb-2 leading-tight">Sign in</h1>
            <p className="text-white/50 text-[15px]">Sign in to your NextGen Health account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-white/90">Email*</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-white/90">Password*</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:bg-white/10 transition-all font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#6E3BFC] to-[#4A1ACA] hover:from-[#5A2BDC] hover:to-[#3810AB] text-white font-semibold rounded-xl px-4 py-3.5 text-[15px] transition-colors flex items-center justify-center shadow-lg shadow-purple-500/25"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Social Sign In Buttons */}
          <div className="mt-5">
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/90 border border-white/5 rounded-xl px-3 py-3.5 text-[13px] font-semibold transition-colors"
            >
              {/* Google G logo */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-8 text-center text-[13px] text-white/50">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-white hover:text-white/80 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
