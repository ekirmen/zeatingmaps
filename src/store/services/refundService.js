import { supabase } from '../../supabaseClient';
import { updatePaymentTransactionStatus } from './paymentGatewaysService';

/**
 * Crear una solicitud de reembolso
 */

/**
 * Crear una solicitud de reembolso
 */
export const createRefundRequest = async (refundData) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        ...refundData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating refund request:', error);
    throw error;
  }
};

/**
 * Procesar reembolso según la pasarela
 */
/**
 * Procesar reembolso según la pasarela
 */
export const processRefund = async (refund, gateway) => {
  try {
    const { data, error: refundError } = await supabase
      .from('refunds')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', refund.id)
      .select()
      .single();

    if (refundError) throw refundError;

    // Procesar según la pasarela
    switch (gateway.type) {
      case 'stripe':
        return await processStripeRefund(refund, gateway);
      case 'paypal':
        return await processPayPalRefund(refund, gateway);
      case 'transfer':
        return await processTransferRefund(refund, gateway);
      default:
        throw new Error(`Reembolso no soportado para ${gateway.type}`);
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Procesar reembolso de Stripe
 */
const processStripeRefund = async (refund, gateway) => {
  try {
    // Implementar lógica de Stripe aquí
    // const stripe = require('stripe')(gateway.config.secret_key);
    // const refund = await stripe.refunds.create({...}); Simulación
    const mockRefund = {
      id: `re_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      amount: refund.amount
    };

    // Actualizar estado del reembolso
    await supabase
      .from('refunds')
      .update({
        status: 'completed',
        gateway_refund_id: mockRefund.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', refund.id);

    // Actualizar transacción original
    await updatePaymentTransactionStatus(
      refund.transaction_id,
      'refunded',
      { refund: mockRefund }
    );

    return {
      success: true,
      refundId: mockRefund.id,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error processing Stripe refund:', error);
    throw error;
  }
};

/**
 * Procesar reembolso de PayPal
 */
const processPayPalRefund = async (refund, gateway) => {
  try {
    // Implementar lógica de PayPal aquí
    const mockRefund = {
      id: `pp_ref_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      amount: refund.amount
    };


    await supabase
      .from('refunds')
      .update({
        status: 'completed',
        gateway_refund_id: mockRefund.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', refund.id);

    return {
      success: true,
      refundId: mockRefund.id,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error processing PayPal refund:', error);
    throw error;
  }
};

/**
 * Procesar reembolso de transferencia (manual)
 */
const processTransferRefund = async (refund, gateway) => {
  try {
    // Para transferencias, el reembolso es manual


    return {
      success: true,
      status: 'pending_manual',
      message: 'Reembolso manual requerido'
    };
  } catch (error) {
    console.error('Error processing transfer refund:', error);
    throw error;
  }
};

/**
 * Obtener reembolsos por transacción
 */
/**
 * Obtener reembolsos por transacción
 */
export const getRefundsByTransaction = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting refunds:', error);
    return [];
  }
};

/**
 * Obtener todas las solicitudes de reembolso
 */
/**
 * Obtener todas las solicitudes de reembolso
 */
export const getAllRefunds = async (filters = {}) => {
  try {
    let query = supabase
      .from('refunds')
      .select('*, payment_transactions(locator, amount, currency), user:user_id(email, id)');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange[0])
        .lte('created_at', filters.dateRange[1]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all refunds:', error);
    return [];
  }
};

/**
 * Aprobar reembolso manual
 */
/**
 * Aprobar reembolso manual
 */
export const approveManualRefund = async (refundId, approvedBy) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'completed',
        approved_by: approvedBy,
        processed_at: new Date().toISOString()
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error approving manual refund:', error);
    throw error;
  }
};

/**
 * Rechazar reembolso
 */
/**
 * Rechazar reembolso
 */
export const rejectRefund = async (refundId, reason, rejectedBy) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: rejectedBy,
        processed_at: new Date().toISOString()
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rejecting refund:', error);
    throw error;
  }
};