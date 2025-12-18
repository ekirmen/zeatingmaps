import { createClient } from '@supabase/supabase-js';

// Inicializar cliente con Service Role Key para bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { logs, ...singleLog } = req.body;

        // Permitir enviar 'logs' (array) o un solo log en el body
        const dataToInsert = Array.isArray(logs) ? logs : [singleLog];

        if (dataToInsert.length === 0) {
            return res.status(400).json({ error: 'No logs provided' });
        }

        // Filtrar campos vacíos o inválidos si es necesario
        const cleanData = dataToInsert.map(log => {
            // Asegurar que los campos necesarios estén presentes
            return {
                ...log,
                created_at: log.created_at || new Date().toISOString()
            };
        });

        const { data, error } = await supabaseAdmin
            .from('audit_logs')
            .insert(cleanData)
            .select();

        if (error) {
            console.error('[API AUDIT] Error inserting logs:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('[API AUDIT] Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
