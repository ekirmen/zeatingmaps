import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Componente wrapper para Vercel Speed Insights
const VercelSpeedInsights = () => {
  // Solo renderizar en producción para evitar ruido en desarrollo

  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  return <SpeedInsights />;
};

export default VercelSpeedInsights;
