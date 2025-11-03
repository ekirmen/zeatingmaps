import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[seat-locks/status] Missing Supabase credentials');
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
    return res.status(500).json({ error: 'Unexpected error fetching seat locks' });
  }
}
