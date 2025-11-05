import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const MapShortRoute = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const funcion = searchParams.get('funcion');
    
    // Asegurar que el session_id se inicialice antes de redirigir
    // Esto previene problemas con session_id no inicializado
    if (typeof window !== 'undefined' && window.crypto) {
      const storedSessionId = localStorage.getItem('anonSessionId');
      if (!storedSessionId) {
        // Generar session_id si no existe
        const newSessionId = crypto.randomUUID();
        localStorage.setItem('anonSessionId', newSessionId);
        console.log('[MapShortRoute] Session ID inicializado:', newSessionId);
      }
    }
    
    if (funcion) {
      const funcionId = parseInt(funcion, 10);
      if (Number.isFinite(funcionId) && funcionId > 0) {
        navigate(`/store/seat-selection/${funcionId}`, { replace: true });
      } else {
        console.warn('[MapShortRoute] funcion inválido:', funcion);
        navigate('/store', { replace: true });
      }
    } else {
      navigate('/store', { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
};

export default MapShortRoute;


