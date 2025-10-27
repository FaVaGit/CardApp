import { Box } from '@mui/material';

/**
 * Componente per particelle fluttuanti animate
 * Crea un effetto magico e dinamico
 */
export default function FloatingParticles({ 
  count = 15, 
  type = 'sparkle',
  speed = 'normal'
}) {
  
  const particles = Array.from({ length: count }, (_, i) => i);
  
  const getParticleSymbol = (index) => {
    switch (type) {
      case 'sparkle':
        return ['✨', '⭐', '💫', '🌟'][index % 4];
      case 'hearts':
        return ['💖', '💕', '💗', '💓'][index % 4];
      case 'flowers':
        return ['🌸', '🌺', '🌼', '🌻'][index % 4];
      case 'butterflies':
        return ['🦋', '🌸', '💫', '✨'][index % 4];
      default:
        return '✨';
    }
  };

  const getAnimationDuration = (index) => {
    const base = speed === 'slow' ? 8 : speed === 'fast' ? 3 : 5;
    return `${base + (index % 3)}s`;
  };

  return (
    <Box 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      sx={{ zIndex: -1 }}
    >
      {particles.map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: '1rem',
            color: 'rgba(168, 85, 247, 0.6)',
            opacity: 0.4,
            animation: `particleFloat ${getAnimationDuration(index)} ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            animationPlayState: 'running',
            animationFillMode: 'both',
            willChange: 'transform, opacity',
            transform: `rotate(${Math.random() * 360}deg) translateZ(0)`,
            pointerEvents: 'none',
            userSelect: 'none',
            isolation: 'isolate',
            contain: 'layout style paint',
            zIndex: -1
          }}
        >
          {getParticleSymbol(index)}
        </div>
      ))}
      
      {/* Particelle che si muovono lateralmente */}
      {Array.from({ length: Math.floor(count / 3) }, (_, i) => (
        <div
          key={`drift-${i}`}
          className="absolute animate-drift opacity-20 text-purple-200 text-sm"
          style={{
            left: `-10%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationPlayState: 'running',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {getParticleSymbol(i)}
        </div>
      ))}
    </Box>
  );
}