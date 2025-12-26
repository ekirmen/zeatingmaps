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

    if (!funcionId) {
      return res.status(400).json({
        success: false,
        error: 'funcionId is required',
      });
    }

    // Execute with timeout
    const result = await withTimeout(
      fetchSeatLocksAndTransactions(funcionId),
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

async function fetchSeatLocksAndTransactions(funcionId) {
  // Fetch seat locks
  const { data: seatLocks, error: locksError } = await supabaseAdmin
    .from('seat_locks')
    .select('*')
    .eq('funcion_id', funcionId)
    .gt('expires_at', new Date().toISOString());

  if (locksError) {
    console.error('[seat-locks/status] Error fetching locks:', locksError);
    throw locksError;
  }

  // Fetch payment transactions
  const { data: transactions, error: transError } = await supabaseAdmin
    .from('payment_transactions')
    .select('*')
    .eq('funcion_id', funcionId)
    .in('status', ['pending', 'completed']);

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
      trans.seats.forEach(seatId => {
        normalizedSeats.set(seatId, {
          seatId,
          status: 'sold',
          transactionId: trans.id,
          userId: trans.user_id,
        });
      });
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


// Usar múltiples nombres de variables de entorno para compatibilidad
// Buscar en orden: estándar, REACT_APP_, NEXT_PUBLIC_, react_ (minúsculas)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.react_NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.REACT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.react_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[seat-locks/status] Missing Supabase credentials. Available env vars:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    REACT_APP_SUPABASE_URL: !!process.env.REACT_APP_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    react_NEXT_PUBLIC_SUPABASE_URL: !!process.env.react_NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    REACT_APP_SUPABASE_SERVICE_ROLE_KEY: !!process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY,
    REACT_SUPABASE_SERVICE_ROLE_KEY: !!process.env.REACT_SUPABASE_SERVICE_ROLE_KEY,
    react_SUPABASE_SERVICE_ROLE_KEY: !!process.env.react_SUPABASE_SERVICE_ROLE_KEY,
  });
}

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

const normalizeSeats = (rawSeats) => {
  if (!Array.isArray(rawSeats)) return [];
  return rawSeats
    .map((seat) => {
      if (!seat) return null;
      const id =
        seat.seat_id ||
        seat.sillaId ||
        seat.id ||
        seat._id ||
        null;

      if (!id) return null;

      return {
        id,
        seat_id: seat.seat_id || id,
        _id: seat._id || id,
        sillaId: seat.sillaId || id,
        name: seat.name || seat.nombre || null,
        price: typeof seat.price === 'number' ? seat.price : seat.precio || null,
        zona: seat.zona || seat.zonaId || seat.nombreZona || null,
        mesa: seat.mesa || seat.mesaId || null,
      };
    })
    .filter(Boolean);
};

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  const source = req.method === 'GET' ? req.query : req.body || {};
  const funcionIdRaw = source.funcionId ?? source.funcion_id;
  const tenantId = source.tenantId || source.tenant_id || null;

  const funcionId = Number.parseInt(funcionIdRaw, 10);

  if (!Number.isFinite(funcionId)) {
    return res.status(400).json({ error: 'funcionId is required' });
  }

  try {
    const seatLocksQuery = supabase
      .from('seat_locks')
      .select('id, seat_id, table_id, session_id, locked_at, expires_at, status, lock_type, user_id, tenant_id, metadata')
      .eq('funcion_id', funcionId);

    if (tenantId) {
      seatLocksQuery.eq('tenant_id', tenantId);
    }

    const { data: seatLocks, error: seatLocksError } = await seatLocksQuery;

    if (seatLocksError) {
      console.error('[seat-locks/status] Error fetching seat_locks:', seatLocksError);
      throw seatLocksError;
    }

    const paymentQuery = supabase
      .from('payment_transactions')
      .select('id, status, seats, user_id, locator, tenant_id')
      .eq('funcion_id', funcionId);

    if (tenantId) {
      paymentQuery.eq('tenant_id', tenantId);
    }

    const { data: transactions, error: paymentError } = await paymentQuery;

    if (paymentError) {
      console.error('[seat-locks/status] Error fetching payment_transactions:', paymentError);
      throw paymentError;
    }

    const processedTransactions = (transactions || []).map((transaction) => {
      let seatsData = transaction.seats;
      if (typeof seatsData === 'string') {
        try {
          seatsData = JSON.parse(seatsData);
        } catch (parseError) {
          console.warn('[seat-locks/status] Could not parse seats payload:', parseError);
          seatsData = [];
        }
      }

      return {
        ...transaction,
        seats: normalizeSeats(seatsData),
      };
    });

    return res.status(200).json({
      lockedSeats: seatLocks || [],
      transactions: processedTransactions,
    });
  } catch (error) {
    console.error('[seat-locks/status] Unexpected error:', error);
    return res.status(500).json({
      error: 'Unexpected error fetching seat locks',
      details: error.message
    });
  }
}

