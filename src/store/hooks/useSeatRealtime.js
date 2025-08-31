import { useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export function useSeatRealtime({ funcionId, onSeatUpdate }) {
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!funcionId) {
      console.log('useSeatRealtime: funcionId is null or undefined, skipping subscription.');
      return;
    }

    // Limpia canal anterior si existe
    if (channelRef.current) {
      console.log('useSeatRealtime: Limpiando canal anterior');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Solo crear nuevo canal si no hay uno activo
    if (!isSubscribedRef.current) {
      const channelName = `seats-funcion-${funcionId}`;
      console.log(`useSeatRealtime: Creando canal: ${channelName}`);
      
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      const subscription = channel
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'seats',
            filter: `funcion_id=eq.${funcionId}`, // Filter for changes related to this function
          },
          (payload) => {
            console.log('🎯 Cambio realtime en seats (payload completo):', payload);
            console.log('   Tipo de evento:', payload.eventType);
            console.log('   Tabla:', payload.table);
            console.log('   Esquema:', payload.schema);
            console.log('   Datos Nuevos (payload.new):', payload.new);
            console.log('   Datos Antiguos (payload.old):', payload.old);

            // IMPORTANT: The error "Could not find 'reserved' column" is likely happening
            // inside the `onSeatUpdate` function that is passed to this hook.
            // Ensure that `onSeatUpdate` (wherever it's defined) does not try to access
            // `payload.new.reserved` or `payload.old.reserved`, as this column
            // does not exist in your 'seats' table schema.
            // Instead, use columns like `payload.new.status`, `payload.new.locked_by`, etc.

            if (onSeatUpdate && typeof onSeatUpdate === 'function') {
              onSeatUpdate(payload);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`useSeatRealtime: ✅ Suscrito al canal ${channelName}`);
            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('useSeatRealtime: ⚠️ Error en el canal, intentando reconectar...');
            isSubscribedRef.current = false;
          } else if (status === 'CLOSED') {
            console.log(`useSeatRealtime: ℹ️ Canal ${channelName} cerrado.`);
            isSubscribedRef.current = false;
          }
        });
    }

    return () => {
      if (channelRef.current) {
        console.log('useSeatRealtime: Limpiando canal en cleanup');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [funcionId, onSeatUpdate]); // Added onSeatUpdate to dependencies for completeness
}
