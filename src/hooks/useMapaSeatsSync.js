// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback } from 'react';

export const useMapaSeatsSync = (mapa, funcionId) => {
  console.log('🚀 [useMapaSeatsSync] Hook ejecutándose con:', { 
    mapa: !!mapa, 
    mapaId: mapa?.id, 
    contenidoLength: mapa?.contenido?.length,
    funcionId 
  });
  
  const [seatsData, setSeatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractSeatsFromMapa = useCallback((mapa) => {
    if (!mapa?.contenido) {
      console.log('🔍 [useMapaSeatsSync] No hay contenido en el mapa');
      return [];
    }

    let allSeats = [];
    console.log('🔍 [useMapaSeatsSync] Procesando mapa con', mapa.contenido.length, 'elementos');
    console.log('🔍 [useMapaSeatsSync] Tipo de contenido:', typeof mapa.contenido);
    console.log('🔍 [useMapaSeatsSync] Es array?', Array.isArray(mapa.contenido));

    // Si el contenido es un array, procesar cada elemento
    if (Array.isArray(mapa.contenido)) {
      mapa.contenido.forEach((elemento, index) => {
        console.log(`🔍 [useMapaSeatsSync] Elemento ${index}:`, {
          _id: elemento._id,
          type: elemento.type,
          hasSillas: !!elemento.sillas,
          sillasLength: elemento.sillas?.length,
          nombre: elemento.nombre,
          shape: elemento.shape,
          x: elemento.x,
          y: elemento.y,
          posicion: elemento.posicion,
          fill: elemento.fill,
          estado: elemento.estado
        });
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
        } else if (elemento._id && (elemento.type === 'silla' || elemento.type === 'circle' || elemento.type === 'rect')) {
          console.log(`✅ [useMapaSeatsSync] Procesando asiento individual:`, elemento._id);
          
          // Determinar el estado del asiento basado en la información disponible
          let estado = elemento.estado || 'disponible';
          
          // Si el asiento tiene información de zona, usar esa información
          if (elemento.zona) {
            console.log(`🎯 [useMapaSeatsSync] Asiento ${elemento._id} en zona:`, elemento.zona.nombre);
          }
          
          const seatData = {
            ...elemento,
            mesa_id: null,
            mesa_nombre: null,
            zona: elemento.zona || null,
            x: elemento.posicion?.x || elemento.x || 0,
            y: elemento.posicion?.y || elemento.y || 0,
            estado: estado,
            status: estado === 'disponible' ? 'available' : 'occupied',
            _id: elemento._id,
            nombre: elemento.nombre || elemento.numero || elemento._id,
            width: elemento.width || 20,
            height: elemento.height || 20,
            // Agregar propiedades adicionales para el sistema de colores
            fill: elemento.fill || null, // Color original del asiento
            empty: elemento.empty !== undefined ? elemento.empty : false
          };
          allSeats.push(seatData);
          console.log(`✅ [useMapaSeatsSync] Asiento agregado:`, {
            _id: seatData._id,
            estado: seatData.estado,
            zona: seatData.zona?.nombre,
            fill: seatData.fill
          });
        // Caso 3: Elemento que puede ser un asiento pero no tiene el tipo correcto
        } else if (elemento._id && elemento.nombre && (elemento.x !== undefined || elemento.posicion)) {
          console.log(`🎯 [useMapaSeatsSync] Procesando elemento como asiento potencial:`, elemento._id);
          
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
            height: elemento.height || 20,
            fill: elemento.fill || null,
            empty: elemento.empty !== undefined ? elemento.empty : false
          };
          allSeats.push(seatData);
          console.log(`🎯 [useMapaSeatsSync] Asiento potencial agregado:`, {
            _id: seatData._id,
            estado: seatData.estado,
            zona: seatData.zona?.nombre,
            fill: seatData.fill
          });
        } else {
          console.log(`❌ [useMapaSeatsSync] Elemento no reconocido:`, {
            _id: elemento._id,
            type: elemento.type,
            hasSillas: !!elemento.sillas,
            nombre: elemento.nombre,
            x: elemento.x,
            posicion: elemento.posicion
          });
          
          // ÚLTIMO RECURSO: Si tiene _id y coordenadas, tratarlo como asiento
          if (elemento._id && (elemento.x !== undefined || elemento.y !== undefined || elemento.posicion)) {
            console.log(`🚨 [useMapaSeatsSync] FORZANDO elemento como asiento:`, elemento._id);
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
              height: elemento.height || 20,
              fill: elemento.fill || null,
              empty: elemento.empty !== undefined ? elemento.empty : false
            };
            allSeats.push(seatData);
            console.log(`🚨 [useMapaSeatsSync] Asiento forzado agregado:`, {
              _id: seatData._id,
              estado: seatData.estado,
              zona: seatData.zona?.nombre,
              fill: seatData.fill
            });
          }
        }
      });
    }

    console.log(`🎫 [useMapaSeatsSync] Total asientos procesados:`, allSeats.length);
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
    console.log('🔄 [useMapaSeatsSync] useEffect ejecutándose con:', { 
      mapa: !!mapa, 
      funcionId,
      contenidoLength: mapa?.contenido?.length 
    });
    
    if (mapa && funcionId) {
      console.log('✅ [useMapaSeatsSync] Ejecutando syncMapaWithSeats');
      syncMapaWithSeats();
    } else {
      console.log('❌ [useMapaSeatsSync] No ejecutando sync - falta mapa o funcionId');
    }
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
