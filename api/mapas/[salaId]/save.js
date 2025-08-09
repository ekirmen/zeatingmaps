import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

function getAdmin() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor');
  }
  return createClient(supabaseUrl, serviceKey);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { salaId } = req.query;
  const syncOnly = req.query.syncOnly === '1' || req.query.syncOnly === 'true';

  if (!salaId) return res.status(400).json({ error: 'Missing salaId' });

  try {
    const admin = getAdmin();

    // Body opcional { contenido }
    let contenido = null;
    if (!syncOnly) {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Missing body JSON { contenido }' });
      }
      contenido = Array.isArray(req.body.contenido) ? req.body.contenido : [];

      const { error: upsertErr } = await admin
        .from('mapas')
        .upsert({ sala_id: salaId, contenido }, { onConflict: 'sala_id' });
      if (upsertErr) throw upsertErr;
    }

    // Cargar mapa para sincronizar seats
    const { data: mapa, error: mapaErr } = await admin
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();
    if (mapaErr) throw mapaErr;

    // Si no hay mapa, terminar
    if (!mapa || !Array.isArray(mapa.contenido)) {
      return res.status(200).json({ success: true, message: 'Mapa guardado', seatsSynced: 0 });
    }

    // Obtener funciones para la sala
    const { data: funciones, error: funcErr } = await admin
      .from('funciones')
      .select('id')
      .eq('sala', salaId);
    if (funcErr) throw funcErr;

    const seatDefs = [];
    mapa.contenido.forEach((el) => {
      if (el.type === 'mesa') {
        (el.sillas || []).forEach((s) => {
          if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || null });
        });
      } else if (el.type === 'silla') {
        if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || null });
      }
    });

    let totalInserted = 0;
    for (const func of funciones || []) {
      const { data: existing, error: exErr } = await admin
        .from('seats')
        .select('_id')
        .eq('funcion_id', func.id);
      if (exErr) throw exErr;
      const existingIds = new Set((existing || []).map((s) => s._id));

      const toInsert = seatDefs
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({ _id: s.id, funcion_id: func.id, zona: s.zona, status: 'disponible', bloqueado: false }));

      if (toInsert.length > 0) {
        const { error: insErr } = await admin.from('seats').upsert(toInsert, {
          onConflict: 'funcion_id,_id',
          ignoreDuplicates: false,
        });
        if (insErr) throw insErr;
        totalInserted += toInsert.length;
      }
    }

    return res.status(200).json({ success: true, message: 'Mapa y seats sincronizados', seatsSynced: totalInserted });
  } catch (error) {
    console.error('[mapas save] error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


