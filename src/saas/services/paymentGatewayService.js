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
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      // Buscar en payment_methods usando method_id
      let query = supabase
        .from('payment_methods')
        .select('*')
        .eq('method_id', gatewayName);
      
      // Si hay tenant_id, filtrar por él, sino buscar globales (tenant_id null)
      if (currentTenantId && currentTenantId !== 'global') {
        query = query.eq('tenant_id', currentTenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      
      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Mapear a formato compatible con el componente (mantener compatibilidad)
      if (data) {
        return {
          id: data.id,
          gateway_name: data.method_id,
          tenant_id: data.tenant_id,
          config: typeof data.config === 'string' ? data.config : JSON.stringify(data.config),
          is_active: data.enabled,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting ${gatewayName} config:`, error);
      return null;
    }
  }

  // Guardar configuración de pasarela
  async saveGatewayConfig(gatewayName, config, tenantId = null) {
    try {
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      // Mapear nombres de métodos de pago
      const methodNameMap = {
        'stripe': 'Stripe',
        'paypal': 'PayPal',
        'mercadopago': 'MercadoPago'
      };
      
      const methodTypeMap = {
        'stripe': 'stripe',
        'paypal': 'paypal',
        'mercadopago': 'mercadopago'
      };
      
      // Buscar si ya existe para preservar campos adicionales
      let query = supabase
        .from('payment_methods')
        .select('*')
        .eq('method_id', gatewayName);
      
      if (currentTenantId && currentTenantId !== 'global') {
        query = query.eq('tenant_id', currentTenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      
      const { data: existingMethod, error: checkError } = await query.maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Preparar datos para payment_methods
      const methodData = {
        method_id: gatewayName,
        name: methodNameMap[gatewayName] || gatewayName,
        type: methodTypeMap[gatewayName] || 'other',
        enabled: config.is_active !== undefined ? config.is_active : false,
        config: typeof config === 'string' ? JSON.parse(config) : config,
        tenant_id: currentTenantId && currentTenantId !== 'global' ? currentTenantId : null,
        updated_at: new Date().toISOString()
      };
      
      // Preservar campos adicionales si el método ya existe
      if (existingMethod) {
        methodData.processing_time = existingMethod.processing_time || 'Instantáneo';
        methodData.fee_structure = existingMethod.fee_structure || { fixed: 0, percentage: 0 };
        methodData.supported_currencies = existingMethod.supported_currencies || ['USD'];
        methodData.supported_countries = existingMethod.supported_countries || ['US'];
        methodData.is_recommended = existingMethod.is_recommended !== undefined ? existingMethod.is_recommended : false;
        methodData.icon = existingMethod.icon || null;
        methodData.description = existingMethod.description || null;
        methodData.created_at = existingMethod.created_at;
      } else {
        // Valores por defecto para métodos nuevos
        methodData.processing_time = 'Instantáneo';
        methodData.fee_structure = { fixed: 0.3, percentage: 2.9 };
        methodData.supported_currencies = ['USD'];
        methodData.supported_countries = ['US'];
        methodData.is_recommended = false;
        methodData.icon = null;
        methodData.description = null;
        methodData.created_at = new Date().toISOString();
      }

      let result;
      if (existingMethod) {
        // Actualizar existente
        const { data, error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', existingMethod.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Crear nuevo
        const { data, error } = await supabase
          .from('payment_methods')
          .insert([methodData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      // Mapear respuesta a formato compatible con el componente
      return {
        id: result.id,
        gateway_name: result.method_id,
        tenant_id: result.tenant_id,
        config: typeof result.config === 'string' ? result.config : JSON.stringify(result.config),
        is_active: result.enabled,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
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
        is_active: config.is_active !== undefined ? config.is_active : (config.enabled !== undefined ? config.enabled : false),
        sandbox_mode: config.sandbox_mode !== undefined ? config.sandbox_mode : true
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
      const currentTenantId = tenantId || this.getCurrentTenantId();
      
      const mercadopagoConfig = {
        access_token: config.access_token,
        public_key: config.public_key,
        webhook_url: config.webhook_url,
        currency: config.currency || 'MXN',
        is_active: config.is_active !== undefined ? config.is_active : (config.enabled !== undefined ? config.enabled : false),
        sandbox_mode: config.sandbox_mode !== undefined ? config.sandbox_mode : true
      };

      return await this.saveGatewayConfig('mercadopago', mercadopagoConfig, currentTenantId);
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

      // El config ya viene parseado desde getGatewayConfig
      const stripeConfig = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;
      
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

      // El config ya viene parseado desde getGatewayConfig
      const paypalConfig = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;
      
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

      // El config ya viene parseado desde getGatewayConfig
      const mercadopagoConfig = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;
      
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
      
      let query = supabase
        .from('payment_methods')
        .select('*');
      
      // Filtrar por tenant_id si existe
      if (currentTenantId && currentTenantId !== 'global') {
        query = query.eq('tenant_id', currentTenantId);
      } else {
        // Buscar métodos globales (tenant_id null)
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const configs = {};
      if (data) {
        data.forEach(method => {
          configs[method.method_id] = {
            id: method.id,
            gateway_name: method.method_id,
            tenant_id: method.tenant_id,
            config: typeof method.config === 'string' 
              ? JSON.parse(method.config) 
              : method.config,
            is_active: method.enabled,
            created_at: method.created_at,
            updated_at: method.updated_at
          };
        });
      }

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

      // El config viene como string desde getGatewayConfig, parsearlo
      const gatewayConfig = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;
      
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
