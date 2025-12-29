import { createClient } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '../../src/config/timeouts.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.react_NEXT_PUBLIC_SUPABASE_URL;

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  if (!supabaseAdmin) {
    console.error('[seat-locks/status] Supabase admin client not configured');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
    });
  }

  try {
    const funcionId =
      req.method === 'GET'
        ? req.query.funcionId
        : req.body?.funcionId;

    const tenantId =
      req.method === 'GET'
        ? req.query.tenantId
        : req.body?.tenantId;

    if (!funcionId) {
      return res.status(400).json({
        success: false,
        error: 'funcionId is required',
      });
    }

    // Execute with timeout
    const result = await withTimeout(
      fetchSeatLocksAndTransactions(funcionId, tenantId),
      TIMEOUTS.SEAT_STATUS,
      'Seat Locks Status'
    );

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[seat-locks/status] Error:', error);

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
      error: error?.message || 'Error fetching seat locks status',
      details: error?.details || null,
    });
  }
}

async function fetchSeatLocksAndTransactions(funcionId, tenantId) {
  // Fetch seat locks
  const seatLocksQuery = supabaseAdmin
    .from('seat_locks')
    .select('*')
    .eq('funcion_id', funcionId)
    .gt('expires_at', new Date().toISOString());

  if (tenantId) {
    seatLocksQuery.eq('tenant_id', tenantId);
  }

  const { data: seatLocks, error: locksError } = await seatLocksQuery;

  if (locksError) {
    console.error('[seat-locks/status] Error fetching locks:', locksError);
    throw locksError;
  }

  // Fetch payment transactions
  const transQuery = supabaseAdmin
    .from('payment_transactions')
    .select('*')
    .eq('funcion_id', funcionId)
    .in('status', ['pending', 'completed']);

  if (tenantId) {
    transQuery.eq('tenant_id', tenantId);
  }

  const { data: transactions, error: transError } = await transQuery;

  if (transError) {
    console.error('[seat-locks/status] Error fetching transactions:', transError);
    throw transError;
  }

  // Normalize seat data
  const normalizedSeats = new Map();

  // Add locks
  (seatLocks || []).forEach(lock => {
    const seatId = lock.seat_id || lock.butaca_id;
    if (seatId) {
      normalizedSeats.set(seatId, {
        seatId,
        status: 'locked',
        sessionId: lock.session_id,
        userId: lock.user_id,
        expiresAt: lock.expires_at,
        lockType: lock.lock_type || 'temporary',
      });
    }
  });

  // Add sold seats from transactions
  (transactions || []).forEach(trans => {
    if (trans.status === 'completed' && trans.seats) {
      let seatsData = trans.seats;
      if (typeof seatsData === 'string') {
        try {
          seatsData = JSON.parse(seatsData);
        } catch (e) {
          console.warn('[seat-locks/status] Could not parse seats:', e);
          seatsData = [];
        }
      }

      if (Array.isArray(seatsData)) {
        seatsData.forEach(seat => {
          const seatId = seat.sillaId || seat.seat_id || seat.id || seat._id;
          if (seatId) {
            normalizedSeats.set(seatId, {
              seatId,
              status: 'sold',
              transactionId: trans.id,
              userId: trans.user_id,
            });
          }
        });
      }
    }
  });

  return {
    locks: seatLocks || [],
    transactions: transactions || [],
    normalizedSeats: Array.from(normalizedSeats.values()),
    stats: {
      totalLocks: seatLocks?.length || 0,
      totalTransactions: transactions?.length || 0,
      totalSeats: normalizedSeats.size,
    },
  };
}
