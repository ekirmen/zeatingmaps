import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Card, Button, Space, Alert, Spin, Divider, message } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentMethods, validatePaymentMethodConfig } from '../services/paymentMethodsService';
import { processPaymentMethod } from '../services/paymentMethodsProcessor';
import { createPaymentSuccessNotification } from '../services/paymentNotifications';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent } from '../services/facebookPixelService';


const Pay = () => {
  const navigate = useNavigate();
  // useCartStore almacena los asientos seleccionados en la propiedad `items`
  // En algunos contextos `cart` no existe y producía `undefined`, generando
  // errores al intentar usar `reduce`. Se usa `items` y se asegura un arreglo.
  const { items: cartItems, clearCart } = useCartStore();
  const total = (cartItems || []).reduce(
    (sum, item) => sum + (item.precio || 0),
    0
  );
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [facebookPixel, setFacebookPixel] = useState(null);
  const [pricesWithFees, setPricesWithFees] = useState({});

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

    loadGateways();
    loadFacebookPixel();
  }, [cartItems, total]);

  const handlePaymentMethodSelect = (method) => {
    setSelectedGateway(method);
  };

  const handleProcessPayment = async () => {
    if (!selectedGateway) {
      message.error('Por favor selecciona un método de pago');
      return;
    }

    try {
      setProcessingPayment(true);
      
      const paymentData = {
        orderId: `ORDER-${Date.now()}`,
        amount: total,
        currency: 'USD',
        items: cartItems,
        user: {
          id: 'user-id', // Obtener del contexto de autenticación
          email: 'user@example.com'
        }
      };

      const result = await processPaymentMethod(selectedGateway, paymentData);
      console.log('🔍 Payment result:', result);
      setPaymentResult(result);

      if (result.success) {
        console.log('✅ Payment successful, redirecting...');
        // Enviar notificación de éxito
        await createPaymentSuccessNotification({
          id: result.transactionId,
          amount: total,
          gateway_id: selectedGateway.method_id
        });

        // Limpiar carrito
        clearCart();
        
        // Redirigir según el tipo de pago
        if (result.requiresRedirect) {
          window.location.href = result.approvalUrl;
        } else if (result.requiresAction) {
          // Para Stripe, mostrar formulario de tarjeta
          navigate('/payment-confirm', { state: { result } });
        } else if (result.requiresManualConfirmation) {
          // Para transferencias, mostrar información
          navigate('/payment-manual', { state: { result } });
        } else {
          console.log('🔄 Redirecting to payment success page...');
          navigate('/payment-success', { state: { result, locator: result.locator } });
        }
      } else {
        console.log('❌ Payment failed or success is false:', result);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleProcessReservation = async () => {
    if (!selectedGateway) {
      message.error('Por favor selecciona un método de pago');
      return;
    }

    try {
      setProcessingPayment(true);
      
      const reservationData = {
        orderId: `RESERVATION-${Date.now()}`,
        amount: total,
        currency: 'USD',
        items: cartItems,
        type: 'reservation'
      };

      const result = await processPaymentMethod(selectedGateway, reservationData);
      setPaymentResult(result);

      if (result.success) {
        clearCart();
        navigate('/reservation/success', { state: { result } });
      }
    } catch (error) {
      console.error('Error processing reservation:', error);
      message.error('Error al procesar la reserva');
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


  const getPriceWithFees = (gateway) => {
    const priceWithFees = pricesWithFees[gateway.id];
    if (!priceWithFees) return total;
    
    return {
      originalPrice: priceWithFees.precioBase,
      fees: priceWithFees.comision,
      finalPrice: priceWithFees.precioTotal,
      hasFees: priceWithFees.comision > 0
    };
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrito Vacío</h2>
          <p className="text-gray-600 mb-6">No hay productos en tu carrito</p>
          <Button type="primary" onClick={() => navigate('/store')}>
            Continuar Comprando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">Finalizar Compra</h1>
            <p className="text-blue-100">Selecciona tu método de pago</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Métodos de Pago */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Métodos de Pago</h2>
                
                {loadingMethods ? (
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Cargando métodos de pago...</p>
                  </div>
                ) : availableMethods.length === 0 ? (
                  <Alert
                    message="No hay métodos de pago disponibles"
                    description="Por favor, contacta al administrador para configurar los métodos de pago."
                    type="warning"
                    showIcon
                  />
                ) : (
                  <div className="space-y-4">
                    {availableMethods.map((method) => {
                      const isSelected = selectedGateway?.method_id === method.method_id;
                      
                      return (
                        <Card
                          key={method.method_id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'ring-2 ring-blue-500 border-blue-500'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => handlePaymentMethodSelect(method)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">
                                {getMethodIcon(method.method_id)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{getMethodName(method.method_id)}</h3>
                                <p className="text-gray-600 text-sm">
                                  {getMethodDescription(method.method_id)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${total.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resumen de Compra */}
              <div className="lg:col-span-1">
                <Card title="Resumen de Compra" className="sticky top-4">
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.nombreEvento}</span>
                        <span>${item.precio.toFixed(2)}</span>
                      </div>
                    ))}

                    <Divider />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {selectedGateway && pricesWithFees[selectedGateway.id]?.hasFees && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Comisión ({selectedGateway.name})</span>
                          <span>+${pricesWithFees[selectedGateway.id].comision.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-blue-600">
                          <span>Total Final</span>
                          <span>${pricesWithFees[selectedGateway.id].precioTotal.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {/* Botón de Pago */}
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={processingPayment}
                      disabled={!selectedGateway || processingPayment}
                      onClick={handleProcessPayment}
                    >
                      {processingPayment ? 'Procesando...' : 'Procesar Pago'}
                    </Button>

                    {selectedGateway && (
                      <div className="text-xs text-gray-500 text-center">
                        Pagando con {getMethodName(selectedGateway.method_id)}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pay;
