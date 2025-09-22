// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useEffect, useCallback, useMemo } from 'react';

export const useMapaSeatsSync = (mapa, funcionId) => {
  console.log('🚀 [useMapaSeatsSync] Hook ejecutándose con:', { 
    mapa: !!mapa, 
    mapaId: mapa?.id, 
    contenidoLength: mapa?.contenido?.length,
    funcionId 
  });
  
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
          
          // Asignar zona automáticamente basándose en la posición
          let zonaAsignada = elemento.zona;
          if (!zonaAsignada) {
            // Lógica simple: asignar zona basándose en la posición Y
            const y = elemento.posicion?.y || elemento.y || 0;
            if (y < 200) {
              zonaAsignada = { id: 'zona_vip', nombre: 'Zona VIP', color: '#FFD700' };
            } else if (y < 400) {
              zonaAsignada = { id: 'zona_premium', nombre: 'Zona Premium', color: '#FF6B6B' };
            } else {
              zonaAsignada = { id: 'zona_general', nombre: 'Zona General', color: '#4CAF50' };
            }
          }

          const seatData = {
            ...elemento,
            mesa_id: null,
            mesa_nombre: null,
            zona: zonaAsignada,
            zonaId: zonaAsignada.id,
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
          
          // Filtrar elementos que NO son asientos
          const isNonSeatElement = elemento._id && (
            elemento._id.startsWith('bg_') || 
            elemento._id.startsWith('txt_') || 
            elemento._id.startsWith('shape_') ||
            elemento._id.startsWith('line_') ||
            elemento._id.startsWith('rect_') ||
            elemento._id.startsWith('circle_') ||
            elemento.type === 'background' ||
            elemento.type === 'text' ||
            elemento.type === 'line' ||
            elemento.type === 'shape'
          );
          
          if (isNonSeatElement) {
            console.log(`🚫 [useMapaSeatsSync] Elemento ignorado (no es asiento):`, elemento._id);
            return; // Saltar este elemento
          }
          
          // ÚLTIMO RECURSO: Solo si tiene _id, coordenadas y NO es un elemento de fondo/texto
          if (elemento._id && (elemento.x !== undefined || elemento.y !== undefined || elemento.posicion)) {
            console.log(`🚨 [useMapaSeatsSync] FORZANDO elemento como asiento:`, elemento._id);
            // Asignar zona automáticamente basándose en la posición
            let zonaAsignada = elemento.zona;
            if (!zonaAsignada) {
              // Lógica simple: asignar zona basándose en la posición Y
              const y = elemento.posicion?.y || elemento.y || 0;
              if (y < 200) {
                zonaAsignada = { id: 'zona_vip', nombre: 'Zona VIP', color: '#FFD700' };
              } else if (y < 400) {
                zonaAsignada = { id: 'zona_premium', nombre: 'Zona Premium', color: '#FF6B6B' };
              } else {
                zonaAsignada = { id: 'zona_general', nombre: 'Zona General', color: '#4CAF50' };
              }
            }

            const seatData = {
              ...elemento,
              mesa_id: null,
              mesa_nombre: null,
              zona: zonaAsignada,
              zonaId: zonaAsignada.id,
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
  }, [mapa?.id, mapa?.contenido?.length]);

  // Procesar asientos del mapa usando useMemo para evitar re-renders innecesarios
  const seatsData = useMemo(() => {
    console.log('🔄 [useMapaSeatsSync] useMemo ejecutándose con:', { 
      mapa: !!mapa, 
      funcionId,
      contenidoLength: mapa?.contenido?.length 
    });
    
    if (!mapa || !funcionId) {
      console.log('❌ [useMapaSeatsSync] No procesando - falta mapa o funcionId');
      return [];
    }

    try {
      // Extraer asientos del mapa
      const seatsFromMapa = extractSeatsFromMapa(mapa);
      console.log('✅ [useMapaSeatsSync] Asientos procesados:', seatsFromMapa.length);
      return seatsFromMapa;
    } catch (err) {
      console.error('❌ [useMapaSeatsSync] Error procesando asientos:', err);
      setError(err);
      return [];
    }
  }, [mapa, funcionId, extractSeatsFromMapa]);

  return {
    seatsData,
    loading,
    error,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
