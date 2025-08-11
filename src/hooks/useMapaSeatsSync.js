// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useMapaSeatsSync = (mapa, funcionId) => {
  const [seatsData, setSeatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extraer asientos del mapa JSONB
  const extractSeatsFromMapa = (mapa) => {
    if (!mapa?.contenido || !Array.isArray(mapa.contenido)) {
      return [];
    }

    const allSeats = [];
    
    mapa.contenido.forEach(item => {
      if (item.type === 'mesa' && item.sillas && Array.isArray(item.sillas)) {
        console.log(`[SYNC] Mesa ${item._id} tiene ${item.sillas.length} sillas`);
        
        item.sillas.forEach(silla => {
          allSeats.push({
            _id: silla._id || `silla_${item._id}_${silla.numero || Math.random()}`,
            mesaId: item._id,
            zonaId: item.zona || 'zona_principal',
            nombre: silla.nombre || silla.numero || 'Asiento',
            x: silla.x || silla.posicion?.x || 0,
            y: silla.y || silla.posicion?.y || 0,
            ancho: silla.ancho || silla.width || 30,
            alto: silla.alto || silla.height || 30,
            // Datos del mapa (diseño visual)
            fromMapa: true,
            // Estado por defecto
            estado: 'disponible',
            status: 'available'
          });
        });
      }
    });

    console.log('[SYNC] Asientos extraídos del mapa:', allSeats);
    return allSeats;
  };

  // Cargar estado real de seats desde la base de datos
  const loadSeatsStatus = async (funcionId) => {
    if (!funcionId) return [];

    try {
      setLoading(true);
      
      const { data: seatsFromDB, error } = await supabase
        .from('seats')
        .select('*')
        .eq('funcion_id', funcionId);

      if (error) throw error;

      console.log('[SYNC] Seats cargados de DB:', seatsFromDB);
      return seatsFromDB || [];
      
    } catch (err) {
      console.error('[SYNC] Error cargando seats:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Cargar bloqueos activos
  const loadActiveLocks = async (funcionId) => {
    if (!funcionId) return [];

    try {
      const { data: locks, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', funcionId)
        .eq('status', 'locked')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      console.log('[SYNC] Locks activos cargados:', locks);
      return locks || [];
      
    } catch (err) {
      console.error('[SYNC] Error cargando locks:', err);
      return [];
    }
  };

  // Sincronizar datos del mapa con el estado real
  const syncMapaWithSeats = async () => {
    if (!mapa || !funcionId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Extraer asientos del mapa
      const seatsFromMapa = extractSeatsFromMapa(mapa);
      
      // 2. Cargar estado real de seats
      const seatsFromDB = await loadSeatsStatus(funcionId);
      
      // 3. Cargar bloqueos activos
      const activeLocks = await loadActiveLocks(funcionId);

      // 4. Combinar datos
      const syncedSeats = seatsFromMapa.map(seatFromMapa => {
        // Buscar seat correspondiente en la DB
        const dbSeat = seatsFromDB.find(s => 
          s._id === seatFromMapa._id || 
          (s.zona === seatFromMapa.zonaId && s.numero === seatFromMapa.nombre)
        );

        // Buscar lock activo
        const activeLock = activeLocks.find(l => 
          l.seat_id === seatFromMapa._id || 
          l.seat_id === dbSeat?._id
        );

        // Determinar estado final
        let estado = 'disponible';
        let status = 'available';

        if (dbSeat) {
          status = dbSeat.status;
          if (dbSeat.status === 'sold') {
            estado = 'vendido';
          } else if (dbSeat.status === 'reserved') {
            estado = 'reservado';
          }
        }

        if (activeLock) {
          estado = 'bloqueado_por_otro';
          status = 'locked';
        }

        return {
          ...seatFromMapa,
          // Estado real de la DB
          status,
          estado,
          // Datos adicionales de la DB
          price: dbSeat?.price,
          user_id: dbSeat?.user_id,
          // Lock info
          locked_by: activeLock?.session_id,
          lock_expires_at: activeLock?.expires_at
        };
      });

      console.log('[SYNC] Asientos sincronizados:', syncedSeats);
      setSeatsData(syncedSeats);

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

  return {
    seatsData,
    loading,
    error,
    syncMapaWithSeats,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
