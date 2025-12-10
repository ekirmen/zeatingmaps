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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { salaId } = req.query;

  if (!salaId) {
    return res.status(400).json({ error: 'Missing salaId' });
  }

  try {
    const admin = getAdmin();

    // Cargar zonas asociadas a la sala
    const { data: zonas, error: zonasErr } = await admin
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId)
      .order('nombre');

    if (zonasErr) {
      console.error('[zonas load] Error cargando zonas:', zonasErr);
      throw zonasErr;
    }

    console.log(`[zonas load] Zonas cargadas para sala ${salaId}:`, zonas?.length || 0);

    return res.status(200).json(zonas || []);

  } catch (error) {
    console.error('[zonas load] Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
