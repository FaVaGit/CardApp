import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente per creare cuori fluttuanti animati
 * Perfetto per il tema romantico dell'app
 * COMPLETAMENTE ISOLATO dalle interazioni dell'utente
 */
export default function FloatingHearts({ count = 6, size = 'medium', speed = 'normal' }) {
  const hearts = Array.from({ length: count }, (_, i) => i);
  
  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow': return '6s';
      case 'fast': return '2s';
      default: return '4s';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return '1.5rem';
      case 'large': return '2.5rem';
      default: return '2rem';
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1
      }}
    >
      {hearts.map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            fontSize: getFontSize(),
            color: 'rgba(236, 72, 153, 0.4)',
            animation: `heartFloat ${getAnimationDuration()} ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            animationPlayState: 'running',
            animationFillMode: 'both',
            willChange: 'transform',
            pointerEvents: 'none',
            userSelect: 'none',
            isolation: 'isolate',
            contain: 'layout style paint',
            zIndex: -1,
            transform: 'translateZ(0)'
          }}
        >
          💕
        </div>
      ))}
      
      {/* Cuori più grandi e lenti */}
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={`large-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: '2.5rem',
            color: 'rgba(168, 85, 247, 0.1)',
            animation: `heartFloat ${parseFloat(getAnimationDuration()) * 1.5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
            animationPlayState: 'running',
            animationFillMode: 'both',
            willChange: 'transform',
            pointerEvents: 'none',
            userSelect: 'none',
            isolation: 'isolate',
            contain: 'layout style paint',
            zIndex: -1,
            transform: 'translateZ(0)'
          }}
        >
          💕
        </div>
      ))}
    </Box>
  );
}