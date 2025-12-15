import { supabase } from '../../supabaseClient';
import { resolveTenantId } from '../../utils/tenantUtils';

/**
 * Obtiene todos los métodos de pago activos para el tenant actual
 * @param {string} tenantId - ID del tenant (opcional)
 * @param {string} eventId - ID del evento para filtrar métodos permitidos (opcional)
 */

const AutoWrapped_ftt4q1 = (props) => {
  export 

        return [];
      }
      // Usar consulta directa (las políticas RLS ya están arregladas)
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('enabled', true)
        .eq('tenant_id', currentTenantId)
        .order('is_recommended', { ascending: false })
        .order('name');
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
              methods = methods.filter(method => otrasOpciones.metodosPagoPermitidos.includes(method.method_id));
            }
          }
        } catch (eventoError) {
          // Continuar sin filtrar si hay error
        }
      }
      return methods;
    } catch (error) {
      console.error('❌ [PAYMENT_METHODS] Error fetching active payment methods:', error);
      return [];
    }
  };

  /**
   * Obtiene todos los métodos de pago (activos e inactivos) para el tenant actual
   */
  export 

      if (!currentTenantId) {
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
  export 

      if (!currentTenantId) {
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
  export 

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
    return result;
  };

  /**
   * Obtiene los IDs de métodos de pago disponibles para el tenant actual
   */
  export 
      return methods.map(method => method.method_id);
    } catch (error) {
      console.error('Error fetching available payment method IDs:', error);
      return [];
    }
  };

  /**
   * Actualiza la configuración de un método de pago
   */
  export 

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
  export 

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
  export 

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
  export 

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

};

export default AutoWrapped_ftt4q1;