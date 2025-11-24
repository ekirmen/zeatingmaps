import { createClient } from '@supabase/supabase-js';

// Compatibilidad con diferentes nombres de variables de entorno
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

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: `Supabase client not configured (${missing.join(', ')})` });
  }

  const { cuotaIds, paymentData } = req.body || {};

  if (!Array.isArray(cuotaIds) || cuotaIds.length === 0) {
    return res.status(400).json({ error: 'cuotaIds is required' });
  }

  if (!paymentData?.tenantId || !paymentData?.userId) {
    return res.status(400).json({ error: 'paymentData.tenantId and paymentData.userId are required' });
  }

  try {
    // Obtener las cuotas a pagar
    const { data: cuotas, error: fetchError } = await supabase
      .from('cuotas_pagos')
      .select('*')
      .in('id', cuotaIds);

    if (fetchError) throw fetchError;

    if (!cuotas || cuotas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron cuotas para pagar' });
    }

    const montoTotal = cuotas.reduce((sum, cuota) => sum + (cuota.monto_cuota - cuota.monto_pagado), 0);

    const { data: paymentTransaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: `CUOTAS-${Date.now()}`,
        amount: montoTotal,
        currency: paymentData.currency || 'USD',
        status: 'completed',
        gateway_transaction_id: paymentData.gatewayTransactionId || null,
        gateway_response: paymentData.gatewayResponse || null,
        locator: paymentData.locator || null,
        tenant_id: paymentData.tenantId,
        user_id: paymentData.userId,
        evento_id: cuotas[0].evento_id,
        funcion_id: cuotas[0].funcion_id,
        payment_method: paymentData.paymentMethod || 'unknown',
        gateway_name: paymentData.gatewayName || 'unknown',
        metadata: {
          tipo: 'pago_cuotas',
          cuota_ids: cuotaIds
        }
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Actualizar las cuotas de manera individual para asignar el monto_pagado correcto
    for (const cuota of cuotas) {
      const montoPendiente = cuota.monto_cuota - cuota.monto_pagado;
      const { error: updateError } = await supabase
        .from('cuotas_pagos')
        .update({
          estado: 'pagada',
          fecha_pago: new Date().toISOString(),
          monto_pagado: cuota.monto_pagado + montoPendiente,
          metodo_pago: paymentData.paymentMethod || 'unknown',
          transaction_id_cuota: paymentTransaction.id
        })
        .eq('id', cuota.id);

      if (updateError) throw updateError;
    }

    return res.status(200).json({
      success: true,
      paymentTransaction,
      cuotasPagadas: cuotas.length
    });
  } catch (error) {
    console.error('[API] Error pagando cuotas:', error);
    const status = error?.code === 'PGRST301' ? 401 : 500;
    return res.status(status).json({ error: error.message || 'Error procesando pago de cuotas' });
  }
}
