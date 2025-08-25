import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sistema.veneventos.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log(`[SEAT-LOCKS] ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[SEAT-LOCKS] Handling OPTIONS preflight request');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, seat_id, funcion_id, session_id, status, lock_type } = await req.json()

    if (!action || !seat_id || !funcion_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result

    switch (action) {
      case 'lock':
        // Lock a seat
        const { data: lockData, error: lockError } = await supabaseClient
          .from('seat_locks')
          .upsert({
            seat_id,
            funcion_id: parseInt(funcion_id),
            session_id,
            locked_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            status: status || 'seleccionado',
            lock_type: lock_type || 'seat',
          })
          .select()

        if (lockError) throw lockError
        result = { success: true, data: lockData }
        break

      case 'unlock':
        // Unlock a seat
        const { error: unlockError } = await supabaseClient
          .from('seat_locks')
          .delete()
          .eq('seat_id', seat_id)
          .eq('funcion_id', parseInt(funcion_id))
          .eq('session_id', session_id)

        if (unlockError) throw unlockError
        result = { success: true, message: 'Seat unlocked successfully' }
        break

      case 'get':
        // Get locked seats for a function
        const { data: getData, error: getError } = await supabaseClient
          .from('seat_locks')
          .select('*')
          .eq('funcion_id', parseInt(funcion_id))

        if (getError) throw getError
        result = { success: true, data: getData }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: lock, unlock, or get' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in seat-locks function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        method: req.method 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
