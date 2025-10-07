import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

/**
 * Componente carta decorativa per il gioco
 * Migliora l'aspetto visivo delle carte con animazioni e stili eleganti
 */
export default function DecorativeCard({ 
  children, 
  variant = 'romantic',
  glowEffect = false,
  hoverAnimation = true,
  className = '',
  ...props 
}) {
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'romantic':
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(254, 242, 242, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15)'
        };
      
      case 'elegant':
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12)'
        };
      
      case 'dreamy':
        return {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(243, 232, 255, 0.8) 50%, rgba(252, 231, 243, 0.8) 100%)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(196, 181, 253, 0.3)',
          boxShadow: '0 8px 40px rgba(196, 181, 253, 0.2)'
        };
      
      default:
        return {};
    }
  };

  const animationClasses = [
    className,
    hoverAnimation ? 'transition-all duration-300 hover:scale-105 hover:shadow-2xl' : '',
    glowEffect ? 'animate-glow' : ''
  ].filter(Boolean).join(' ');

  return (
    <Card
      className={`${animationClasses} animate-fade-in`}
      sx={{
        ...getVariantStyle(),
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
        '&::before': glowEffect ? {
          content: '""',
          position: 'absolute',
          inset: -2,
          borderRadius: 'inherit',
          background: 'linear-gradient(45deg, #ec4899, #a855f7, #3b82f6, #ec4899)',
          zIndex: -1,
          opacity: 0.3,
          filter: 'blur(10px)',
          animation: 'spin 3s linear infinite'
        } : undefined,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Card>
  );
}