import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Componente header decorativo con elementi romantici
 * Perfetto per le sezioni principali dell'app
 */
export default function DecorativeHeader({ 
  title, 
  subtitle, 
  icon, 
  variant = 'romantic',
  centerAlign = true,
  showHearts = true 
}) {
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'romantic':
        return {
          title: 'text-gradient animate-fade-in',
          subtitle: 'text-gray-600 animate-slide-up',
          container: 'bg-romantic-gradient'
        };
      case 'elegant':
        return {
          title: 'text-purple-700 animate-scale-in',
          subtitle: 'text-purple-500 animate-fade-in',
          container: 'bg-gradient-to-r from-purple-50 to-pink-50'
        };
      case 'dreamy':
        return {
          title: 'text-gradient animate-pulse-soft',
          subtitle: 'text-indigo-600 animate-float',
          container: 'bg-aurora-gradient'
        };
      default:
        return {
          title: 'text-gray-800',
          subtitle: 'text-gray-600',
          container: ''
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <Box
      className={`${classes.container} p-6 mb-6 rounded-lg relative overflow-hidden`}
      sx={{
        textAlign: centerAlign ? 'center' : 'left'
      }}
    >
      {/* Cuori decorativi se abilitati */}
      {showHearts && (
        <>
          <div className="absolute top-2 left-4 text-pink-300 text-xl animate-float opacity-40">💕</div>
          <div className="absolute top-4 right-6 text-purple-300 text-lg animate-float-delayed opacity-30">💖</div>
          <div className="absolute bottom-2 left-1/3 text-rose-300 text-sm animate-twinkle opacity-25">✨</div>
        </>
      )}
      
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Icona se fornita */}
        {icon && (
          <Box className="mb-3">
            <span className="text-4xl animate-heartbeat">
              {icon}
            </span>
          </Box>
        )}
        
        {/* Titolo principale */}
        <Typography
          variant="h3"
          component="h1"
          className={`${classes.title} font-bold mb-2`}
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </Typography>
        
        {/* Sottotitolo se fornito */}
        {subtitle && (
          <Typography
            variant="h6"
            component="p"
            className={`${classes.subtitle} font-medium`}
            sx={{
              maxWidth: 600,
              mx: centerAlign ? 'auto' : 0,
              lineHeight: 1.6
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {/* Elemento decorativo di sfondo */}
      <Box
        className="absolute inset-0 opacity-5"
        sx={{
          background: `radial-gradient(circle at 30% 30%, 
            rgba(236, 72, 153, 0.3) 0%, 
            rgba(168, 85, 247, 0.2) 50%, 
            transparent 70%)`
        }}
      />
    </Box>
  );
}