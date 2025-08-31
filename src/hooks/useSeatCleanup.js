import { useEffect, useRef } from 'react';
import { useSeatLockStore } from '../components/seatLockStore';

export const useSeatCleanup = () => {
  const cleanupRef = useRef(null);
  const { startAutoCleanup, stopAutoCleanup, cleanupCurrentSession, restoreCurrentSession } = useSeatLockStore();

  useEffect(() => {
    console.log('🔄 [useSeatCleanup] Iniciando sistema de limpieza automática...');
    
    // Obtener intervalo de limpieza desde configuración
    const cleanupInterval = parseInt(localStorage.getItem('seat_cleanup_interval') || '5', 10);
    const enableAutoCleanup = localStorage.getItem('seat_auto_cleanup') !== 'false';
    
    if (!enableAutoCleanup) {
      console.log('⏸️ [useSeatCleanup] Limpieza automática deshabilitada');
      return;
    }
    
    // Iniciar limpieza automática con intervalo configurable
    const cleanup = startAutoCleanup(cleanupInterval);
    cleanupRef.current = cleanup;

    // Función para limpiar al desmontar el componente
    const handleCleanup = async () => {
      console.log('🧹 [useSeatCleanup] Limpiando bloqueos al salir...');
      await cleanupCurrentSession();
    };

    // Función para restaurar al regresar
    const handleRestore = async () => {
      console.log('🔄 [useSeatCleanup] Restaurando bloqueos al regresar...');
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
        console.log('👁️ [useSeatCleanup] Página oculta, limpiando bloqueos...');
        await handleCleanup();
      } else if (document.visibilityState === 'visible') {
        console.log('👁️ [useSeatCleanup] Página visible, restaurando bloqueos...');
        await handleRestore();
      }
    };

    // Añadir event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar al desmontar
    return () => {
      console.log('🛑 [useSeatCleanup] Desmontando sistema de limpieza...');
      
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
    console.log('🧹 [useSeatCleanup] Limpieza manual iniciada...');
    await cleanupCurrentSession();
  };

  // Función para restaurar manualmente
  const manualRestore = async () => {
    console.log('🔄 [useSeatCleanup] Restauración manual iniciada...');
    await restoreCurrentSession();
  };

  return {
    manualCleanup,
    manualRestore
  };
};
