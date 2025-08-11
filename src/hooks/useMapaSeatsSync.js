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
       console.log('[SYNC] No hay contenido del mapa o no es array');
       return [];
     }

     const allSeats = [];
     
     console.log('[SYNC] Analizando contenido del mapa:', mapa.contenido);
     
     mapa.contenido.forEach((item, index) => {
       console.log(`[SYNC] Elemento ${index}:`, item);
       
       // Buscar asientos en diferentes estructuras posibles
       if (item.type === 'mesa') {
         console.log(`[SYNC] Mesa encontrada: ${item._id}`);
         
         // Verificar si tiene sillas directamente
         if (item.sillas && Array.isArray(item.sillas)) {
           console.log(`[SYNC] Mesa ${item._id} tiene ${item.sillas.length} sillas en .sillas`);
           
           item.sillas.forEach((silla, sillaIndex) => {
             console.log(`[SYNC] Silla ${sillaIndex}:`, silla);
             allSeats.push({
               _id: silla._id || `silla_${item._id}_${sillaIndex}`,
               mesaId: item._id,
               zonaId: item.zona || 'zona_principal',
               nombre: silla.nombre || silla.numero || `Asiento ${sillaIndex + 1}`,
               x: silla.x || silla.posicion?.x || 0,
               y: silla.y || silla.posicion?.y || 0,
               ancho: silla.ancho || silla.width || 30,
               alto: silla.alto || silla.height || 30,
               fromMapa: true,
               estado: 'disponible',
               status: 'available'
             });
           });
         }
         
         // Verificar si tiene asientos en otra propiedad
         if (item.asientos && Array.isArray(item.asientos)) {
           console.log(`[SYNC] Mesa ${item._id} tiene ${item.asientos.length} asientos en .asientos`);
           
           item.asientos.forEach((asiento, asientoIndex) => {
             console.log(`[SYNC] Asiento ${asientoIndex}:`, asiento);
             allSeats.push({
               _id: asiento._id || `asiento_${item._id}_${asientoIndex}`,
               mesaId: item._id,
               zonaId: item.zona || 'zona_principal',
               nombre: asiento.nombre || asiento.numero || `Asiento ${asientoIndex + 1}`,
               x: asiento.x || asiento.posicion?.x || 0,
               y: asiento.y || asiento.posicion?.y || 0,
               ancho: asiento.ancho || asiento.width || 30,
               alto: asiento.alto || asiento.height || 30,
               fromMapa: true,
               estado: 'disponible',
               status: 'available'
             });
           });
         }
         
         // Verificar si tiene sillas en otra propiedad
         if (item.sillas && Array.isArray(item.sillas)) {
           console.log(`[SYNC] Mesa ${item._id} tiene ${item.sillas.length} sillas en .sillas`);
         }
         
         // Si no tiene sillas, crear asientos por defecto alrededor de la mesa
         if (!item.sillas && !item.asientos) {
           console.log(`[SYNC] Mesa ${item._id} no tiene sillas, creando asientos por defecto`);
           
           // Crear 8 asientos alrededor de la mesa
           const asientosPorDefecto = 8;
           for (let i = 0; i < asientosPorDefecto; i++) {
             const angulo = (i * 2 * Math.PI) / asientosPorDefecto;
             const radio = 80; // Distancia desde el centro de la mesa
             
             const x = (item.posicion?.x || item.x || 0) + Math.cos(angulo) * radio;
             const y = (item.posicion?.y || item.y || 0) + Math.sin(angulo) * radio;
             
             allSeats.push({
               _id: `silla_defecto_${item._id}_${i}`,
               mesaId: item._id,
               zonaId: item.zona || 'zona_principal',
               nombre: `Asiento ${i + 1}`,
               x: x,
               y: y,
               ancho: 30,
               alto: 30,
               fromMapa: true,
               estado: 'disponible',
               status: 'available'
             });
           }
         }
       }
       
       // Buscar asientos sueltos
       if (item.type === 'silla' || item.type === 'asiento') {
         console.log(`[SYNC] Asiento suelto encontrado: ${item._id}`);
         allSeats.push({
           _id: item._id || `asiento_suelto_${index}`,
           mesaId: null,
           zonaId: item.zona || 'zona_principal',
           nombre: item.nombre || item.numero || `Asiento ${index + 1}`,
           x: item.x || item.posicion?.x || 0,
           y: item.y || item.posicion?.y || 0,
           ancho: item.ancho || item.width || 30,
           alto: item.alto || item.height || 30,
           fromMapa: true,
           estado: 'disponible',
           status: 'available'
         });
       }
     });

     console.log('[SYNC] Total de asientos extraídos del mapa:', allSeats.length);
     console.log('[SYNC] Asientos extraídos:', allSeats);
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
