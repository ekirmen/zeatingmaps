import { createClient } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '../../src/config/timeouts.js';

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.REACT_SUPABASE_URL ||
    process.env.react_SUPABASE_URL;

const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.react_SUPABASE_SERVICE_ROLE_KEY;

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        });
    }

    if (!supabaseAdmin) {
        console.error('[seat-locks/lock] Supabase admin client not configured');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
        });
    }

    try {
        const { seatId, funcionId, sessionId, userId, lockType = 'temporary' } = req.body;

        if (!seatId || !funcionId) {
            return res.status(400).json({
                success: false,
                error: 'seatId and funcionId are required',
            });
        }

        // Execute with timeout
        const result = await withTimeout(
            lockSeat({ seatId, funcionId, sessionId, userId, lockType }),
            TIMEOUTS.SEAT_LOCK,
            'Lock Seat'
        );

        return res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[seat-locks/lock] Error:', error);

        // Handle timeout specifically
        if (error.message.includes('timeout')) {
            return res.status(408).json({
                success: false,
                error: 'Request timeout',
                details: 'La operación tardó demasiado tiempo',
            });
        }

        // Handle conflict (seat already locked)
        if (error.message.includes('already locked')) {
            return res.status(409).json({
                success: false,
                error: 'Seat already locked',
                details: error.message,
            });
        }

        const status = Number(error?.status || error?.code) || 500;
        return res.status(status).json({
            success: false,
            error: error?.message || 'Error locking seat',
            details: error?.details || null,
        });
    }
}

async function lockSeat({ seatId, funcionId, sessionId, userId, lockType }) {
    // Check if seat is already locked or sold
    const { data: existing, error: checkError } = await supabaseAdmin
        .from('seat_locks')
        .select('*')
        .eq('seat_id', seatId)
        .eq('funcion_id', funcionId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

    if (checkError) {
        console.error('[seat-locks/lock] Error checking existing lock:', checkError);
        throw checkError;
    }

    if (existing) {
        // If it's the same session/user, extend the lock
        if (existing.session_id === sessionId || existing.user_id === userId) {
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

            const { data: updated, error: updateError } = await supabaseAdmin
                .from('seat_locks')
                .update({ expires_at: expiresAt, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) throw updateError;

            return {
                ...updated,
                action: 'extended',
            };
        } else {
            throw new Error(`Seat ${seatId} is already locked by another user`);
        }
    }

    // Check if seat is sold
    const { data: transaction, error: transError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, status')
        .eq('funcion_id', funcionId)
        .contains('seats', [seatId])
        .eq('status', 'completed')
        .maybeSingle();

    if (transError) {
        console.error('[seat-locks/lock] Error checking transaction:', transError);
        throw transError;
    }

    if (transaction) {
        throw new Error(`Seat ${seatId} is already sold`);
    }

    // Create new lock
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { data: newLock, error: insertError } = await supabaseAdmin
        .from('seat_locks')
        .insert({
            seat_id: seatId,
            funcion_id: funcionId,
            session_id: sessionId,
            user_id: userId,
            lock_type: lockType,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        console.error('[seat-locks/lock] Error creating lock:', insertError);
        throw insertError;
    }

    return {
        ...newLock,
        action: 'created',
    };
}
