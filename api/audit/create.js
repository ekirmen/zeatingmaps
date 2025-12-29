import { createClient } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '../../src/config/timeouts.js';

// Inicializar cliente con Service Role Key para bypass RLS
const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.REACT_SUPABASE_URL ||
    process.env.react_SUPABASE_URL ||
    process.env.SUPABASE_URL;

const supabaseServiceKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.react_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

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

    if (!supabaseAdmin) {
        console.error('[API AUDIT] Supabase client not initialized. Missing URL or Service Key.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { logs, ...singleLog } = payload || {};

        // Permitir enviar 'logs' (array) o un solo log in the body
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

        // Execute with timeout
        const result = await withTimeout(
            supabaseAdmin
                .from('audit_logs')
                .insert(cleanData)
                .select(),
            TIMEOUTS.AUDIT_CREATE,
            'Create Audit Log'
        );

        const { data, error } = result;

        if (error) {
            console.error('[API AUDIT] Error inserting logs:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[API AUDIT] Server error:', error);

        // Handle timeout specifically
        if (error.message.includes('timeout')) {
            return res.status(408).json({
                error: 'Request timeout',
                details: 'La operación tardó demasiado tiempo'
            });
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
}
