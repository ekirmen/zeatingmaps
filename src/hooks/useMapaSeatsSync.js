// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback } from 'react';

export const useMapaSeatsSync = (mapa, funcionId) => {
  const [seatsData, setSeatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractSeatsFromMapa = useCallback((mapa) => {
    if (!mapa?.contenido) {
      return [];
    }

    let allSeats = [];

    // Si el contenido es un array, procesar cada elemento
    if (Array.isArray(mapa.contenido)) {
      mapa.contenido.forEach((elemento, index) => {
        // ESTRUCTURA EXACTA DEL JSON DEL USUARIO
        // Caso 1: Mesa con un arreglo de sillas
        if (elemento._id && elemento.sillas && Array.isArray(elemento.sillas)) {
          elemento.sillas.forEach((silla, sillaIndex) => {
            if (silla._id) {
              const seatData = {
                ...silla,
                mesa_id: elemento._id,
                mesa_nombre: elemento.nombre || `Mesa ${index + 1}`,
                zona: elemento.zona || silla.zona || null,
                shape: elemento.shape,
                // Asegurar que las coordenadas estén disponibles
                x: silla.posicion?.x || silla.x || 0,
                y: silla.posicion?.y || silla.y || 0,
                // Asegurar que el estado esté disponible
                estado: silla.estado || 'disponible',
                status: silla.estado === 'disponible' ? 'available' : 'occupied',
                // Agregar propiedades adicionales para compatibilidad
                _id: silla._id,
                nombre: silla.nombre || silla.numero || silla._id,
                width: silla.width || 20,
                height: silla.height || 20
              };
              
              allSeats.push(seatData);
            }
          });
        // Caso 2: Asiento individual suelto (no dentro de una mesa)
        } else if (elemento._id && elemento.type === 'silla') {
          const seatData = {
            ...elemento,
            mesa_id: null,
            mesa_nombre: null,
            zona: elemento.zona || null,
            x: elemento.posicion?.x || elemento.x || 0,
            y: elemento.posicion?.y || elemento.y || 0,
            estado: elemento.estado || 'disponible',
            status: elemento.estado === 'disponible' ? 'available' : 'occupied',
            _id: elemento._id,
            nombre: elemento.nombre || elemento.numero || elemento._id,
            width: elemento.width || 20,
            height: elemento.height || 20
          };
          allSeats.push(seatData);
        }
      });
    }

    return allSeats;
  }, []);

  // Sincronizar datos del mapa con el estado real
  const syncMapaWithSeats = useCallback(async () => {
    if (!mapa || !funcionId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Extraer asientos del mapa
      const seatsFromMapa = extractSeatsFromMapa(mapa);
      
      // TEMPORAL: Solo usar asientos del mapa, sin sincronización
      setSeatsData(seatsFromMapa);

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mapa, funcionId, extractSeatsFromMapa]);

  // Sincronizar cuando cambie el mapa o funcionId
  useEffect(() => {
    syncMapaWithSeats();
  }, [mapa, funcionId, syncMapaWithSeats]);

  return {
    seatsData,
    loading,
    error,
    syncMapaWithSeats,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
