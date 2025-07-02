import { useEffect, useRef } from 'react';
import { supabase } from '../../backoffice/services/supabaseClient';
import normalizeSeatId from '../../utils/normalizeSeatId';

const useSeatRealtime = (selectedFunctionId, zonas, setMapa, cartRef) => {
  const channelRef = useRef(null);

  const getZonaColor = (zonaId) => {
    const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);
    return zonaObj?.color;
  };

  useEffect(() => {
    if (!selectedFunctionId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`seats-${selectedFunctionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `funcion_id=eq.${selectedFunctionId}`,
        },
        (payload) => {
          const seat = payload.new || payload.old;
          if (!seat) return;

          setMapa((prevMapa) => {
            if (!prevMapa) return prevMapa;
            return {
              ...prevMapa,
              contenido: prevMapa.contenido.map((elemento) => ({
                ...elemento,
                sillas: elemento.sillas.map((s) => {
                  if (normalizeSeatId(s._id) !== normalizeSeatId(seat._id)) return s;
                  const zonaId = s.zona || elemento.zona;
                  const baseColor = getZonaColor(zonaId) || 'lightblue';
                  const estado = seat.bloqueado ? 'bloqueado' : seat.status;
                  let color = baseColor;
                  if (estado === 'bloqueado') color = 'orange';
                  else if (estado === 'reservado') color = 'red';
                  else if (estado === 'pagado') color = 'gray';
                  const selected = cartRef.current.some((c) => c._id === s._id);
                  return { ...s, estado, color, selected };
                }),
              })),
            };
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [selectedFunctionId, zonas]);
};

export default useSeatRealtime;
