import { supabase } from '../../supabaseClient';

class BillingService {
  constructor() {
    this.stripe = null; // Se inicializará con la clave de API
  }

  // Inicializar Stripe
  async initializeStripe() {
    try {
      const { data: config } = await supabase
        .from('system_settings')
        .select('stripe_secret_key')
        .eq('key', 'stripe_secret_key')
        .single();

      if (config?.stripe_secret_key) {
        // En un entorno real, usarías la SDK de Stripe
        this.stripe = { secretKey: config.stripe_secret_key };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  }

  // Crear suscripción para un tenant
  async createSubscription(tenantId, planType, customerEmail) {
    try {
      const planPrices = {
        basic: 29.99,
        pro: 79.99,
        enterprise: 199.99
      };

      const subscriptionData = {
        tenant_id: tenantId,
        plan_type: planType,
        amount: planPrices[planType],
        status: 'active',
        next_billing_date: this.getNextBillingDate(),
        customer_email: customerEmail,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('billing_subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar el tenant con el plan
      await supabase
        .from('tenants')
        .update({ 
          plan_type: planType,
          billing_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Procesar pagos recurrentes
  async processRecurringPayments() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: subscriptions, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('next_billing_date', today);

      if (error) throw error;

      const results = [];
      for (const subscription of subscriptions) {
        try {
          const result = await this.processPayment(subscription);
          results.push(result);
        } catch (error) {
          console.error(`Error processing payment for tenant ${subscription.tenant_id}:`, error);
          await this.handlePaymentFailure(subscription);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing recurring payments:', error);
      throw error;
    }
  }

  // Procesar un pago individual
  async processPayment(subscription) {
    try {
      // Simular procesamiento de pago con Stripe
      const paymentResult = {
        success: Math.random() > 0.1, // 90% éxito simulado
        transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: subscription.amount,
        tenant_id: subscription.tenant_id
      };

      if (paymentResult.success) {
        // Actualizar suscripción
        await supabase
          .from('billing_subscriptions')
          .update({
            last_payment_date: new Date().toISOString(),
            next_billing_date: this.getNextBillingDate(),
            payment_count: subscription.payment_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Crear registro de pago
        await supabase
          .from('payment_transactions')
          .insert([{
            tenant_id: subscription.tenant_id,
            amount: subscription.amount,
            type: 'subscription',
            status: 'completed',
            transaction_id: paymentResult.transaction_id,
            created_at: new Date().toISOString()
          }]);

        // Enviar notificación de pago exitoso
        await this.sendPaymentNotification(subscription.tenant_id, 'success', {
          amount: subscription.amount,
          transaction_id: paymentResult.transaction_id
        });
      } else {
        throw new Error('Payment failed');
      }

      return paymentResult;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Manejar fallo de pago
  async handlePaymentFailure(subscription) {
    try {
      // Actualizar estado de la suscripción
      await supabase
        .from('billing_subscriptions')
        .update({
          status: 'payment_failed',
          failure_count: subscription.failure_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      // Enviar notificación de fallo
      await this.sendPaymentNotification(subscription.tenant_id, 'failure', {
        amount: subscription.amount,
        failure_count: subscription.failure_count + 1
      });

      // Si es el tercer fallo, suspender el tenant
      if (subscription.failure_count >= 2) {
        await supabase
          .from('tenants')
          .update({ 
            status: 'suspended',
            billing_status: 'suspended',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.tenant_id);
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Enviar notificación de pago
  async sendPaymentNotification(tenantId, type, data) {
    try {
      const notificationData = {
        tenant_id: tenantId,
        type: `payment_${type}`,
        title: type === 'success' ? 'Pago Procesado Exitosamente' : 'Fallo en el Pago',
        message: type === 'success' 
          ? `Su pago de $${data.amount} ha sido procesado exitosamente. ID de transacción: ${data.transaction_id}`
          : `Su pago de $${data.amount} ha fallado. Intento ${data.failure_count}/3.`,
        read: false,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('notifications')
        .insert([notificationData]);
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  // Obtener fecha del próximo pago
  getNextBillingDate() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString();
  }

  // Obtener estadísticas de facturación
  async getBillingStats() {
    try {
      const [
        { count: totalSubscriptions },
        { count: activeSubscriptions },
        { count: failedSubscriptions },
        { data: monthlyRevenue }
      ] = await Promise.all([
        supabase.from('billing_subscriptions').select('*', { count: 'exact', head: true }),
        supabase.from('billing_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('billing_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'payment_failed'),
        supabase.from('payment_transactions').select('amount').eq('status', 'completed').gte('created_at', this.getCurrentMonthStart())
      ]);

      const revenue = monthlyRevenue?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

      return {
        totalSubscriptions: totalSubscriptions || 0,
        activeSubscriptions: activeSubscriptions || 0,
        failedSubscriptions: failedSubscriptions || 0,
        monthlyRevenue: revenue,
        successRate: activeSubscriptions / (totalSubscriptions || 1) * 100
      };
    } catch (error) {
      console.error('Error getting billing stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        failedSubscriptions: 0,
        monthlyRevenue: 0,
        successRate: 0
      };
    }
  }

  // Obtener inicio del mes actual
  getCurrentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  // Cancelar suscripción
  async cancelSubscription(subscriptionId) {
    try {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar tenant
      await supabase
        .from('tenants')
        .update({
          billing_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.tenant_id);

      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Reanudar suscripción
  async resumeSubscription(subscriptionId) {
    try {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .update({
          status: 'active',
          next_billing_date: this.getNextBillingDate(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar tenant
      await supabase
        .from('tenants')
        .update({
          billing_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.tenant_id);

      return data;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }
}

const billingServiceInstance = new BillingService();
export default billingServiceInstance;
