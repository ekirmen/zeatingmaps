import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Faltan variables de entorno de Supabase');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { salaId, action, data } = req.body;

    if (!salaId) {
      return res.status(400).json({ error: 'Missing salaId' });
    }

    console.log(`[REALTIME-SYNC] Notificación recibida:`, { salaId, action, data });

    // Aquí puedes implementar lógica adicional si es necesario
    // Por ejemplo, guardar logs, notificar a otros usuarios, etc.
    
    // Por ahora, solo confirmamos que se recibió la notificación
    return res.status(200).json({ 
      success: true, 
      message: 'Notificación recibida',
      salaId,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[REALTIME-SYNC] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
