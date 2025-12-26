import { createClient } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '../../src/config/timeouts.js';

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
    SUPABASE_URL && SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })
        : null;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!['POST', 'DELETE'].includes(req.method)) {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        });
    }

    if (!supabaseAdmin) {
        console.error('[seat-locks/unlock] Supabase admin client not configured');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
        });
    }

    try {
        const { seatId, seatIds, funcionId, sessionId, userId } = req.body;

        // Support both single and batch unlock
        const seatsToUnlock = seatIds || (seatId ? [seatId] : []);

        if (seatsToUnlock.length === 0 || !funcionId) {
            return res.status(400).json({
                success: false,
                error: 'seatId(s) and funcionId are required',
            });
        }

        // Choose timeout based on batch size
        const timeout = seatsToUnlock.length > 1
            ? TIMEOUTS.SEAT_BATCH_UNLOCK
            : TIMEOUTS.SEAT_UNLOCK;

        // Execute with timeout
        const result = await withTimeout(
            unlockSeats({ seatIds: seatsToUnlock, funcionId, sessionId, userId }),
            timeout,
            'Unlock Seat(s)'
        );

        return res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[seat-locks/unlock] Error:', error);

        // Handle timeout specifically
        if (error.message.includes('timeout')) {
            return res.status(408).json({
                success: false,
                error: 'Request timeout',
                details: 'La operación tardó demasiado tiempo',
            });
        }

        const status = Number(error?.status || error?.code) || 500;
        return res.status(status).json({
            success: false,
            error: error?.message || 'Error unlocking seat(s)',
            details: error?.details || null,
        });
    }
}

async function unlockSeats({ seatIds, funcionId, sessionId, userId }) {
    // Build query to find locks
    let query = supabaseAdmin
        .from('seat_locks')
        .select('*')
        .eq('funcion_id', funcionId)
        .in('seat_id', seatIds);

    // If sessionId or userId provided, filter by them
    if (sessionId) {
        query = query.eq('session_id', sessionId);
    } else if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data: locks, error: findError } = await query;

    if (findError) {
        console.error('[seat-locks/unlock] Error finding locks:', findError);
        throw findError;
    }

    if (!locks || locks.length === 0) {
        return {
            unlocked: 0,
            message: 'No locks found to unlock',
            seatIds: [],
        };
    }

    // Delete the locks
    const lockIds = locks.map(lock => lock.id);

    const { error: deleteError } = await supabaseAdmin
        .from('seat_locks')
        .delete()
        .in('id', lockIds);

    if (deleteError) {
        console.error('[seat-locks/unlock] Error deleting locks:', deleteError);
        throw deleteError;
    }

    return {
        unlocked: locks.length,
        message: `Successfully unlocked ${locks.length} seat(s)`,
        seatIds: locks.map(lock => lock.seat_id),
    };
}
