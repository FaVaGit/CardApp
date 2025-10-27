import { Box } from '@mui/material';

/**
 * Componente per pattern decorativi di sfondo
 * Crea motivi geometrici eleganti adatti al tema dell'app
 */
export default function BackgroundPattern({ 
  variant = 'hearts', 
  opacity = 0.05, 
  size = 'medium',
  color = 'purple' 
}) {
  
  const getPatternSvg = () => {
    switch (variant) {
      case 'hearts':
        return (
          <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hearts" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M30 45c-7.5-7.5-15-15-15-22.5 0-7.5 7.5-15 15-7.5 7.5-7.5 15 0 15 7.5 0 7.5-7.5 15-15 22.5z"
                  fill="currentColor"
                  opacity={opacity}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hearts)" />
          </svg>
        );
      
      case 'dots':
        return (
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="3" fill="currentColor" opacity={opacity} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        );
      
      case 'waves':
        return (
          <svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M0 10 Q25 0 50 10 T100 10 V20 H0 Z"
                  fill="currentColor"
                  opacity={opacity}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        );
      
      case 'grid':
        return (
          <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M0 0h50v50H0z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity={opacity}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        );
      
      default:
        return null;
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'pink': return 'text-pink-400';
      case 'purple': return 'text-purple-400';
      case 'blue': return 'text-blue-400';
      case 'rose': return 'text-rose-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <Box
      className={`fixed inset-0 pointer-events-none ${getColorClass()}`}
      sx={{ 
        zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(getPatternSvg()?.props?.children || '')}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: size === 'small' ? '30px' : size === 'large' ? '80px' : '50px',
      }}
    >
      <div 
        className="w-full h-full"
        style={{
          background: `url("data:image/svg+xml,${encodeURIComponent(
            getPatternSvg()?.toString() || ''
          )}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: size === 'small' ? '30px' : size === 'large' ? '80px' : '50px',
        }}
      />
    </Box>
  );
}