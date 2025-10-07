import React from 'react';
import { Box } from '@mui/material';

/**
 * Componente per overlay con gradienti decorativi
 * Aggiunge profondità e atmosfera alle schermate
 */
export default function GradientOverlay({ 
  variant = 'romantic', 
  intensity = 'medium',
  position = 'background' 
}) {
  
  const getGradientStyle = () => {
    const intensityMap = {
      low: 0.3,
      medium: 0.5,
      high: 0.7
    };
    
    const alpha = intensityMap[intensity] || 0.5;
    
    switch (variant) {
      case 'romantic':
        return {
          background: `linear-gradient(135deg, 
            rgba(236, 72, 153, ${alpha * 0.6}) 0%, 
            rgba(168, 85, 247, ${alpha * 0.4}) 35%,
            rgba(59, 130, 246, ${alpha * 0.3}) 70%,
            rgba(236, 72, 153, ${alpha * 0.5}) 100%)`
        };
      
      case 'sunset':
        return {
          background: `linear-gradient(135deg,
            rgba(251, 113, 133, ${alpha * 0.6}) 0%,
            rgba(249, 168, 212, ${alpha * 0.4}) 35%,
            rgba(196, 181, 253, ${alpha * 0.3}) 70%,
            rgba(167, 139, 250, ${alpha * 0.5}) 100%)`
        };
      
      case 'aurora':
        return {
          background: `linear-gradient(45deg,
            rgba(59, 130, 246, ${alpha * 0.4}) 0%,
            rgba(147, 51, 234, ${alpha * 0.5}) 25%,
            rgba(236, 72, 153, ${alpha * 0.4}) 50%,
            rgba(251, 113, 133, ${alpha * 0.3}) 75%,
            rgba(59, 130, 246, ${alpha * 0.4}) 100%)`
        };
      
      case 'gentle':
        return {
          background: `linear-gradient(180deg,
            rgba(255, 255, 255, ${alpha * 0.1}) 0%,
            rgba(243, 232, 255, ${alpha * 0.3}) 50%,
            rgba(255, 255, 255, ${alpha * 0.1}) 100%)`
        };
      
      default:
        return { background: 'transparent' };
    }
  };

  const getZIndex = () => {
    switch (position) {
      case 'foreground': return 10;
      case 'middle': return 5;
      case 'background': 
      default: return 1;
    }
  };

  return (
    <Box
      className="fixed inset-0 pointer-events-none"
      sx={{
        ...getGradientStyle(),
        zIndex: getZIndex(),
        mixBlendMode: position === 'foreground' ? 'overlay' : 'normal',
      }}
    />
  );
}