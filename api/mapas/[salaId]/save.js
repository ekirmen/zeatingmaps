import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
  const deleteMissing = req.query.deleteMissing === '1' || req.query.deleteMissing === 'true';

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

      // Extraer tenant_id del body si está disponible
      const tenantId = req.body?.tenant_id;
      console.log('[mapas save] Guardando mapa con tenant_id:', tenantId);
      
      const { error: upsertErr } = await admin
        .from('mapas')
        .upsert({ 
          sala_id: salaId, 
          contenido,
          tenant_id: tenantId 
        }, { onConflict: 'sala_id' });
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
          if (s && s._id) seatDefs.push({ id: s._id, zona: s.zona || 'general' });
        });
      } else if (el.type === 'silla') {
        if (el && el._id) seatDefs.push({ id: el._id, zona: el.zona || 'general' });
      }
    });

    // Helper: UUID v5 (SHA-1) a partir de name + namespace
    const NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'; // namespace DNS estándar
    const uuidv5 = (name, namespace) => {
      const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
      const nm = Buffer.from(String(name));
      const sha1 = crypto.createHash('sha1');
      sha1.update(ns);
      sha1.update(nm);
      const hash = sha1.digest();
      // Ajustar a UUID v5 (version y variant)
      hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
      hash[8] = (hash[8] & 0x3f) | 0x80; // variant RFC4122
      const hex = hash.toString('hex').slice(0, 32);
      return (
        hex.substring(0, 8) + '-' +
        hex.substring(8, 12) + '-' +
        hex.substring(12, 16) + '-' +
        hex.substring(16, 20) + '-' +
        hex.substring(20, 32)
      );
    };

    let totalInserted = 0;
    for (const func of funciones || []) {
      // Traer asientos existentes con info necesaria para diff
      const { data: existing, error: exErr } = await admin
        .from('seats')
        .select('_id, base_id, zona, status')
        .eq('funcion_id', func.id);
      if (exErr) throw exErr;

      const existingById = new Map((existing || []).map((s) => [s._id, s]));
      const existingByBase = new Map((existing || []).filter(s => s.base_id).map((s) => [s.base_id, s]));

      const generated = seatDefs.map((s) => ({
        genId: uuidv5(`${s.id}::${func.id}`, NAMESPACE),
        baseId: s.id,
        zona: s.zona,
      }));

      // Inserciones y actualizaciones de zona
      const toInsert = [];
      const toUpdate = [];

      for (const g of generated) {
        const byId = existingById.get(g.genId);
        const byBase = existingByBase.get(g.baseId);
        const found = byId || byBase;
        if (!found) {
          toInsert.push({
            _id: g.genId,
            base_id: g.baseId,
            funcion_id: func.id,
            zona: g.zona,
            status: 'disponible',
            bloqueado: false,
          });
        } else if (found.zona !== g.zona) {
          toUpdate.push({ id: found._id, zona: g.zona });
        }
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await admin
          .from('seats')
          .upsert(toInsert, { onConflict: 'funcion_id,_id', ignoreDuplicates: false });
        if (insErr) throw insErr;
        totalInserted += toInsert.length;
      }

      if (toUpdate.length > 0) {
        // Actualizar zona para cada seat que cambió
        for (const u of toUpdate) {
          const { error: upErr } = await admin
            .from('seats')
            .update({ zona: u.zona })
            .eq('_id', u.id)
            .eq('funcion_id', func.id);
          if (upErr) throw upErr;
        }
      }

      if (deleteMissing) {
        // Seats existentes que no están en el mapa ahora
        const generatedIds = new Set(generated.map((g) => g.genId));
        const toMaybeDelete = (existing || [])
          .map((s) => s._id)
          .filter((eid) => !generatedIds.has(eid));
        if (toMaybeDelete.length > 0) {
          // No eliminar si tienen locks activos
          const { data: locked, error: lockErr } = await admin
            .from('seat_locks')
            .select('seat_id')
            .eq('funcion_id', func.id)
            .in('seat_id', toMaybeDelete);
          if (lockErr) throw lockErr;
          const lockedSet = new Set((locked || []).map((l) => l.seat_id));
          const deletable = toMaybeDelete.filter((id) => !lockedSet.has(id));
          if (deletable.length > 0) {
            const { error: delErr } = await admin
              .from('seats')
              .delete()
              .eq('funcion_id', func.id)
              .in('_id', deletable);
            if (delErr) throw delErr;
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Mapa y seats sincronizados', seatsSynced: totalInserted });
  } catch (error) {
    console.error('[mapas save] error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


