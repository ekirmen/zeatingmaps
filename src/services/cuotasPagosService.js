// src/services/cuotasPagosService.js
import { supabase } from '../supabaseClient';

/**
 * Obtener todas las cuotas de un localizador
 */
export const getCuotasByLocator = async (locator) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pagos')
      .select('*')
      .eq('locator', locator)
      .order('numero_cuota', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo cuotas por localizador:', error);
    throw error;
  }
};

/**
 * Obtener cuotas pendientes de un usuario
 */
export const getCuotasPendientesByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pagos')
      .select(`
        *,
        payment_transactions (
          locator,
          amount,
          seats,
          evento_id,
          funcion_id
        ),
        eventos (
          id,
          nombre,
          fecha_evento
        ),
        funciones (
          id,
          fecha_celebracion
        )
      `)
      .eq('user_id', userId)
      .eq('estado', 'pendiente')
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo cuotas pendientes:', error);
    throw error;
  }
};

/**
 * Obtener cuotas por payment_transaction_id (UUID)
 */
export const getCuotasByPaymentTransaction = async (paymentTransactionId) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pagos')
      .select('*')
      .eq('payment_transaction_id', paymentTransactionId)
      .order('numero_cuota', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo cuotas por transacción:', error);
    throw error;
  }
};

/**
 * Pagar una o múltiples cuotas
 */
export const pagarCuotas = async (cuotaIds, paymentData) => {
  try {
    // Obtener las cuotas
    const { data: cuotas, error: fetchError } = await supabase
      .from('cuotas_pagos')
      .select('*')
      .in('id', cuotaIds);

    if (fetchError) throw fetchError;

    if (!cuotas || cuotas.length === 0) {
      throw new Error('No se encontraron cuotas para pagar');
    }

    // Calcular monto total a pagar
    const montoTotal = cuotas.reduce((sum, cuota) => {
      const montoPendiente = cuota.monto_cuota - cuota.monto_pagado;
      return sum + montoPendiente;
    }, 0);

    // Crear transacción de pago para las cuotas
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

    // Actualizar las cuotas como pagadas
    const { error: updateError } = await supabase
      .from('cuotas_pagos')
      .update({
        estado: 'pagada',
        fecha_pago: new Date().toISOString(),
        monto_pagado: supabase.raw('monto_cuota'), // Marcar como completamente pagada
        metodo_pago: paymentData.paymentMethod || 'unknown',
        transaction_id_cuota: paymentTransaction.id
      })
      .in('id', cuotaIds);

    if (updateError) throw updateError;

    return {
      success: true,
      paymentTransaction,
      cuotasPagadas: cuotas.length
    };
  } catch (error) {
    console.error('Error pagando cuotas:', error);
    throw error;
  }
};

/**
 * Verificar si una función tiene pagos a plazos activos
 */
export const verificarPagosPlazosActivos = async (funcionId) => {
  try {
    const { data, error } = await supabase
      .from('funciones')
      .select('permite_pago_plazos, cantidad_cuotas, dias_entre_pagos, fecha_inicio_pagos_plazos, fecha_fin_pagos_plazos')
      .eq('id', funcionId)
      .single();

    if (error) throw error;

    if (!data || !data.permite_pago_plazos) {
      return { activo: false };
    }

    // Verificar que estemos dentro del período de pagos a plazos
    const ahora = new Date();
    const fechaInicio = data.fecha_inicio_pagos_plazos ? new Date(data.fecha_inicio_pagos_plazos) : null;
    const fechaFin = data.fecha_fin_pagos_plazos ? new Date(data.fecha_fin_pagos_plazos) : null;

    if (fechaInicio && ahora < fechaInicio) {
      return { activo: false, motivo: 'Aún no ha comenzado el período de pagos a plazos' };
    }

    if (fechaFin && ahora > fechaFin) {
      return { activo: false, motivo: 'Ya finalizó el período de pagos a plazos' };
    }

    return {
      activo: true,
      cantidadCuotas: data.cantidad_cuotas || 0,
      diasEntrePagos: data.dias_entre_pagos || 0,
      fechaInicio: data.fecha_inicio_pagos_plazos,
      fechaFin: data.fecha_fin_pagos_plazos
    };
  } catch (error) {
    console.error('Error verificando pagos a plazos:', error);
    return { activo: false };
  }
};

/**
 * Calcular distribución de cuotas para un monto total
 */
export const calcularCuotas = (montoTotal, cantidadCuotas) => {
  if (cantidadCuotas <= 1) {
    return [{ numero: 1, monto: montoTotal }];
  }

  const montoPorCuota = montoTotal / cantidadCuotas;
  const cuotas = [];
  let montoAcumulado = 0;

  for (let i = 1; i <= cantidadCuotas; i++) {
    const monto = i === cantidadCuotas 
      ? montoTotal - montoAcumulado // La última cuota toma el resto para evitar problemas de redondeo
      : montoPorCuota;
    
    montoAcumulado += monto;
    cuotas.push({
      numero: i,
      monto: parseFloat(monto.toFixed(2))
    });
  }

  return cuotas;
};

