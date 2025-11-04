import { supabase } from '../../supabaseClient';
import { resolveTenantId } from '../../utils/tenantUtils';

/**
 * Obtiene todos los métodos de pago activos para el tenant actual
 * @param {string} tenantId - ID del tenant (opcional)
 * @param {string} eventId - ID del evento para filtrar métodos permitidos (opcional)
 */
export const getActivePaymentMethods = async (tenantId = null, eventId = null) => {
  try {
    const currentTenantId = tenantId || resolveTenantId();
    
    console.log('🔍 [PAYMENT_METHODS] Obteniendo métodos de pago activos...');
    console.log('🏢 [PAYMENT_METHODS] Tenant ID:', currentTenantId);
    console.log('🎫 [PAYMENT_METHODS] Event ID:', eventId);
    
    if (!currentTenantId) {
      console.warn('⚠️ [PAYMENT_METHODS] No se pudo determinar el tenant_id actual');
      return [];
    }

    console.log('🔍 [PAYMENT_METHODS] Ejecutando consulta Supabase...');
    console.log('🔍 [PAYMENT_METHODS] Query params:', {
      table: 'payment_methods',
      enabled: true,
      tenant_id: currentTenantId,
      tenant_id_type: typeof currentTenantId,
      event_id: eventId
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

    let methods = data || [];

    // Si hay un evento, filtrar por métodos permitidos
    if (eventId) {
      try {
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('otrasOpciones')
          .eq('id', eventId)
          .single();

        if (!eventoError && eventoData?.otrasOpciones) {
          const otrasOpciones = typeof eventoData.otrasOpciones === 'string' 
            ? JSON.parse(eventoData.otrasOpciones) 
            : eventoData.otrasOpciones;

          // Si hay métodos permitidos configurados, filtrar por ellos
          if (otrasOpciones?.metodosPagoPermitidos && Array.isArray(otrasOpciones.metodosPagoPermitidos) && otrasOpciones.metodosPagoPermitidos.length > 0) {
            console.log('🔍 [PAYMENT_METHODS] Filtrando por métodos permitidos del evento:', otrasOpciones.metodosPagoPermitidos);
            methods = methods.filter(method => otrasOpciones.metodosPagoPermitidos.includes(method.method_id));
            console.log('📊 [PAYMENT_METHODS] Métodos después del filtro del evento:', methods.length);
          }
        }
      } catch (eventoError) {
        console.warn('⚠️ [PAYMENT_METHODS] Error obteniendo configuración del evento:', eventoError);
        // Continuar sin filtrar si hay error
      }
    }

    console.log('📊 [PAYMENT_METHODS] Métodos encontrados:', methods.length);
    console.log('📋 [PAYMENT_METHODS] Datos:', methods);
    
    return methods;
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
    efectivo: [], // No requiere configuración adicional
    cashea: ['api_base_url', 'merchant_id']
  };

  const requiredFields = validations[method.method_id] || [];
  const missingFields = [];

  // Verificar campos requeridos en la configuración
  for (const field of requiredFields) {
    if (!method.config || !method.config[field]) {
      missingFields.push(field);
    }
  }

  if (method.method_id === 'cashea') {
    const hasAuthCredential = Boolean(
      method.config?.api_key || method.config?.access_token || method.config?.api_secret
    );

    if (!hasAuthCredential) {
      missingFields.push('api_key');
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
    const currentTenantId = tenantId || resolveTenantId();
    
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
