import { createClient } from '@supabase/supabase-js';

// Usa la Service Role Key para poder saltar RLS en operaciones administrativas
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export default async function handler(req, res) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const recintoId = id;

  if (!recintoId) {
    return res.status(400).json({ error: 'Missing recinto id' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1) Obtener eventos del recinto
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select('id')
      .eq('recinto_id', recintoId);

    if (eventosError) throw eventosError;

    const eventoIds = (eventos || []).map((e) => e.id);

    // 2) Si hay eventos, borrar dependencias que NO tienen ON DELETE CASCADE
    if (eventoIds.length > 0) {
      // 2.a) Obtener funciones para esos eventos (soportar columnas antiguas o nuevas)
      let funciones = [];
      {
        const { data, error } = await supabase
          .from('funciones')
          .select('id')
          .in('evento_id', eventoIds);
        if (!error) funciones = data || [];
        else if (error && (error.code === '42703' || /column .* does not exist/i.test(error.message))) {
          const { data: dataAlt, error: errAlt } = await supabase
            .from('funciones')
            .select('id')
            .in('evento', eventoIds);
          if (!errAlt) funciones = dataAlt || [];
          else if (errAlt && errAlt.code !== '42P01') throw errAlt;
        } else if (error && error.code !== '42P01') throw error;
      }

      const funcionIds = (funciones || []).map((f) => f.id);

      // 2.b) Borrar locks y seats por funcion_id si existen (no siempre hay FK cascade)
      if (funcionIds.length > 0) {
        const { error: slErr } = await supabase
          .from('seat_locks')
          .delete()
          .in('funcion_id', funcionIds);
        if (slErr && slErr.code !== '42P01') throw slErr;

        const { error: seatsErr } = await supabase
          .from('seats')
          .delete()
          .in('funcion_id', funcionIds);
        if (seatsErr && seatsErr.code !== '42P01') throw seatsErr;
      }

      // plantillas_productos_template -> evento_id (sin cascade)
      const { error: pptError } = await supabase
        .from('plantillas_productos_template')
        .delete()
        .in('evento_id', eventoIds);
      if (pptError && pptError.code !== '42P01') throw pptError;

      // plantillas_productos -> evento_id (sin cascade en migración original)
      const { error: ppError } = await supabase
        .from('plantillas_productos')
        .delete()
        .in('evento_id', eventoIds);
      if (ppError && ppError.code !== '42P01') throw ppError;
    }

    // 3) Borrar eventos del recinto (cascadeará a funciones por FK ON DELETE CASCADE)
    const { error: deleteEventosError } = await supabase
      .from('eventos')
      .delete()
      .eq('recinto_id', recintoId);
    if (deleteEventosError) throw deleteEventosError;

    // 4) Borrar salas del recinto (cascadeará a mapas, zonas, seats)
    const { error: deleteSalasError } = await supabase
      .from('salas')
      .delete()
      .eq('recinto_id', recintoId);
    if (deleteSalasError) throw deleteSalasError;

    // 5) Borrar el recinto
    const { error: deleteRecintoError } = await supabase
      .from('recintos')
      .delete()
      .eq('id', recintoId);
    if (deleteRecintoError) throw deleteRecintoError;

    return res.status(200).json({ success: true, message: 'Recinto eliminado con cascada' });
  } catch (error) {
    console.error('[delete recinto] error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


