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
          const [m, zs, seats] = await Promise.all([
            fetchMapa(salaId),
            fetchZonasPorSala(salaId),
            funcionId ? fetchSeatsByFuncion(funcionId) : Promise.resolve([]),
          ]);
          console.log('Loaded mapa:', m);

          const seatMap = seats.reduce((acc, s) => {
            acc[s.id || s._id] = { estado: s.estado, bloqueado: s.bloqueado };
            return acc;
          }, {});

          const mapped = {
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

          setMapa(mapped);
          setZonas(Array.isArray(zs) ? zs : []);
        } catch (err) {
          console.error('Error loading map/zones:', err);
          message.error('Error cargando mapa');
          setMapa(null);
          setZonas([]);
        }
      } else {
        setMapa(null);
        setZonas([]);
      }
    };
    loadData();
  }, [selectedFuncion]);

  return { mapa, setMapa, zonas, setZonas };
}; 