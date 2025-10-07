import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente per particelle fluttuanti animate
 * Crea un effetto magico e dinamico
 */
export default function FloatingParticles({ 
  count = 15, 
  type = 'sparkle',
  color = 'mixed',
  size = 'varied',
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

  const getColorClass = (index) => {
    if (color === 'mixed') {
      const colors = ['text-pink-300', 'text-purple-300', 'text-blue-300', 'text-rose-300'];
      return colors[index % colors.length];
    }
    switch (color) {
      case 'pink': return 'text-pink-300';
      case 'purple': return 'text-purple-300';
      case 'blue': return 'text-blue-300';
      default: return 'text-purple-300';
    }
  };

  const getSizeClass = (index) => {
    if (size === 'varied') {
      const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
      return sizes[index % sizes.length];
    }
    switch (size) {
      case 'small': return 'text-xs';
      case 'large': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const getAnimationDuration = (index) => {
    const base = speed === 'slow' ? 8 : speed === 'fast' ? 3 : 5;
    return `${base + (index % 3)}s`;
  };

  return (
    <Box 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      sx={{ zIndex: 2 }}
    >
      {particles.map((_, index) => (
        <div
          key={index}
          className={`
            absolute animate-float opacity-40 
            ${getColorClass(index)} ${getSizeClass(index)}
          `}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: getAnimationDuration(index),
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {getParticleSymbol(index)}
        </div>
      ))}
      
      {/* Particelle che si muovono lateralmente */}
      {Array.from({ length: Math.floor(count / 3) }, (_, i) => (
        <div
          key={`drift-${i}`}
          className={`
            absolute animate-drift opacity-20 text-purple-200
            ${size === 'small' ? 'text-xs' : 'text-sm'}
          `}
          style={{
            left: `-10%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        >
          {getParticleSymbol(i)}
        </div>
      ))}
    </Box>
  );
}