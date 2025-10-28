import { supabase } from '../../supabaseClient';

/**
 * Obtiene el tenant_id actual basado en el hostname
 */
const getCurrentTenantId = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'sistema.veneventos.com') {
    return '9dbdb86f-8424-484c-bb76-0d9fa27573c8';
  }
  
  return null;
};

/**
 * Obtiene todos los métodos de pago activos para el tenant actual
 */
export const getActivePaymentMethods = async (tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    console.log('🔍 [PAYMENT_METHODS] Obteniendo métodos de pago activos...');
    console.log('🏢 [PAYMENT_METHODS] Tenant ID:', currentTenantId);
    
    if (!currentTenantId) {
      console.warn('⚠️ [PAYMENT_METHODS] No se pudo determinar el tenant_id actual');
      return [];
    }

    console.log('🔍 [PAYMENT_METHODS] Ejecutando consulta Supabase...');
    console.log('🔍 [PAYMENT_METHODS] Query params:', {
      table: 'payment_methods',
      enabled: true,
      tenant_id: currentTenantId,
      tenant_id_type: typeof currentTenantId
    });

    // Usar consulta directa (las políticas RLS ya están arregladas)
    console.log('🔍 [PAYMENT_METHODS] Usando consulta directa...');
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('enabled', true)
      .eq('tenant_id', currentTenantId)
      .order('is_recommended', { ascending: false })
      .order('name');

    console.log('🔍 [PAYMENT_METHODS] Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('❌ [PAYMENT_METHODS] Error en la consulta:', error);
      throw error;
    }

    console.log('📊 [PAYMENT_METHODS] Métodos encontrados:', data?.length || 0);
    console.log('📋 [PAYMENT_METHODS] Datos:', data);
    
    return data || [];
  } catch (error) {
    console.error('❌ [PAYMENT_METHODS] Error fetching active payment methods:', error);
    return [];
  }
};

/**
 * Obtiene todos los métodos de pago (activos e inactivos) para el tenant actual
 */
export const getAllPaymentMethods = async (tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      console.warn('No se pudo determinar el tenant_id actual');
      return [];
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('tenant_id', currentTenantId)
      .order('is_recommended', { ascending: false })
      .order('name');

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
export const getPaymentMethodConfig = async (methodId, tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      console.warn('No se pudo determinar el tenant_id actual');
      return null;
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('method_id', methodId)
      .eq('tenant_id', currentTenantId)
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
  console.log('🔍 [VALIDATION] Validando método:', method.method_id, method.config);
  
  const validations = {
    stripe: ['publishable_key', 'secret_key'],
    paypal: ['client_id', 'client_secret'],
    apple_pay: ['merchant_id'],
    google_pay: ['merchant_id'],
    transferencia: ['bank_name', 'account_number'],
    pago_movil: ['provider', 'api_key'],
    efectivo_tienda: ['store_address'],
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

  const result = {
    valid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0 
      ? `Campos faltantes: ${missingFields.join(', ')}`
      : 'Configuración válida'
  };

  console.log('✅ [VALIDATION] Resultado:', result);
  return result;
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
export const updatePaymentMethodConfig = async (methodId, config, tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update({ 
        config: config,
        updated_at: new Date().toISOString()
      })
      .eq('method_id', methodId)
      .eq('tenant_id', currentTenantId)
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
export const togglePaymentMethod = async (methodId, enabled, tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update({ 
        enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('method_id', methodId)
      .eq('tenant_id', currentTenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling payment method:', error);
    throw error;
  }
};

/**
 * Crea un nuevo método de pago
 */
export const createPaymentMethod = async (methodData, tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        ...methodData,
        tenant_id: currentTenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }
};

/**
 * Elimina un método de pago
 */
export const deletePaymentMethod = async (methodId, tenantId = null) => {
  try {
    const currentTenantId = tenantId || getCurrentTenantId();
    
    if (!currentTenantId) {
      throw new Error('No se pudo determinar el tenant_id actual');
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('method_id', methodId)
      .eq('tenant_id', currentTenantId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};
