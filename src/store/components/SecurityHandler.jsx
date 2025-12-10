import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from '../../utils/antdComponents';

/**
 * Componente de seguridad para manejar par¡metros sensibles en la URL
 * Previene la exposici³n de credenciales en logs, historial del navegador, etc.
 */
const SecurityHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si hay par¡metros sensibles en la URL
    const urlParams = new URLSearchParams(location.search);

    // Par¡metros realmente sensibles (credenciales directas)
    const sensitiveParams = ['email', 'password', 'key', 'secret'];

    // Par¡metros de autenticaci³n que pueden estar en la URL (no remover)
    const authParams = ['token', 'access_token', 'refresh_token', 'code'];

    // Verificar solo par¡metros realmente sensibles
    const hasSensitiveData = sensitiveParams.some(param => urlParams.has(param));

    if (hasSensitiveData) {
      // Mostrar advertencia de seguridad
      message.warning({
        content: 'š ï¸ Detectados par¡metros sensibles en la URL. Por seguridad, estos ser¡n removidos.',
        duration: 5,
      });

      // Crear nueva URL sin par¡metros sensibles (pero mantener auth params)
      const cleanParams = new URLSearchParams();
      urlParams.forEach((value, key) => {
        if (!sensitiveParams.includes(key)) {
          cleanParams.set(key, value);
        }
      });

      // Construir nueva URL limpia
      const newSearch = cleanParams.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

      // Reemplazar la URL actual sin par¡metros sensibles
      window.history.replaceState({}, '', newUrl);

      // Log de seguridad (sin datos sensibles)
    }
  }, [location, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { hash, pathname } = location;
    if (!hash) return;

    // Evitar redirecci³n si ya estamos en la pantalla correcta
    if (pathname.startsWith('/store/reset-password')) return;

    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const authFlowType = hashParams.get('type');

    if (authFlowType === 'recovery' && pathname.startsWith('/store')) {
      // Mantener el hash para que Supabase pueda procesar el token
      navigate(`/store/reset-password${hash}`, { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
};

export default SecurityHandler;


