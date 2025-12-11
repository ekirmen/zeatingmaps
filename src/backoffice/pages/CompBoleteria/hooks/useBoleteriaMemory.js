import { useState, useEffect } from 'react';

const STORAGE_KEY = 'boleteria_last_state';

export const useBoleteriaMemory = () => {
  const [lastState, setLastState] = useState({
    selectedEvent: null,
    selectedFuncion: null,
    selectedPlantilla: null
    // NO incluir carrito - se debe limpiar al actualizar
  });

  // Cargar estado guardado al inicializar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLastState(parsed);
      }
    } catch (error) {
      console.error('Error cargando estado de Boletería:', error);
    }
  }, []);

  // Guardar estado cuando cambie (sin carrito)
  const saveState = (newState) => {
    try {
      const stateToSave = {
        selectedEvent: newState.selectedEvent?.id || newState.selectedEvent?._id,
        selectedFuncion: newState.selectedFuncion?.id || newState.selectedFuncion?._id,
        selectedPlantilla: newState.selectedPlantilla?.id || newState.selectedPlantilla?._id,
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setLastState(stateToSave);
    } catch (error) {
      console.error('Error guardando estado de Boletería:', error);
    }
  };

  // Restaurar estado completo (sin carrito)
  const restoreState = (eventos, funciones, plantillas) => {

      return null;
    }

    // Verificar que el evento aún existe
    const event = eventos.find(e =>
      e.id === lastState.selectedEvent || e._id === lastState.selectedEvent
    );

    if (!event) {
      return null;
    }

    // Verificar que la función aún existe
    const funcion = funciones.find(f =>
      f.id === lastState.selectedFuncion || f._id === lastState.selectedFuncion
    );

    if (!funcion) {
      return null;
    }

    // Verificar que la plantilla aún existe
    let plantilla = null;
    if (lastState.selectedPlantilla) {
      plantilla = plantillas.find(p =>
        p.id === lastState.selectedPlantilla || p._id === lastState.selectedPlantilla
      );
    }

    return {
      selectedEvent: event,
      selectedFuncion: funcion,
      selectedPlantilla: plantilla
      // NO incluir carrito - debe estar vacío al restaurar
    };
  };

  // Limpiar estado guardado
  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastState({
        selectedEvent: null,
        selectedFuncion: null,
        selectedPlantilla: null
      });
    } catch (error) {
      console.error('Error limpiando estado de Boletería:', error);
    }
  };

  return {
    lastState,
    saveState,
    restoreState,
    clearState
  };
};

export default useBoleteriaMemory;
