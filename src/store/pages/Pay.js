import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentMethods, validatePaymentMethodConfig } from '../services/paymentMethodsService';
import { processPaymentMethod } from '../services/paymentMethodsProcessor';
import { createPaymentSuccessNotification } from '../services/paymentNotifications';
import atomicSeatLockService from '../../services/atomicSeatLock';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useSeatLockStore } from '../../components/seatLockStore';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent } from '../services/facebookPixelService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { resolveTenantId } from '../../utils/tenantUtils';
import { verificarPagosPlazosActivos, calcularCuotas } from '../../services/cuotasPagosService';
import InstallmentPaymentSelector from '../../components/InstallmentPaymentSelector';
import logger from '../../utils/logger';


const Pay = () => {
  // Debug log removed for production performance
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  // useCartStore almacena los asientos seleccionados en la propiedad `items`
  // En algunos contextos `cart` no existe y producía `undefined`, generando
  // errores al intentar usar `reduce`. Se usa `items` y se asegura un arreglo.
  const { items: cartItems, clearCart, functionId } = useCartStore();
  const { handleError, showSuccess } = useErrorHandler();
  
  // Usar seatLockStore para sincronización en tiempo real
  const { lockedSeats, subscribeToFunction, unsubscribe } = useSeatLockStore();
  const total = (cartItems || []).reduce(
    (sum, item) => sum + (item.precio || 0),
    0
  );
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [facebookPixel, setFacebookPixel] = useState(null);
  const [pricesWithFees] = useState({});
  const [pagosPlazosActivos, setPagosPlazosActivos] = useState(null);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(0); // 0 = todas, 1, 2, 3 = número de cuotas
  const [cuotasCalculadas, setCuotasCalculadas] = useState([]);

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent('store:open-account-modal', {
          detail: { mode: 'login', source: 'pay', redirectTo: '/store/payment' }
        })
      );
    }
  }, [user]);

  useEffect(() => {
    // Debug log removed for production performance
    
    const loadGateways = async () => {
      try {
        setLoadingMethods(true);
        logger.log('🛒 [PAY] Cargando métodos de pago...');
        
        // Obtener el ID del evento del primer item del carrito
        const eventId = cartItems?.[0]?.eventId || null;
        logger.log('🎫 [PAY] Event ID del carrito:', eventId);
        
        const methods = await getActivePaymentMethods(null, eventId);
        logger.log('📋 [PAY] Métodos obtenidos de la BD:', methods);
        
        const validMethods = methods.filter(method => {
          const validation = validatePaymentMethodConfig(method);
          logger.log(`🔍 [PAY] Validando ${method.method_id}:`, validation);
          return validation.valid;
        });
        
        logger.log('✅ [PAY] Métodos válidos después del filtro:', validMethods);
        setAvailableMethods(validMethods);
        
        // Por ahora, no calculamos comisiones específicas
        // Esto se puede implementar más tarde usando la tabla comisiones_tasas
      } catch (error) {
        logger.error('❌ [PAY] Error loading payment gateways:', error);
        message.error('Error al cargar métodos de pago');
      } finally {
        setLoadingMethods(false);
      }
    };
    const loadFacebookPixel = async () => {
      try {
        if (cartItems && cartItems.length > 0) {
          // Obtener el píxel del primer evento en el carrito
          const firstEventId = cartItems[0]?.eventId;
          if (firstEventId) {
            const pixel = await getFacebookPixelByEvent(firstEventId);
            setFacebookPixel(pixel);
          }
        }
      } catch (error) {
        logger.error('Error loading Facebook pixel:', error);
      }
    };

    // Only load data if user is authenticated
    if (user) {
      console.log('✅ [PAY] Usuario autenticado, cargando métodos de pago...');
      loadGateways();
      loadFacebookPixel();
    } else {
      console.log('❌ [PAY] Usuario NO autenticado, no se cargan métodos de pago');
    }
  }, [cartItems, total, user]);

  // Verificar pagos a plazos activos
  useEffect(() => {
    const verificarPlazos = async () => {
      if (functionId) {
        try {
          const info = await verificarPagosPlazosActivos(functionId);
          setPagosPlazosActivos(info);
          if (info.activo) {
            const cuotas = calcularCuotas(total, info.cantidadCuotas);
            setCuotasCalculadas(cuotas);
            setCuotasSeleccionadas(0); // Por defecto, todas las cuotas
          }
        } catch (error) {
          console.error('Error verificando pagos a plazos:', error);
          setPagosPlazosActivos({ activo: false });
        }
      } else {
        setPagosPlazosActivos({ activo: false });
      }
    };

    verificarPlazos();
  }, [functionId, total]);

  // Suscribirse a cambios de bloqueo de asientos en tiempo real
  useEffect(() => {
    if (functionId) {
      subscribeToFunction(functionId);
    }

    return () => {
      unsubscribe();
    };
  }, [functionId, subscribeToFunction, unsubscribe]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedGateway(method);
  };

  const handleProcessPayment = async () => {
    // Validaciones robustas antes de procesar el pago
    if (!selectedGateway) {
      message.error('Por favor selecciona un método de pago');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      message.error('No hay asientos seleccionados para procesar');
      return;
    }

    // Validar que todos los asientos sigan disponibles
    try {
      const unavailableSeats = [];
      for (const item of cartItems) {
        const seatId = item.sillaId || item.id || item._id;
        const funcionId = functionId || item.functionId;
        
        if (seatId && funcionId) {
          // Verificar si el asiento está bloqueado por otro usuario
          const isLockedByOther = lockedSeats.some(lock => 
            lock.seat_id === seatId && 
            lock.funcion_id === funcionId && 
            lock.session_id !== localStorage.getItem('anonSessionId')
          );
          
          if (isLockedByOther) {
            unavailableSeats.push(item.nombre || seatId);
            continue;
          }
          
          // Verificar disponibilidad usando el servicio atómico como respaldo
          // Pasar el session_id para que solo verifique locks de otros usuarios
          const currentSessionId = localStorage.getItem('anonSessionId');
          const isAvailable = await atomicSeatLockService.isSeatAvailable(seatId, funcionId, currentSessionId);
          if (!isAvailable) {
            unavailableSeats.push(item.nombre || seatId);
          }
        }
      }

      if (unavailableSeats.length > 0) {
        message.error(`Los siguientes asientos ya no están disponibles: ${unavailableSeats.join(', ')}. Por favor, actualiza tu selección.`);
        return;
      }
    } catch (error) {
      console.error('Error validando disponibilidad de asientos:', error);
      message.error('Error validando disponibilidad de asientos. Por favor, inténtalo de nuevo.');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Generar locator simple de 8 caracteres (números y letras)
      const { generateSimpleLocator } = await import('../../utils/generateLocator');
      const locator = generateSimpleLocator();
      
      let seatSessionId = null;
      if (typeof window !== 'undefined') {
        try {
          seatSessionId =
            window.localStorage?.getItem('anonSessionId') ||
            window.sessionStorage?.getItem('anonSessionId') ||
            null;
        } catch (sessionError) {
          console.warn('No se pudo obtener la sesión de asientos:', sessionError);
        }
      }

      const tenantCandidates = [
        currentTenant?.id,
        selectedGateway?.tenant_id,
        selectedGateway?.tenantId,
        cartItems?.[0]?.tenant_id,
        cartItems?.[0]?.tenantId,
        cartItems?.[0]?.tenant?.id,
      ].filter(Boolean);

      const resolvedTenantId = resolveTenantId(tenantCandidates[0]);

      // Obtener evento_id desde múltiples fuentes
      let eventoId = cartItems?.[0]?.eventId || cartItems?.[0]?.eventoId || null;
      
      // Si no hay evento_id en el carrito pero sí hay funcion_id, obtenerlo desde la función
      if (!eventoId && functionId) {
        try {
          console.log('🎫 [PAY] Obteniendo evento_id desde función:', functionId);
          const { supabase } = await import('../../supabaseClient');
          const { data: funcionData, error: funcionError } = await supabase
            .from('funciones')
            .select('evento_id')
            .eq('id', functionId)
            .single();
          
          if (!funcionError && funcionData) {
            eventoId = funcionData.evento_id || null;
            console.log('✅ [PAY] Evento_id obtenido desde función:', eventoId);
          } else {
            console.warn('⚠️ [PAY] No se pudo obtener evento_id desde función:', funcionError);
            if (funcionError) {
              console.warn('⚠️ [PAY] Detalles del error:', {
                message: funcionError.message,
                code: funcionError.code,
                details: funcionError.details,
                hint: funcionError.hint
              });
            }
          }
        } catch (error) {
          console.warn('⚠️ [PAY] Error al obtener evento_id desde función:', error);
        }
      }

      // Calcular el monto a pagar según las cuotas seleccionadas
      let montoAPagar = total;
      if (pagosPlazosActivos?.activo && cuotasSeleccionadas > 0 && cuotasCalculadas.length > 0) {
        // Si se seleccionaron cuotas específicas (1, 2, 3), usar el monto de esas cuotas
        montoAPagar = cuotasCalculadas.slice(0, cuotasSeleccionadas).reduce((sum, c) => sum + c.monto, 0);
        console.log('💰 [PAY] Pagando cuotas parciales:', {
          cuotasSeleccionadas,
          montoAPagar,
          totalOriginal: total,
          cuotasCalculadas: cuotasCalculadas.slice(0, cuotasSeleccionadas)
        });
      } else if (pagosPlazosActivos?.activo && cuotasSeleccionadas === 0) {
        // Si se seleccionó 0 (todas las cuotas), pagar el total completo
        montoAPagar = total;
        console.log('💰 [PAY] Pagando todas las cuotas:', {
          montoAPagar,
          totalCuotas: pagosPlazosActivos.cantidadCuotas
        });
      }

      // Preparar metadata para pagos a plazos
      const metadata = {};
      if (pagosPlazosActivos?.activo && cuotasCalculadas.length > 0) {
        // Si cuotasSeleccionadas es 0, significa que se pagaron TODAS las cuotas
        const cuotasPagadas = cuotasSeleccionadas === 0 ? pagosPlazosActivos.cantidadCuotas : cuotasSeleccionadas;
        
        metadata.pagos_plazos = {
          cantidad_cuotas_total: pagosPlazosActivos.cantidadCuotas,
          cuotas_pagadas: cuotasPagadas,
          cuotas_pendientes: pagosPlazosActivos.cantidadCuotas - cuotasPagadas,
          monto_total: total,
          monto_pagado: montoAPagar,
          monto_pendiente: total - montoAPagar,
          dias_entre_pagos: pagosPlazosActivos.diasEntrePagos
        };
        
        console.log('💰 [PAY] Metadata de pagos a plazos:', metadata.pagos_plazos);
      }

      const paymentData = {
        orderId: locator,
        amount: montoAPagar,
        currency: 'USD',
        items: cartItems,
        locator: locator,
        user: {
          id: user?.id || null,
          email: user?.email || null
        },
        sessionId: seatSessionId,
        tenant: {
          id: resolvedTenantId
        },
        funcion: {
          id: functionId || null
        },
        evento: {
          id: eventoId
        },
        eventoId: eventoId, // También pasar directamente como eventoId
        eventId: eventoId,   // Y como eventId para compatibilidad
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      const result = await processPaymentMethod(selectedGateway, paymentData);
      console.log('🔍 Payment result:', result);
      console.log('🔍 Result success:', result.success);
      console.log('🔍 Result requiresRedirect:', result.requiresRedirect);
      console.log('🔍 Result requiresAction:', result.requiresAction);
      console.log('🔍 Result requiresManualConfirmation:', result.requiresManualConfirmation);

      if (result.success) {
        console.log('✅ Payment successful, redirecting...');
        // Enviar notificación de éxito
        await createPaymentSuccessNotification({
          id: result.transactionId,
          amount: montoAPagar,
          gateway_id: selectedGateway.method_id,
          user_id: user?.id || null,
          tenant_id: resolvedTenantId,
          user: user
            ? {
                ...user,
                phone:
                  user.phone ||
                  user.user_metadata?.phone ||
                  user.user_metadata?.telefono ||
                  null
              }
            : null,
          tenant: resolvedTenantId
            ? { ...(currentTenant || {}), id: resolvedTenantId }
            : currentTenant
        });

        // Limpiar carrito (sin intentar desbloquear asientos ya vendidos)
        clearCart(true);
        
        // Redirigir según el tipo de pago
        if (result.requiresRedirect) {
          window.location.href = result.approvalUrl;
        } else if (result.requiresAction) {
          // Para Stripe, mostrar formulario de tarjeta
          navigate('/store/payment-confirm', { state: { result } });
        } else if (result.requiresManualConfirmation) {
          // Para transferencias, mostrar información
          navigate('/store/payment-manual', { state: { result } });
        } else {
          console.log('🔄 Redirecting to payment success page...');
          navigate('/store/payment-success', { state: { result, locator: result.locator } });
        }
      } else {
        console.log('❌ Payment failed or success is false:', result);
        message.error(result.error || 'Error al procesar el pago. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Usar el hook de manejo de errores
      const errorResult = handleError(error, 'payment', { clearCart });
      
      // Limpiar carrito si es necesario
      if (errorResult.shouldClearCart) {
        clearCart();
      }
    } finally {
      setProcessingPayment(false);
    }
  };


  const getMethodIcon = (methodId) => {
    const icons = {
      stripe: <CreditCardOutlined style={{ color: '#6772e5' }} />,
      paypal: <DollarOutlined style={{ color: '#0070ba' }} />,
      cashea: <CreditCardOutlined style={{ color: '#111827' }} />,
      apple_pay: <CreditCardOutlined style={{ color: '#000000' }} />,
      google_pay: <CreditCardOutlined style={{ color: '#4285f4' }} />,
      transferencia: <BankOutlined style={{ color: '#52c41a' }} />,
      pago_movil: <MobileOutlined style={{ color: '#1890ff' }} />,
      efectivo_tienda: <DollarOutlined style={{ color: '#fa8c16' }} />,
      efectivo: <DollarOutlined style={{ color: '#fa8c16' }} />
    };
    return icons[methodId] || <DollarOutlined />;
  };

  const getMethodName = (methodId) => {
    const names = {
      stripe: 'Stripe',
      paypal: 'PayPal',
      cashea: 'Cashea',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
      transferencia: 'Transferencia Bancaria',
      pago_movil: 'Pago Móvil',
      efectivo_tienda: 'Pago en Efectivo en Tienda',
      efectivo: 'Efectivo'
    };
    return names[methodId] || methodId;
  };

  const getMethodDescription = (methodId) => {
    const descriptions = {
      stripe: 'Tarjetas de crédito y débito',
      paypal: 'Pagos a través de PayPal',
      cashea: 'Compra ahora y paga después con Cashea',
      apple_pay: 'Pagos para usuarios iOS',
      google_pay: 'Pagos para usuarios Android',
      transferencia: 'Transferencias bancarias directas',
      pago_movil: 'Pagos móviles (MercadoPago, etc.)',
      efectivo_tienda: 'Pagos en efectivo en tienda física',
      efectivo: 'Pagos en efectivo'
    };
    return descriptions[methodId] || 'Método de pago';
  };



  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="store-text-center">
          <h2 className="store-text-2xl store-font-bold store-text-gray-900 mb-4">Carrito Vacío</h2>
          <p className="store-text-gray-600 mb-6">No hay productos en tu carrito</p>
          <button onClick={() => navigate('/store')} className="store-button store-button-primary">
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 md:py-8 store-payment-page" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {facebookPixel && (
        <FacebookPixel
          pixelId={facebookPixel}
          eventData={{
            content_name: cartItems.map(item => item.nombreEvento).join(', '),
            content_category: 'Eventos',
            content_ids: cartItems.map(item => item.eventId),
            value: total,
            currency: 'USD',
            num_items: cartItems ? cartItems.length : 0
          }}
        />
      )}
      <div className="store-container">
        <div className="store-container-sm mx-auto">
          <div className="store-card">
            {/* Header */}
            <div className="store-card-header" style={{ background: 'linear-gradient(135deg, var(--store-primary) 0%, var(--store-secondary) 100%)', color: 'white' }}>
              <h1 className="store-text-xl md:store-text-2xl store-font-bold">Finalizar Compra</h1>
              <p className="store-text-xs md:store-text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Selecciona tu método de pago</p>
            </div>

            <div className="store-card-body">
              <div className="store-grid store-grid-auto">
                {/* Métodos de Pago */}
                <div className="store-space-y-4 md:store-space-y-6">
                  <h2 className="store-text-lg md:store-text-xl store-font-semibold">Métodos de Pago</h2>
                  
                  {loadingMethods ? (
                    <div className="store-text-center py-8">
                      <div className="store-loading"></div>
                      <p className="mt-4 store-text-gray-600">Cargando métodos de pago...</p>
                    </div>
                  ) : availableMethods.length === 0 ? (
                    <div className="store-alert store-alert-warning">
                      <div>
                        <h4 className="store-font-semibold">No hay métodos de pago disponibles</h4>
                        <p className="store-text-sm">Por favor, contacta al administrador para configurar los métodos de pago.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="store-space-y-4">
                      {availableMethods.map((method) => {
                        const isSelected = selectedGateway?.method_id === method.method_id;
                        
                        return (
                          <div
                            key={method.method_id}
                            className={`store-payment-method ${isSelected ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect(method)}
                          >
                            <div className="store-payment-method-icon">
                              {getMethodIcon(method.method_id)}
                            </div>
                            <div className="store-payment-method-info">
                              <div className="store-payment-method-name">{getMethodName(method.method_id)}</div>
                              <div className="store-payment-method-description">
                                {getMethodDescription(method.method_id)}
                              </div>
                            </div>
                            <div className="store-text-lg store-font-semibold store-text-primary">
                              ${total.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resumen de Compra */}
                <div className="store-card">
                  <div className="store-card-header">
                    <h3 className="store-text-base md:store-text-lg store-font-semibold">Resumen de Compra</h3>
                  </div>
                  <div className="store-card-body">
                    <div className="store-space-y-3">
                      {/* Información de zona y asientos */}
                      <div className="bg-blue-50 p-2 md:p-3 rounded-lg mb-3 md:mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 store-text-sm md:store-text-base">Asientos Seleccionados</h4>
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between store-text-xs md:store-text-sm mb-1 gap-1">
                            <span className="text-blue-800 break-words">
                              {item.zonaNombre || 'Zona'} - {item.nombreAsiento || `Asiento ${index + 1}`}
                            </span>
                            <span className="font-medium">${item.precio.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:justify-between store-text-xs md:store-text-sm gap-1">
                          <span className="break-words">{item.nombreEvento}</span>
                          <span>${item.precio.toFixed(2)}</span>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 pt-3"></div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center store-text-base md:store-text-lg store-font-bold gap-2">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>

                      {/* Opciones de Pagos a Plazos - Componente Mejorado */}
                      {pagosPlazosActivos?.activo && cuotasCalculadas.length > 0 && (
                        <InstallmentPaymentSelector
                          total={total}
                          cantidadCuotas={pagosPlazosActivos.cantidadCuotas}
                          diasEntrePagos={pagosPlazosActivos.diasEntrePagos}
                          cuotasCalculadas={cuotasCalculadas}
                          cuotasSeleccionadas={cuotasSeleccionadas}
                          onCuotasChange={setCuotasSeleccionadas}
                          fechaInicio={pagosPlazosActivos.fechaInicio}
                          fechaFin={pagosPlazosActivos.fechaFin}
                          disabled={processingPayment}
                        />
                      )}
                      {/* Código anterior comentado para referencia
                      {pagosPlazosActivos?.activo && cuotasCalculadas.length > 0 && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="store-text-sm md:store-text-base store-font-semibold mb-3">Pago a Plazos Disponible</h4>
                          <div className="space-y-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="store-text-xs md:store-text-sm text-blue-800 mb-2">
                                Puedes pagar en {pagosPlazosActivos.cantidadCuotas} cuotas de ${(total / pagosPlazosActivos.cantidadCuotas).toFixed(2)} cada una
                              </p>
                              <div className="space-y-2">
                                <label className="block store-text-xs md:store-text-sm font-medium text-gray-700">
                                  ¿Cuántas cuotas deseas pagar ahora?
                                </label>
                                <select
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 store-text-sm"
                                  value={cuotasSeleccionadas}
                                  onChange={(e) => setCuotasSeleccionadas(parseInt(e.target.value))}
                                >
                                  <option value={0}>Todas las cuotas ({pagosPlazosActivos.cantidadCuotas})</option>
                                  {cuotasCalculadas.slice(0, 3).map((cuota, index) => (
                                    <option key={index + 1} value={index + 1}>
                                      {index + 1} cuota{index + 1 > 1 ? 's' : ''} - ${cuotasCalculadas.slice(0, index + 1).reduce((sum, c) => sum + c.monto, 0).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {cuotasSeleccionadas > 0 && (
                                <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                                  <p className="store-text-xs md:store-text-sm text-gray-700">
                                    <strong>Monto a pagar ahora:</strong> ${cuotasCalculadas.slice(0, cuotasSeleccionadas).reduce((sum, c) => sum + c.monto, 0).toFixed(2)}
                                  </p>
                                  <p className="store-text-xs text-gray-500 mt-1">
                                    Quedarán {pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas} cuota{pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas !== 1 ? 's' : ''} pendiente{pagosPlazosActivos.cantidadCuotas - cuotasSeleccionadas !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedGateway && pricesWithFees[selectedGateway.id]?.hasFees && (
                        <>
                          <div className="flex justify-between store-text-sm store-text-gray-600">
                            <span>Comisión ({selectedGateway.name})</span>
                            <span>+${pricesWithFees[selectedGateway.id].comision.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center store-text-lg store-font-bold store-text-primary">
                            <span>Total Final</span>
                            <span>${pricesWithFees[selectedGateway.id].precioTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      {/* Botones de Acción */}
                      <div className="space-y-3">
                        {/* Botón Principal - Procesar Pago */}
                        <button
                          className="store-button store-button-primary store-button-lg store-button-block"
                          disabled={!selectedGateway || processingPayment}
                          onClick={handleProcessPayment}
                        >
                          {processingPayment ? (
                            <>
                              <div className="store-loading"></div>
                              Procesando...
                            </>
                          ) : (
                            'Procesar Pago'
                          )}
                        </button>

                        {/* Botón Secundario - Guardar en Carrito */}
                        <button
                          className="store-button store-button-default store-button-lg store-button-block"
                          disabled={processingPayment}
                          onClick={() => navigate('/store/cart')}
                        >
                          Guardar en Carrito para Pagar Después
                        </button>
                      </div>

                      {selectedGateway && (
                        <div className="store-text-xs store-text-gray-500 store-text-center mt-2">
                          Pagando con {getMethodName(selectedGateway.method_id)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Pay;
