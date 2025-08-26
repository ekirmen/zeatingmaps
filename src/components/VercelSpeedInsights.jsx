import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Componente wrapper para Vercel Speed Insights
const VercelSpeedInsights = () => {
  // Solo renderizar en producción para evitar ruido en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [SPEED-INSIGHTS] Modo desarrollo - Speed Insights deshabilitado');
    return null;
  }

  console.log('⚡ [SPEED-INSIGHTS] Inicializando Vercel Speed Insights en producción');
  return <SpeedInsights />;
};

export default VercelSpeedInsights;
