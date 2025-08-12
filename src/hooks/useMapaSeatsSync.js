// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useMapaSeatsSync = (mapa, funcionId) => {
  const [seatsData, setSeatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractSeatsFromMapa = useCallback((mapa) => {
    if (!mapa?.contenido) {
      console.log('❌ [MAPA_SYNC] No hay contenido en el mapa');
      return [];
    }

    console.log('🔍 [MAPA_SYNC] Extrayendo asientos del mapa:', {
      tipo: typeof mapa.contenido,
      esArray: Array.isArray(mapa.contenido),
      longitud: mapa.contenido.length,
      contenido: mapa.contenido
    });

    let allSeats = [];

    // Si el contenido es un array, procesar cada elemento
    if (Array.isArray(mapa.contenido)) {
      mapa.contenido.forEach((elemento, index) => {
        console.log(`🏗️ [MAPA_SYNC] Procesando elemento ${index}:`, {
          id: elemento._id,
          nombre: elemento.nombre,
          tipo: elemento.type,
          shape: elemento.shape,
          sillas: elemento.sillas?.length || 0
        });
        
        // ESTRUCTURA EXACTA DEL JSON DEL USUARIO
        // Si es una mesa con sillas
        if (elemento._id && elemento.sillas && Array.isArray(elemento.sillas)) {
          console.log(`✅ [MAPA_SYNC] Mesa válida encontrada: ${elemento.nombre} con ${elemento.sillas.length} sillas`);
          
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
              console.log(`🪑 [MAPA_SYNC] Asiento ${sillaIndex + 1} extraído:`, seatData);
            } else {
              console.warn(`⚠️ [MAPA_SYNC] Silla ${sillaIndex + 1} sin ID válido:`, silla);
            }
          });
        } else {
          console.log(`ℹ️ [MAPA_SYNC] Elemento ${index} no es una mesa válida:`, {
            tieneId: !!elemento._id,
            tieneSillas: !!elemento.sillas,
            esArraySillas: Array.isArray(elemento.sillas)
          });
        }
      });
    } else {
      console.warn('⚠️ [MAPA_SYNC] El contenido del mapa no es un array:', mapa.contenido);
    }

    console.log(`✅ [MAPA_SYNC] Total de asientos extraídos: ${allSeats.length}`);
    return allSeats;
  }, []);

  // Sincronizar datos del mapa con el estado real
  const syncMapaWithSeats = async () => {
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
  };

  // Sincronizar cuando cambie el mapa o funcionId
  useEffect(() => {
    syncMapaWithSeats();
  }, [mapa, funcionId]);

  return {
    seatsData,
    loading,
    error,
    syncMapaWithSeats,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
