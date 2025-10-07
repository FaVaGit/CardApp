import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente per creare cuori fluttuanti animati
 * Perfetto per il tema romantico dell'app
 */
export default function FloatingHearts({ count = 6, size = 'medium', speed = 'normal' }) {
  const hearts = Array.from({ length: count }, (_, i) => i);
  
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'text-lg';
      case 'large': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow': return '6s';
      case 'fast': return '2s';
      default: return '4s';
    }
  };

  return (
    <Box 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      sx={{ zIndex: 1 }}
    >
      {hearts.map((_, index) => (
        <div
          key={i}
        style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationPlayState: 'running',
          animationFillMode: 'both',
          willChange: 'transform',
          pointerEvents: 'none',
          userSelect: 'none',
          isolation: 'isolate',
          contain: 'layout style paint'
        }}
        >
          💕
        </div>
      ))}
      
      {/* Aggiungiamo anche alcuni cuori più grandi e lenti */}
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={`large-${i}`}
          className="absolute text-3xl text-purple-200 animate-float-delayed opacity-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: '8s',
            animationPlayState: 'running',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          ❤️
        </div>
      ))}
    </Box>
  );
}