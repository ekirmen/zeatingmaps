// src/services/cuotasPagosService.js
import { supabase } from '../supabaseClient';

/**
 * Obtener todas las cuotas de un localizador
 */
export const getCuotasByLocator = async (locator) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pago')
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
export const getPendingCuotasByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pago')
      .select('*')
      .eq('usuario_id', userId)
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
export const getCuotasByTransactionId = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('cuotas_pago')
      .select('*')
      .eq('payment_transaction_id', transactionId)
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
export const payCuotas = async (cuotaIds, paymentMethodId) => {
  try {
    const response = await fetch('/api/payments/pay-cuotas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cuotaIds, paymentMethodId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || 'Error procesando pago de cuotas');
    }

    return result;
  } catch (error) {
    console.error('Error pagando cuotas:', error);
    throw error;
  }
};

/**
 * Verificar si una función tiene pagos a plazos activos
 */
export const checkPagosPlazosActive = async (funcionId) => {
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
export const calculateCuotasDistribution = (montoTotal, cantidadCuotas) => {
  if (!cantidadCuotas || cantidadCuotas <= 1) {
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