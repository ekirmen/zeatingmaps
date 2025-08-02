import { useState, useEffect } from 'react';
import { message } from 'antd';
import { fetchMapa, fetchZonasPorSala } from '../../../../services/supabaseServices';
import { fetchSeatsByFuncion } from '../../../services/supabaseSeats';

export const useMapData = (selectedFuncion) => {
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      let salaId = selectedFuncion?.sala;
      if (typeof salaId === 'object' && salaId !== null) {
        salaId = salaId._id || salaId.id || null;
      }
      const funcionId = selectedFuncion?.id || selectedFuncion?._id;
      
      if (salaId) {
        try {
          console.log('🔍 Cargando datos para salaId:', salaId, 'funcionId:', funcionId);
          const [m, zs, seats] = await Promise.all([
            fetchMapa(salaId),
            fetchZonasPorSala(salaId),
            funcionId ? fetchSeatsByFuncion(funcionId) : Promise.resolve([]),
          ]);
          console.log('📊 Datos cargados:', {
            mapa: m,
            zonas: zs?.length || 0,
            seats: seats?.length || 0
          });

          const seatMap = seats.reduce((acc, s) => {
            acc[s.id || s._id] = { estado: s.estado, bloqueado: s.bloqueado };
            return acc;
          }, {});

          // Convertir el formato de datos si es necesario
          let mapped;
          if (m.contenido) {
            // Formato esperado por SeatingMap
            mapped = {
              ...m,
              contenido: Array.isArray(m.contenido)
                ? m.contenido.map(el => ({
                    ...el,
                    sillas: el.sillas.map(s => {
                      const st = seatMap[s._id || s.id];
                      if (!st) return s;
                      const estado = st.bloqueado ? 'bloqueado' : st.estado || s.estado;
                      return { ...s, estado };
                    })
                  }))
                : [],
            };
          } else if (m.zonas) {
            // Convertir formato de zonas a formato de contenido
            console.log('🔄 Convirtiendo formato de zonas a contenido');
            const contenido = m.zonas.map((zona, zonaIndex) => ({
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
                estado: 'disponible'
              }))
            }));
            
            mapped = {
              ...m,
              contenido
            };
          } else {
            mapped = m;
          }

          setMapa(mapped);
          setZonas(Array.isArray(zs) ? zs : []);
        } catch (err) {
          console.error('❌ Error loading map/zones:', err);
          message.error('Error cargando mapa');
          setMapa(null);
          setZonas([]);
        }
      } else {
        console.log('⚠️ No hay salaId disponible:', selectedFuncion);
        setMapa(null);
        setZonas([]);
      }
    };
    loadData();
  }, [selectedFuncion]);

  return { mapa, setMapa, zonas, setZonas };
}; 