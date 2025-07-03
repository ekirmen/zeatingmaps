import { useEffect, useRef } from 'react';
import { supabase } from '../../backoffice/services/supabaseClient';

const useSeatRealtime = (
  selectedFunctionId,
  zonas,
  setMapa,
  cartRef,
  enabled = true
) => {
  const channelRef = useRef(null);

  const getZonaColor = (zonaId) => {
    const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);
    return zonaObj?.color;
  };

  useEffect(() => {
    let reconnectTimeout;

    const cleanup = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    if (!enabled || !selectedFunctionId) {
      cleanup();
      return undefined;
    }

    const connect = () => {
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
                    if (s._id !== seat._id) return s;
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Suscripción exitosa!');
          }
          if (status === 'CHANNEL_ERROR') {
            console.log('Error en el canal, intentando reconectar...');
            reconnectTimeout = setTimeout(() => {
              cleanup();
              connect();
            }, 1000);
          }
        });

      channel.onError((error) => {
        console.error('Error en la conexión Realtime:', error);
      });

      channelRef.current = channel;
    };

    connect();

    return cleanup;
  }, [selectedFunctionId, zonas, enabled]);
};

export default useSeatRealtime;
