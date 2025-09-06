import { supabase } from '../../supabaseClient';

/**
 * Obtiene el tenant_id actual basado en el hostname
 */
const getCurrentTenantId = () => {
  // Para sistema.veneventos.com, el tenant_id es: 9dbdb86f-8424-484c-bb76-0d9fa27573c8
  const hostname = window.location.hostname;
  
  if (hostname === 'sistema.veneventos.com') {
    return '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
  }
  
  // Aquí puedes agregar más dominios y sus tenant_ids
  return null;
};

/**
 * Obtiene todos los métodos de pago activos para el tenant actual
 */
export const getActivePaymentMethods = async () => {
  try {
    const tenantId = getCurrentTenantId();
    
    if (!tenantId) {
      console.warn('No se pudo determinar el tenant_id actual');
      return [];
    }

    const { data, error } = await supabase
      .from('payment_methods_global')
      .select('*')
      .eq('enabled', true)
      .eq('tenant_id', tenantId)
      .order('method_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    return [];
  }
};

/**
 * Obtiene todos los métodos de pago (activos e inactivos) para el tenant actual
 */
export const getAllPaymentMethods = async () => {
  try {
    const tenantId = getCurrentTenantId();
    
    if (!tenantId) {
      console.warn('No se pudo determinar el tenant_id actual');
      return [];
    }

    const { data, error } = await supabase
      .from('payment_methods_global')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('method_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all payment methods:', error);
    return [];
  }
};

/**
 * Obtiene la configuración de un método de pago específico
 */
export const getPaymentMethodConfig = async (methodId) => {
  try {
    const tenantId = getCurrentTenantId();
    
    if (!tenantId) {
      console.warn('No se pudo determinar el tenant_id actual');
      return null;
    }

    const { data, error } = await supabase
      .from('payment_methods_global')
      .select('*')
      .eq('method_id', methodId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment method config:', error);
    return null;
  }
};

/**
 * Valida la configuración de un método de pago
 */
export const validatePaymentMethodConfig = (method) => {
  const validations = {
    stripe: ['apiKey'],
    paypal: ['clientId', 'clientSecret'],
    apple_pay: ['merchantId'],
    google_pay: ['merchantId'],
    transferencia: ['bankAccount'],
    pago_movil: ['provider', 'apiKey'],
    efectivo_tienda: ['location'],
    efectivo: [] // No requiere configuración adicional
  };

  const requiredFields = validations[method.method_id] || [];
  const missingFields = [];

  // Verificar campos requeridos en la configuración
  for (const field of requiredFields) {
    if (!method.config || !method.config[field]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Campos faltantes: ${missingFields.join(', ')}`
      : 'Configuración válida'
  };
};

/**
 * Obtiene los IDs de métodos de pago disponibles para el tenant actual
 */
export const getAvailablePaymentMethodIds = async () => {
  try {
    const methods = await getActivePaymentMethods();
    return methods.map(method => method.method_id);
  } catch (error) {
    console.error('Error fetching available payment method IDs:', error);
    return [];
  }
};

/**
 * Actualiza la configuración de un método de pago
 */
export const updatePaymentMethodConfig = async (methodId, config) => {
  try {
    const tenantId = getCurrentTenantId();
    
    if (!tenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { data, error } = await supabase
      .from('payment_methods_global')
      .update({ 
        config: config,
        updated_at: new Date().toISOString()
      })
      .eq('method_id', methodId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment method config:', error);
    throw error;
  }
};

/**
 * Habilita o deshabilita un método de pago
 */
export const togglePaymentMethod = async (methodId, enabled) => {
  try {
    const tenantId = getCurrentTenantId();
    
    if (!tenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { data, error } = await supabase
      .from('payment_methods_global')
      .update({ 
        enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('method_id', methodId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling payment method:', error);
    throw error;
  }
};
