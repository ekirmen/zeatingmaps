// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useMapaSeatsSync = (mapa, funcionId) => {
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
        
        // Si es una mesa con sillas
        if (elemento._id && (elemento.shape === 'circle' || elemento.shape === 'rect')) {
          console.log(`[EXTRACT_SEATS] Encontrada mesa:`, elemento);
          
          // Buscar sillas dentro de la mesa
          if (elemento.sillas && Array.isArray(elemento.sillas) && elemento.sillas.length > 0) {
            console.log(`[EXTRACT_SEATS] Sillas encontradas en mesa:`, elemento.sillas);
            elemento.sillas.forEach(silla => {
              if (silla._id) {
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
                  status: silla.estado === 'disponible' ? 'available' : 'occupied'
                });
              }
            });
          } else {
            // Si no hay sillas definidas, crear asientos por defecto alrededor de la mesa
            console.log(`[EXTRACT_SEATS] Creando asientos por defecto para mesa:`, elemento);
            const defaultSeats = createDefaultSeatsForTable(elemento, index);
            allSeats.push(...defaultSeats);
          }
        }
        
        // Si es una zona con asientos
        if (elemento._id && elemento.type === 'zona' && elemento.asientos) {
          console.log(`[EXTRACT_SEATS] Encontrada zona con asientos:`, elemento);
          if (Array.isArray(elemento.asientos)) {
            elemento.asientos.forEach(asiento => {
              if (asiento._id) {
                allSeats.push({
                  ...asiento,
                  zona_id: elemento._id,
                  zona_nombre: elemento.nombre || `Zona ${index + 1}`
                });
              }
            });
          }
        }
        
        // Si es directamente un asiento
        if (elemento._id && elemento.type === 'asiento') {
          console.log(`[EXTRACT_SEATS] Asiento directo encontrado:`, elemento);
          allSeats.push(elemento);
        }
      });
    }

    console.log(`[EXTRACT_SEATS] Total de asientos extraídos: ${allSeats.length}`);
    console.log('[EXTRACT_SEATS] Asientos extraídos:', allSeats);
    return allSeats;
  }, []);

  const createDefaultSeatsForTable = useCallback((mesa, index) => {
    const seats = [];
    const tableWidth = mesa.width || 120;
    const tableHeight = mesa.height || 120;
    const centerX = mesa.x || 0;
    const centerY = mesa.y || 0;
    
    // Crear 4 asientos alrededor de la mesa
    const positions = [
      { x: centerX - tableWidth/2 - 30, y: centerY, fila: 'A', numero: '1' },
      { x: centerX + tableWidth/2 + 30, y: centerY, fila: 'A', numero: '2' },
      { x: centerX, y: centerY - tableHeight/2 - 30, fila: 'B', numero: '1' },
      { x: centerX, y: centerY + tableHeight/2 + 30, fila: 'B', numero: '2' }
    ];
    
    positions.forEach((pos, seatIndex) => {
      seats.push({
        _id: `default_seat_${mesa._id}_${seatIndex}`,
        x: pos.x,
        y: pos.y,
        fila: pos.fila,
        numero: pos.numero,
        mesa_id: mesa._id,
        mesa_nombre: mesa.nombre || `Mesa ${index + 1}`,
        zona: mesa.zona || null,
        shape: 'circle',
        width: 20,
        height: 20,
        type: 'asiento'
      });
    });
    
    return seats;
  }, []);

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
