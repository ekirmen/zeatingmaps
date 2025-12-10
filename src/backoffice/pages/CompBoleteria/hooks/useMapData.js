import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from '../../../../utils/antdComponents';
import { fetchMapa, fetchZonasPorSala } from '../../../../services/supabaseServices';
import { fetchSeatsByFuncion } from '../../../services/supabaseSeats';

export const useMapData = (selectedFuncion) => {
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);

  // Memoizar el ID de la sala para evitar re-ejecuciones innecesarias
  const salaId = useMemo(() => {
    if (!selectedFuncion?.sala) return null;
    return typeof selectedFuncion.sala === 'object' && selectedFuncion.sala !== null
      ? selectedFuncion.sala._id || selectedFuncion.sala.id || null
      : selectedFuncion.sala;
  }, [selectedFuncion?.sala]);

  // Memoizar el ID de la funci³n
  const funcionId = useMemo(() =>
    selectedFuncion?.id || selectedFuncion?._id,
    [selectedFuncion?.id, selectedFuncion?._id]
  );

  // Memoizar la funci³n de carga de datos
  const loadData = useCallback(async () => {
    if (!salaId) {
      setMapa(null);
      setZonas([]);
      return;
    }

    try {
      const [m, zs, seats] = await Promise.all([
        fetchMapa(salaId),
        fetchZonasPorSala(salaId),
        funcionId ? fetchSeatsByFuncion(funcionId) : Promise.resolve([]),
      ]);
      const seatMap = seats.reduce((acc, s) => {
        acc[s.id || s._id] = { estado: s.estado, bloqueado: s.bloqueado };
        return acc;
      }, {});

      // Convertir el formato de datos si es necesario
      let mapped;

      // Si m.contenido es un string JSON, parsearlo
      let contenidoData = m.contenido;
      if (typeof m.contenido === 'string') {
        try {
          contenidoData = JSON.parse(m.contenido);
        } catch (err) {
          console.error('Œ Error parseando JSON del contenido:', err);
          contenidoData = m.contenido;
        }
      }

      // Si es un objeto, buscar la propiedad 'elementos'
      const elementos = Array.isArray(contenidoData)
        ? contenidoData
        : contenidoData.elementos || [];

      if (elementos && Array.isArray(elementos)) {
        // Formato esperado por SeatingMap (array de contenido)
        mapped = {
          ...m,
          contenido: elementos.map(el => ({
            ...el,
            sillas: el.sillas.map(s => {
              const st = seatMap[s._id || s.id];
              if (!st) {
                // Si no hay datos en seatMap, asumir que est¡ disponible
                return { ...s, estado: 'disponible' };
              }

              // Mapear estados correctamente
              let estado = 'disponible';
              if (st.estado === 'vendido') {
                estado = 'vendido';
              } else if (st.estado === 'reservado') {
                estado = 'reservado';
              } else if (st.estado === 'bloqueado' || st.status === 'locked') {
                estado = 'bloqueado';
              }

              return { ...s, estado };
            })
          }))
        };
      } else if (contenidoData && contenidoData.zonas) {
        // Convertir formato de zonas a formato de contenido
        const contenido = contenidoData.zonas.map((zona, zonaIndex) => ({
          _id: `zona-${zona.id || zonaIndex}`,
          type: 'zona',
          nombre: zona.nombre || `Zona ${zonaIndex + 1}`,
          posicion: { x: 0, y: 0 },
          width: 800,
          height: 600,
          zona: zona.id,
          sillas: zona.asientos.map((asiento, asientoIndex) => ({
            _id: asiento._id || `asiento-${zonaIndex}-${asientoIndex}`,
            nombre: asiento.nombre || `${asientoIndex + 1}`,
            posicion: { x: asiento.x || 0, y: asiento.y || 0 },
            width: asiento.ancho || 20,
            height: asiento.alto || 20,
            zona: zona.id,
            estado: 'disponible',
            color: '#60a5fa' // Color por defecto para asientos disponibles
          }))
        }));

        mapped = {
          ...m,
          contenido
        };

        console.log('ðŸŽ¯ Mapa convertido:', {
          contenido: contenido.length,
          zonas: contenido.map(z => ({
            id: z._id,
            nombre: z.nombre,
            asientos: z.sillas.length,
            primerAsiento: z.sillas[0] ? {
              id: z.sillas[0]._id,
              nombre: z.sillas[0].nombre,
              posicion: z.sillas[0].posicion
            } : null
          }))
        });
      } else {
        mapped = m;
      }

      setMapa(mapped);
      setZonas(Array.isArray(zs) ? zs : []);
    } catch (err) {
      console.error('Œ Error loading map/zones:', err);
      message.error('Error cargando mapa');
      setMapa(null);
      setZonas([]);
    }
  }, [salaId, funcionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { mapa, setMapa, zonas, setZonas };
};

