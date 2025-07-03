import { useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'

export function useSeatRealtime({ funcionId, onSeatUpdate }) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!funcionId) return

    const channelName = `seats-funcion-${funcionId}`
    const channel = supabase.channel(channelName)

    channelRef.current = channel

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `funcion_id=eq.${funcionId}`,
        },
        (payload) => {
          console.log('🎯 Cambio realtime en seats:', payload)
          if (onSeatUpdate && typeof onSeatUpdate === 'function') {
            onSeatUpdate(payload)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to Realtime channel ${channelName}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Error en el canal, intentando reconectar...')
        }
      })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        console.log(`🧹 Canal ${channelName} eliminado`)
      }
    }
  }, [funcionId])
}
