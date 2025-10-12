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

  const getInlineColor = (index) => {
    if (color === 'mixed') {
      const colors = ['rgba(236, 72, 153, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(244, 63, 94, 0.6)'];
      return colors[index % colors.length];
    }
    switch (color) {
      case 'pink': return 'rgba(236, 72, 153, 0.6)';
      case 'purple': return 'rgba(168, 85, 247, 0.6)';
      case 'blue': return 'rgba(59, 130, 246, 0.6)';
      default: return 'rgba(168, 85, 247, 0.6)';
    }
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
            fontSize: size === 'varied' ? ['0.75rem', '1rem', '1.25rem', '1.5rem'][index % 4] : '1rem',
            color: getInlineColor(index),
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
          className={`
            absolute animate-drift opacity-20 text-purple-200
            ${size === 'small' ? 'text-xs' : 'text-sm'}
          `}
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