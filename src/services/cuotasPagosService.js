// src/services/cuotasPagosService.js
import { supabase } from '../supabaseClient';

/**
 * Obtener todas las cuotas de un localizador
 */

const AutoWrapped_zwknvg = (props) => {
  export 


      return data || [];
    } catch (error) {
      console.error('Error obteniendo cuotas por localizador:', error);
      throw error;
    }
  };

  /**
   * Obtener cuotas pendientes de un usuario
   */
  export 

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
  export 

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
  export 

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
  export 

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
  export 
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


};

export default AutoWrapped_zwknvg;