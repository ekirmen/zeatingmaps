// Hook para sincronizar datos del mapa (JSONB) con la tabla seats (relacional)
import { useState, useMemo, useRef } from 'react';

export const useMapaSeatsSync = (mapa, funcionId) => {
  const [error, setError] = useState(null);
  const seatsDataRef = useRef(null);
  const processedRef = useRef({ mapaId: null, funcionId: null });

  // Función para crear un hash del contenido del mapa ignorando estados de asientos (removida por no usarse)

  // Función para extraer asientos del mapa (sin useCallback para evitar dependencias circulares)
  const extractSeatsFromMapa = (mapa) => {
    if (!mapa?.contenido) {
      return [];
    }

    let allSeats = [];
    //
    //
    // console.log('🔍 [useMapaSeatsSync] Es array?', Array.isArray(mapa.contenido));

    // Si el contenido es un array, procesar cada elemento
    // Si es un objeto, buscar la propiedad 'elementos'
    const elementos = Array.isArray(mapa.contenido)
      ? mapa.contenido
      : mapa.contenido.elementos || [];

    if (Array.isArray(elementos)) {
      elementos.forEach((elemento, index) => {
        //
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
          // Procesando asiento individual

          // Determinar el estado del asiento basado en la información disponible
          let estado = elemento.estado || 'disponible';

          // Si el asiento tiene información de zona, usar esa información
          if (elemento.zona) {
            // Asiento en zona
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
          // Asiento agregado
          // Caso 3: Elemento que puede ser un asiento pero no tiene el tipo correcto
        } else if (elemento._id && elemento.nombre && (elemento.x !== undefined || elemento.posicion) && elemento.type !== 'mesa') {
          // Procesando elemento como asiento potencial

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
          // Asiento potencial agregado
        } else {
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
            elemento.type === 'shape' ||
            elemento.type === 'mesa' // Fix: Exclude tables from being treated as seats
          );

          if (isNonSeatElement) {
            // console.log(`🚫 [useMapaSeatsSync] Elemento ignorado (no es asiento):`, elemento._id);
            return; // Saltar este elemento
          }

          // ÚLTIMO RECURSO: Solo si tiene _id, coordenadas y NO es un elemento de fondo/texto
          if (elemento._id && (elemento.x !== undefined || elemento.y !== undefined || elemento.posicion)) {
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
          }
        }
      });
    }

    //
    return allSeats;
  };

  // Procesar asientos del mapa solo cuando realmente cambien los datos
  const seatsData = useMemo(() => {
    const currentMapaId = mapa?.id;
    const lastProcessed = processedRef.current;

    // Si ya procesamos estos datos exactos, devolver el cache
    if (lastProcessed.mapaId === currentMapaId &&
      lastProcessed.funcionId === funcionId &&
      seatsDataRef.current) {
      return seatsDataRef.current;
    }

    // Solo loggear cuando realmente procesamos
    //

    if (!mapa || !funcionId) {
      return [];
    }

    try {
      // Extraer asientos del mapa
      const seatsFromMapa = extractSeatsFromMapa(mapa);
      //

      // Guardar en cache
      seatsDataRef.current = seatsFromMapa;
      processedRef.current = {
        mapaId: currentMapaId,
        funcionId
      };

      return seatsFromMapa;
    } catch (err) {
      console.error('❌ [useMapaSeatsSync] Error procesando asientos:', err);
      setError(err);
      return [];
    }
  }, [mapa, funcionId]);

  return {
    seatsData,
    loading: false, // Siempre false ya que no usamos loading state
    error,
    extractSeatsFromMapa
  };
};

export default useMapaSeatsSync;
