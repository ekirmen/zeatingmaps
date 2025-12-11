import { useEffect, useRef } from 'react';
import { useSeatLockStore } from '../components/seatLockStore';

export 
  const { startAutoCleanup, stopAutoCleanup, cleanupCurrentSession, restoreCurrentSession } = useSeatLockStore();

  useEffect(() => {
    // Obtener intervalo de limpieza desde configuración
    const cleanupInterval = parseInt(localStorage.getItem('seat_cleanup_interval') || '5', 10);
    const enableAutoCleanup = localStorage.getItem('seat_auto_cleanup') !== 'false';


      return;
    }

    // Iniciar limpieza automática con intervalo configurable
    const cleanup = startAutoCleanup(cleanupInterval);
    cleanupRef.current = cleanup;

    // Función para limpiar al desmontar el componente
    const handleCleanup = async () => {
      await cleanupCurrentSession();
    };

    // Función para restaurar al regresar
    const handleRestore = async () => {
      await restoreCurrentSession();
    };

    // Event listeners para detectar cuando el usuario sale
    const handleBeforeUnload = (event) => {
      // Mostrar mensaje de confirmación si hay asientos seleccionados
      const { lockedSeats } = useSeatLockStore.getState();
      if (lockedSeats.length > 0) {
        event.preventDefault();
        event.returnValue = 'Tienes asientos seleccionados. ¿Estás seguro de que quieres salir?';
        return event.returnValue;
      }
    };

    const handlePageHide = async () => {
      await handleCleanup();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        await handleCleanup();
      } else if (document.visibilityState === 'visible') {
        await handleRestore();
      }
    };

    // Añadir event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar al desmontar
    return () => {
      // Limpiar bloqueos de la sesión actual
      handleCleanup();

      // Detener limpieza automática
      stopAutoCleanup();

      // Limpiar event listeners
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startAutoCleanup, stopAutoCleanup, cleanupCurrentSession]);

  // Función para limpiar manualmente
  const manualCleanup = async () => {
    await cleanupCurrentSession();
  };

  // Función para restaurar manualmente
  const manualRestore = async () => {
    await restoreCurrentSession();
  };

  return {
    manualCleanup,
    manualRestore
  };
};
