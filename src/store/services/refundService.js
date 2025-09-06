import { supabase } from '../../supabaseClient';
import { updatePaymentTransactionStatus } from './paymentGatewaysService';

/**
 * Crear una solicitud de reembolso
 */
export const createRefundRequest = async (refundData) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .insert({
        transaction_id: refundData.transactionId,
        amount: refundData.amount,
        reason: refundData.reason,
        status: 'pending',
        requested_by: refundData.requestedBy,
        notes: refundData.notes
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
export const processRefund = async (refundId, gateway) => {
  try {
    // Obtener datos del reembolso
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .select(`
        *,
        payment_transactions (
          *,
          payment_gateways (type, config)
        )
      `)
      .eq('id', refundId)
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
    // Aquí iría la integración real con Stripe
    // const stripe = require('stripe')(gateway.config.secret_key);
    // const stripeRefund = await stripe.refunds.create({
    //   payment_intent: refund.payment_transactions.gateway_transaction_id,
    //   amount: refund.amount * 100 // Stripe usa centavos
    // });

    // Simulación
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
    // Simulación de PayPal
    const mockRefund = {
      id: `REFUND-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'COMPLETED',
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
    await supabase
      .from('refunds')
      .update({
        status: 'pending_manual',
        notes: 'Reembolso manual requerido - contactar al cliente'
      })
      .eq('id', refund.id);

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
export const getAllRefunds = async (filters = {}) => {
  try {
    let query = supabase
      .from('refunds')
      .select(`
        *,
        payment_transactions (*)
      `);

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
export const approveManualRefund = async (refundId, adminNotes) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'completed',
        admin_notes: adminNotes,
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
export const rejectRefund = async (refundId, reason) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        admin_notes: reason,
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