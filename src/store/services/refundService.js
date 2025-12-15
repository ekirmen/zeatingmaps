import { supabase } from '../../supabaseClient';
import { updatePaymentTransactionStatus } from './paymentGatewaysService';

/**
 * Crear una solicitud de reembolso
 */

const AutoWrapped_lb5mtb = (props) => {
  export 


      return data;
    } catch (error) {
      console.error('Error creating refund request:', error);
      throw error;
    }
  };

  /**
   * Procesar reembolso según la pasarela
   */
  export 

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

      // 

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
  export 

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
  export 

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
  export 

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
  export 

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting refund:', error);
      throw error;
    }
  }; 

};

export default AutoWrapped_lb5mtb;