import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentMethods, validatePaymentMethodConfig } from '../services/paymentMethodsService';
import { processPaymentMethod } from '../services/paymentMethodsProcessor';
import { createPaymentSuccessNotification } from '../services/paymentNotifications';
import atomicSeatLockService from '../services/atomicSeatLock';
import { useErrorHandler } from '../hooks/useErrorHandler';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent } from '../services/facebookPixelService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import LoginModal from '../components/LoginModal';


const Pay = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  // useCartStore almacena los asientos seleccionados en la propiedad `items`
  // En algunos contextos `cart` no existe y producía `undefined`, generando
  // errores al intentar usar `reduce`. Se usa `items` y se asegura un arreglo.
  const { items: cartItems, clearCart, functionId } = useCartStore();
  const { handleError, showSuccess } = useErrorHandler();
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
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  useEffect(() => {
    const loadGateways = async () => {
      try {
        setLoadingMethods(true);
        const methods = await getActivePaymentMethods();
        const validMethods = methods.filter(method => {
          const validation = validatePaymentMethodConfig(method);
          return validation.valid;
        });
        setAvailableMethods(validMethods);
        
        // Por ahora, no calculamos comisiones específicas
        // Esto se puede implementar más tarde usando la tabla comisiones_tasas
      } catch (error) {
        console.error('Error loading payment gateways:', error);
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
        console.error('Error loading Facebook pixel:', error);
      }
    };

    // Only load data if user is authenticated
    if (user) {
      loadGateways();
      loadFacebookPixel();
    }
  }, [cartItems, total, user]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedGateway(method);
  };

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setShowLoginModal(false);
    // The component will automatically reload payment methods after user state changes
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
          // Verificar disponibilidad usando el servicio atómico
          const isAvailable = await atomicSeatLockService.isSeatAvailable(seatId, funcionId);
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

      const paymentData = {
        orderId: locator,
        amount: total,
        currency: 'USD',
        items: cartItems,
        locator: locator,
        user: {
          id: user?.id || null,
          email: user?.email || null
        },
        sessionId: seatSessionId,
        tenant: {
          id: currentTenant?.id || null
        },
        funcion: {
          id: functionId || null
        },
        evento: {
          id: cartItems[0]?.eventId || null
        }
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
          amount: total,
          gateway_id: selectedGateway.method_id,
          user_id: user?.id || null,
          tenant_id: currentTenant?.id || null,
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
          tenant: currentTenant ? { ...currentTenant } : null
        });

        // Limpiar carrito
        clearCart();
        
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
    <div className="min-h-screen py-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
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
              <h1 className="store-text-2xl store-font-bold">Finalizar Compra</h1>
              <p className="store-text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Selecciona tu método de pago</p>
            </div>

            <div className="store-card-body">
              <div className="store-grid store-grid-auto">
                {/* Métodos de Pago */}
                <div className="store-space-y-6">
                  <h2 className="store-text-xl store-font-semibold">Métodos de Pago</h2>
                  
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
                    <h3 className="store-text-lg store-font-semibold">Resumen de Compra</h3>
                  </div>
                  <div className="store-card-body">
                    <div className="store-space-y-3">
                      {/* Información de zona y asientos */}
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Asientos Seleccionados</h4>
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex justify-between store-text-sm mb-1">
                            <span className="text-blue-800">
                              {item.zonaNombre || 'Zona'} - {item.nombreAsiento || `Asiento ${index + 1}`}
                            </span>
                            <span className="font-medium">${item.precio.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between store-text-sm">
                          <span>{item.nombreEvento}</span>
                          <span>${item.precio.toFixed(2)}</span>
                        </div>
                      ))}

                      <div className="border-t border-gray-200 pt-3"></div>

                      <div className="flex justify-between items-center store-text-lg store-font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>

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

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          // If user closes modal without logging in, redirect to cart
          navigate('/store/cart');
        }}
        onLoginSuccess={handleLoginSuccess}
        title="Iniciar Sesión para Pagar"
      />
    </div>
  );
};

export default Pay;
