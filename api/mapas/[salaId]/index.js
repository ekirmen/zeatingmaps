import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_SUPABASE_URL || process.env.react_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.react_SUPABASE_SERVICE_ROLE_KEY;

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

    // Cargar mapa desde la base de datos
    const { data: mapa, error: mapaErr } = await admin
      .from('mapas')
      .select('*')
      .eq('sala_id', salaId)
      .maybeSingle();

    if (mapaErr) {
      console.error('[mapas load] Error cargando mapa:', mapaErr);
      throw mapaErr;
    }

    // Si no hay mapa, devolver estructura vacía
    if (!mapa) {
      return res.status(200).json({
        success: true,
        data: {
          contenido: [],
          zonas: [],
          updated_at: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Cargar zonas asociadas a la sala
    const { data: zonas, error: zonasErr } = await admin
      .from('zonas')
      .select('*')
      .eq('sala_id', salaId);

    if (zonasErr) {
      console.warn('[mapas load] Error cargando zonas:', zonasErr);
    }

    // Preparar respuesta
    const response = {
      success: true,
      data: {
        contenido: mapa.contenido || [],
        zonas: zonas || [],
        updated_at: mapa.updated_at || mapa.created_at
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[mapas load] Mapa cargado para sala ${salaId}:`, {
      elementos: response.data.contenido.length,
      zonas: response.data.zonas.length,
      updated_at: response.data.updated_at
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('[mapas load] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
