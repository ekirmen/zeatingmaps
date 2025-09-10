import { supabase } from '../../supabaseClient';

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: {
        name: 'Stripe',
        icon: '💳',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN'],
        supportedMethods: ['card', 'bank_transfer', 'wallet']
      },
      paypal: {
        name: 'PayPal',
        icon: '🅿️',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN'],
        supportedMethods: ['paypal', 'card']
      },
      mercadopago: {
        name: 'MercadoPago',
        icon: '🟢',
        supportedCurrencies: ['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU'],
        supportedMethods: ['card', 'bank_transfer', 'wallet', 'cash']
      }
    };
  }

  // Obtener configuración de pasarela
  async getGatewayConfig(gatewayName, tenantId = null) {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_configs')
        .select('*')
        .eq('gateway_name', gatewayName)
        .eq('tenant_id', tenantId || 'global')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error(`Error getting ${gatewayName} config:`, error);
      return null;
    }
  }

  // Guardar configuración de pasarela
  async saveGatewayConfig(gatewayName, config, tenantId = null) {
    try {
      const configData = {
        gateway_name: gatewayName,
        tenant_id: tenantId || 'global',
        config: JSON.stringify(config),
        is_active: config.is_active || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payment_gateway_configs')
        .upsert([configData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error saving ${gatewayName} config:`, error);
      throw error;
    }
  }

  // Configurar Stripe
  async configureStripe(config, tenantId = null) {
    try {
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      const stripeConfig = {
        secret_key: config.secret_key,
        publishable_key: config.publishable_key,
        webhook_secret: config.webhook_secret,
        currency: config.currency || 'USD',
        is_active: config.is_active || false,
        test_mode: config.test_mode || true
      };

      return await this.saveGatewayConfig('stripe', stripeConfig, currentTenantId);
    } catch (error) {
      console.error('Error configuring Stripe:', error);
      throw error;
    }
  }

  // Configurar PayPal
  async configurePayPal(config, tenantId = null) {
    try {
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      const paypalConfig = {
        client_id: config.client_id,
        client_secret: config.client_secret,
        webhook_id: config.webhook_id,
        currency: config.currency || 'USD',
        is_active: config.is_active || false,
        sandbox_mode: config.sandbox_mode || true
      };

      return await this.saveGatewayConfig('paypal', paypalConfig, currentTenantId);
    } catch (error) {
      console.error('Error configuring PayPal:', error);
      throw error;
    }
  }

  // Configurar MercadoPago
  async configureMercadoPago(config, tenantId = null) {
    try {
      const mercadopagoConfig = {
        access_token: config.access_token,
        public_key: config.public_key,
        webhook_url: config.webhook_url,
        currency: config.currency || 'MXN',
        is_active: config.is_active || false,
        sandbox_mode: config.sandbox_mode || true
      };

      return await this.saveGatewayConfig('mercadopago', mercadopagoConfig, tenantId);
    } catch (error) {
      console.error('Error configuring MercadoPago:', error);
      throw error;
    }
  }

  // Procesar pago con Stripe
  async processStripePayment(paymentData) {
    try {
      const config = await this.getGatewayConfig('stripe', paymentData.tenant_id);
      if (!config || !config.is_active) {
        throw new Error('Stripe no está configurado o activo');
      }

      const stripeConfig = JSON.parse(config.config);
      
      // Simular procesamiento de pago con Stripe
      const paymentResult = {
        success: Math.random() > 0.1, // 90% éxito simulado
        transaction_id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gateway: 'stripe',
        amount: paymentData.amount,
        currency: stripeConfig.currency,
        status: 'pending',
        gateway_response: {
          payment_intent_id: `pi_${Date.now()}`,
          client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      if (paymentResult.success) {
        paymentResult.status = 'succeeded';
        paymentResult.gateway_response.status = 'succeeded';
      } else {
        paymentResult.status = 'failed';
        paymentResult.gateway_response.status = 'failed';
        paymentResult.gateway_response.error = 'Payment failed';
      }

      return paymentResult;
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      throw error;
    }
  }

  // Procesar pago con PayPal
  async processPayPalPayment(paymentData) {
    try {
      const config = await this.getGatewayConfig('paypal', paymentData.tenant_id);
      if (!config || !config.is_active) {
        throw new Error('PayPal no está configurado o activo');
      }

      const paypalConfig = JSON.parse(config.config);
      
      // Simular procesamiento de pago con PayPal
      const paymentResult = {
        success: Math.random() > 0.1, // 90% éxito simulado
        transaction_id: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gateway: 'paypal',
        amount: paymentData.amount,
        currency: paypalConfig.currency,
        status: 'pending',
        gateway_response: {
          order_id: `PAYPAL-${Date.now()}`,
          approval_url: `https://paypal.com/checkout/${Date.now()}`,
          payer_id: `payer_${Date.now()}`
        }
      };

      if (paymentResult.success) {
        paymentResult.status = 'completed';
        paymentResult.gateway_response.status = 'completed';
      } else {
        paymentResult.status = 'failed';
        paymentResult.gateway_response.status = 'failed';
        paymentResult.gateway_response.error = 'Payment failed';
      }

      return paymentResult;
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      throw error;
    }
  }

  // Procesar pago con MercadoPago
  async processMercadoPagoPayment(paymentData) {
    try {
      const config = await this.getGatewayConfig('mercadopago', paymentData.tenant_id);
      if (!config || !config.is_active) {
        throw new Error('MercadoPago no está configurado o activo');
      }

      const mercadopagoConfig = JSON.parse(config.config);
      
      // Simular procesamiento de pago con MercadoPago
      const paymentResult = {
        success: Math.random() > 0.1, // 90% éxito simulado
        transaction_id: `mercadopago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gateway: 'mercadopago',
        amount: paymentData.amount,
        currency: mercadopagoConfig.currency,
        status: 'pending',
        gateway_response: {
          preference_id: `pref_${Date.now()}`,
          init_point: `https://mercadopago.com/checkout/${Date.now()}`,
          payment_id: `payment_${Date.now()}`
        }
      };

      if (paymentResult.success) {
        paymentResult.status = 'approved';
        paymentResult.gateway_response.status = 'approved';
      } else {
        paymentResult.status = 'rejected';
        paymentResult.gateway_response.status = 'rejected';
        paymentResult.gateway_response.error = 'Payment rejected';
      }

      return paymentResult;
    } catch (error) {
      console.error('Error processing MercadoPago payment:', error);
      throw error;
    }
  }

  // Procesar pago con la pasarela configurada
  async processPayment(paymentData) {
    try {
      const config = await this.getGatewayConfig(paymentData.gateway, paymentData.tenant_id);
      if (!config || !config.is_active) {
        throw new Error(`${paymentData.gateway} no está configurado o activo`);
      }

      switch (paymentData.gateway) {
        case 'stripe':
          return await this.processStripePayment(paymentData);
        case 'paypal':
          return await this.processPayPalPayment(paymentData);
        case 'mercadopago':
          return await this.processMercadoPagoPayment(paymentData);
        default:
          throw new Error(`Pasarela ${paymentData.gateway} no soportada`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Obtener pasarelas disponibles
  getAvailableGateways() {
    return this.gateways;
  }

  // Obtener configuración de todas las pasarelas
  async getAllGatewayConfigs(tenantId = null) {
    try {
      // Si no se especifica tenantId, usar el tenant actual del contexto
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('payment_gateway_configs')
        .select('*')
        .eq('tenant_id', currentTenantId);

      if (error) throw error;

      const configs = {};
      data.forEach(config => {
        configs[config.gateway_name] = {
          ...config,
          config: JSON.parse(config.config)
        };
      });

      return configs;
    } catch (error) {
      console.error('Error getting all gateway configs:', error);
      return {};
    }
  }

  // Obtener el tenant actual del contexto
  getCurrentTenantId() {
    // Intentar obtener del contexto de React o localStorage
    try {
      const tenantData = localStorage.getItem('currentTenant');
      if (tenantData) {
        const tenant = JSON.parse(tenantData);
        return tenant.id;
      }
    } catch (error) {
      console.warn('No se pudo obtener tenant actual:', error);
    }
    
    // Fallback: usar 'global' si no hay tenant específico
    return 'global';
  }

  // Verificar configuración de pasarela
  async verifyGatewayConfig(gatewayName, tenantId = null) {
    try {
      const config = await this.getGatewayConfig(gatewayName, tenantId);
      if (!config) return { valid: false, error: 'Configuración no encontrada' };

      const gatewayConfig = JSON.parse(config.config);
      
      // Verificar campos requeridos según la pasarela
      switch (gatewayName) {
        case 'stripe':
          if (!gatewayConfig.secret_key || !gatewayConfig.publishable_key) {
            return { valid: false, error: 'Claves de Stripe requeridas' };
          }
          break;
        case 'paypal':
          if (!gatewayConfig.client_id || !gatewayConfig.client_secret) {
            return { valid: false, error: 'Credenciales de PayPal requeridas' };
          }
          break;
        case 'mercadopago':
          if (!gatewayConfig.access_token || !gatewayConfig.public_key) {
            return { valid: false, error: 'Tokens de MercadoPago requeridos' };
          }
          break;
        default:
          return { valid: false, error: 'Pasarela no soportada' };
      }

      return { valid: true, config: gatewayConfig };
    } catch (error) {
      console.error(`Error verifying ${gatewayName} config:`, error);
      return { valid: false, error: error.message };
    }
  }

  // Obtener estadísticas de pagos por pasarela
  async getPaymentStats(tenantId = null) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('gateway, status, amount')
        .eq('tenant_id', tenantId || 'global');

      if (error) throw error;

      const stats = {};
      data.forEach(transaction => {
        if (!stats[transaction.gateway]) {
          stats[transaction.gateway] = {
            total: 0,
            successful: 0,
            failed: 0,
            amount: 0
          };
        }

        stats[transaction.gateway].total++;
        stats[transaction.gateway].amount += transaction.amount;

        if (transaction.status === 'completed' || transaction.status === 'succeeded' || transaction.status === 'approved') {
          stats[transaction.gateway].successful++;
        } else {
          stats[transaction.gateway].failed++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {};
    }
  }
}

const paymentGatewayServiceInstance = new PaymentGatewayService();
export default paymentGatewayServiceInstance;
