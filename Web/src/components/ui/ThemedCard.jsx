import BorderGlow from './BorderGlow';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from './card';

/**
 * ThemedCard - A wrapper component that automatically applies themed styling
 * based on user role. For patients, it uses BorderGlow with glass effects.
 * For other roles, it uses standard Card components.
 */
export function ThemedCard({ children, className = '', glowColor, ...props }) {
  const { user } = useAuthStore();
  
  if (user?.role === 'patient') {
    return (
      <BorderGlow glowColor={glowColor || '220 60 40'} className={className}>
        <div className="p-6">
          {children}
        </div>
      </BorderGlow>
    );
  }
  
  return <Card className={className} {...props}>{children}</Card>;
}

export function ThemedCardHeader({ children, className = '', ...props }) {
  const { user } = useAuthStore();
  
  if (user?.role === 'patient') {
    return (
      <div className="mb-6">
        {children}
      </div>
    );
  }
  
  return <CardHeader className={className} {...props}>{children}</CardHeader>;
}

export function ThemedCardTitle({ children, className = '', ...props }) {
  const { user } = useAuthStore();
  
  if (user?.role === 'patient') {
    return (
      <h3 className={`text-xl font-semibold text-white ${className}`} {...props}>
        {children}
      </h3>
    );
  }
  
  return <CardTitle className={className} {...props}>{children}</CardTitle>;
}

export function ThemedCardContent({ children, className = '', ...props }) {
  const { user } = useAuthStore();
  
  if (user?.role === 'patient') {
    return <div className={className}>{children}</div>;
  }
  
  return <CardContent className={className} {...props}>{children}</CardContent>;
}

/**
 * Themed text colors for different elements
 */
export function useThemedColors() {
  const { user } = useAuthStore();
  
  if (user?.role === 'patient') {
    return {
      text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        muted: 'text-gray-400',
      },
      bg: {
        card: 'bg-white/5',
        hover: 'hover:bg-white/10',
        border: 'border-white/10',
      },
      button: {
        outline: 'bg-white/5 border-white/20 text-white hover:bg-white/20',
      },
    };
  }
  
  return {
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      muted: 'text-gray-600',
    },
    bg: {
      card: 'bg-gray-50',
      hover: 'hover:bg-gray-100',
      border: 'border-gray-200',
    },
    button: {
      outline: '',
    },
  };
}
