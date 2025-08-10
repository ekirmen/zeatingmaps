import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { salaId, action, data } = await req.json()

    if (!salaId) {
      throw new Error('Missing salaId')
    }

    switch (action) {
      case 'subscribe':
        // Crear un canal de suscripción para la sala
        const channel = supabase.channel(`mapas-sala-${salaId}`)
        
        // Suscribirse a cambios en la tabla mapas
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'mapas',
              filter: `sala_id=eq.${salaId}`
            },
            (payload) => {
              console.log('Cambio detectado en mapas:', payload)
              // Aquí podrías enviar notificaciones push o WebSocket
            }
          )
          .subscribe()

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Suscripción creada',
            channelId: `mapas-sala-${salaId}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'notify_change':
        // Notificar a otros clientes sobre un cambio
        if (!data) {
          throw new Error('Missing data for notify_change')
        }

        // Aquí podrías implementar notificaciones push o WebSocket
        // Por ahora, solo registramos el cambio
        console.log('Notificando cambio para sala:', salaId, data)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Cambio notificado',
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'get_updates':
        // Obtener actualizaciones recientes para la sala
        const { data: mapas, error } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', salaId)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (error) throw error

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: mapas[0] || null,
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error en realtime-sync:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
