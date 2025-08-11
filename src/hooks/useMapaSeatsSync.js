// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useMapaSeatsSync = (mapa, funcionId) => {
  console.log('[HOOK_DEBUG] useMapaSeatsSync llamado con:', { mapa: !!mapa, funcionId, mapaContenido: mapa?.contenido });
  
  const [seatsData, setSeatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractSeatsFromMapa = useCallback((mapa) => {
    if (!mapa?.contenido) {
      console.log('[EXTRACT_SEATS] No hay contenido en el mapa');
      return [];
    }

    console.log('[EXTRACT_SEATS] Contenido del mapa:', mapa.contenido);
    console.log('[EXTRACT_SEATS] Tipo de contenido:', typeof mapa.contenido);
    console.log('[EXTRACT_SEATS] Es array:', Array.isArray(mapa.contenido));

    let allSeats = [];

    // Si el contenido es un array, procesar cada elemento
    if (Array.isArray(mapa.contenido)) {
      mapa.contenido.forEach((elemento, index) => {
        console.log(`[EXTRACT_SEATS] Procesando elemento ${index}:`, elemento);
        
        // ESTRUCTURA EXACTA DEL JSON DEL USUARIO
        // Si es una mesa con sillas
        if (elemento._id && elemento.sillas && Array.isArray(elemento.sillas)) {
          console.log(`[EXTRACT_SEATS] Encontrada mesa con sillas:`, elemento);
          
          elemento.sillas.forEach(silla => {
            if (silla._id) {
              console.log(`[EXTRACT_SEATS] Procesando silla:`, silla);
              allSeats.push({
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
                nombre: silla.nombre || silla._id,
                width: silla.width || 20,
                height: silla.height || 20
              });
            }
          });
        }
      });
    }

    console.log(`[EXTRACT_SEATS] Total de asientos extraídos: ${allSeats.length}`);
    console.log('[EXTRACT_SEATS] Asientos extraídos:', allSeats);
    return allSeats;
  }, []);

  // Sincronizar datos del mapa con el estado real
  const syncMapaWithSeats = async () => {
    if (!mapa || !funcionId) {
      console.log('[SYNC] No hay mapa o funcionId:', { mapa: !!mapa, funcionId });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[SYNC] Iniciando sincronización para funcionId:', funcionId);
      console.log('[SYNC] Mapa recibido:', mapa);

      // 1. Extraer asientos del mapa
      const seatsFromMapa = extractSeatsFromMapa(mapa);
      console.log('[SYNC] Asientos extraídos del mapa:', seatsFromMapa.length);
      
      // TEMPORAL: Solo usar asientos del mapa, sin sincronización
      console.log('[SYNC] Usando solo asientos del mapa (sin sincronización)');
      setSeatsData(seatsFromMapa);

    } catch (err) {
      console.error('[SYNC] Error en sincronización:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar cuando cambie el mapa o funcionId
  useEffect(() => {
    syncMapaWithSeats();
  }, [mapa, funcionId]);

  // DEBUG: Loggear cuando seatsData cambie
  useEffect(() => {
    console.log('[HOOK_DEBUG] seatsData actualizado:', seatsData);
  }, [seatsData]);

  return {
    seatsData,
    loading,
    error,
    syncMapaWithSeats,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
