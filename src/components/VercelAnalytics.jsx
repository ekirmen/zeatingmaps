import React from 'react';
import { Analytics } from '@vercel/analytics/react';

// Componente wrapper para Vercel Analytics
const VercelAnalytics = () => {
  // Solo renderizar en producción para evitar ruido en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [ANALYTICS] Modo desarrollo - Analytics deshabilitado');
    return null;
  }

  console.log('📊 [ANALYTICS] Inicializando Vercel Analytics en producción');
  return <Analytics />;
};

export default VercelAnalytics;
