import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.REACT_SUPABASE_URL || process.env.react_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.react_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔍 [SEARCH-BY-EMAIL] Buscando pagos para email:', email);

    // Primero buscar el usuario por email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, login, tenant_id:empresa, telefono')
      .eq('login', email)
      .single();

    if (userError) {
      console.error('🔍 [SEARCH-BY-EMAIL] Error buscando usuario:', userError);
      return res.status(500).json({ error: 'Error buscando usuario' });
    }

    if (!user) {
      console.log('🔍 [SEARCH-BY-EMAIL] Usuario no encontrado');
      return res.status(200).json({ payments: [], user: null });
    }

    // Buscar todos los pagos del usuario
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        seats,
        funcion:funciones(id, fecha_celebracion, evento:eventos(id, nombre)),
        evento_id as event,
        event:eventos(id, nombre),
        user:profiles!user_id(id, login, tenant_id:empresa, telefono)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('🔍 [SEARCH-BY-EMAIL] Error buscando pagos:', paymentsError);
      return res.status(500).json({ error: 'Error buscando pagos' });
    }

    // Procesar los pagos para incluir información adicional
    const processedPayments = (payments || []).map(payment => {
      let seats = [];
      try {
        if (Array.isArray(payment.seats)) {
          seats = payment.seats;
        } else if (typeof payment.seats === 'string') {
          seats = JSON.parse(payment.seats);
        }
      } catch (e) {
        console.error('Error parsing seats for payment:', payment.id, e);
        seats = [];
      }

      return {
        ...payment,
        seatsCount: seats.length,
        totalAmount: seats.reduce((sum, seat) => sum + (seat.price || 0), 0),
        seats: seats
      };
    });

    console.log('🔍 [SEARCH-BY-EMAIL] Pagos encontrados:', processedPayments.length);

    return res.status(200).json({
      payments: processedPayments,
      user: user,
      count: processedPayments.length
    });

  } catch (error) {
    console.error('🔍 [SEARCH-BY-EMAIL] Error inesperado:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
