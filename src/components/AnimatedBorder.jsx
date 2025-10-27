import { Box } from '@mui/material';

/**
 * Componente per bordi animati e decorativi
 * Aggiunge eleganza ai contenitori principali
 */
export default function AnimatedBorder({ 
  children, 
  variant = 'glow', 
  color = 'purple',
  speed = 'normal',
  thickness = 'medium'
}) {
  
  const getColorClasses = () => {
    switch (color) {
      case 'pink':
        return {
          border: 'border-pink-200',
          glow: 'shadow-pink-200/50',
          gradient: 'from-pink-400 via-rose-400 to-pink-400'
        };
      case 'purple':
        return {
          border: 'border-purple-200',
          glow: 'shadow-purple-200/50',
          gradient: 'from-purple-400 via-violet-400 to-purple-400'
        };
      case 'blue':
        return {
          border: 'border-blue-200',
          glow: 'shadow-blue-200/50',
          gradient: 'from-blue-400 via-indigo-400 to-blue-400'
        };
      default:
        return {
          border: 'border-purple-200',
          glow: 'shadow-purple-200/50',
          gradient: 'from-purple-400 via-violet-400 to-purple-400'
        };
    }
  };

  const getThickness = () => {
    switch (thickness) {
      case 'thin': return 'border';
      case 'thick': return 'border-4';
      default: return 'border-2';
    }
  };

  const getAnimationSpeed = () => {
    switch (speed) {
      case 'slow': return 'animate-pulse';
      case 'fast': return 'animate-ping';
      default: return 'animate-glow';
    }
  };

  const colors = getColorClasses();

  if (variant === 'glow') {
    return (
      <Box
        className={`
          relative rounded-lg p-1 ${getAnimationSpeed()}
        `}
        sx={{
          background: `linear-gradient(45deg, transparent, rgba(168, 85, 247, 0.1), transparent)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '2px',
            background: `linear-gradient(45deg, #a855f7, #ec4899, #3b82f6, #a855f7)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'exclude',
            maskComposite: 'exclude',
            animation: 'spin 3s linear infinite',
          }
        }}
      >
        <div className="relative bg-white rounded-lg">
          {children}
        </div>
      </Box>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`
        relative rounded-lg ${getThickness()} ${colors.border} 
        ${getAnimationSpeed()} shadow-lg ${colors.glow}
      `}>
        {children}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className="relative p-1 rounded-lg bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 animate-gradient-x">
        <div className="bg-white rounded-lg">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg ${getThickness()} ${colors.border}`}>
      {children}
    </div>
  );
}