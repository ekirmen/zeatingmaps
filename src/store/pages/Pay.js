import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Card, Button, Space, Alert, Spin, Divider } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentGateways, validateGatewayConfig } from '../services/paymentGatewaysService';
import { processPayment } from '../services/paymentProcessors';
import { createPaymentSuccessNotification, createPaymentFailureNotification } from '../services/paymentNotifications';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, shouldTrackOnPage, FACEBOOK_EVENTS } from '../services/facebookPixelService';

const Pay = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, total } = useCartStore();
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [availableGateways, setAvailableGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [facebookPixel, setFacebookPixel] = useState(null);

  useEffect(() => {
    const loadGateways = async () => {
      try {
        setLoadingGateways(true);
        const gateways = await getActivePaymentGateways();
        const validGateways = gateways.filter(gateway => {
          const validation = validateGatewayConfig(gateway);
          return validation.valid;
        });
        setAvailableGateways(validGateways);
      } catch (error) {
        console.error('Error loading payment gateways:', error);
        toast.error('Error al cargar métodos de pago');
      } finally {
        setLoadingGateways(false);
      }
    };
    loadGateways();
    loadFacebookPixel();
  }, [cartItems]);

  const loadFacebookPixel = async () => {
    try {
      if (cartItems.length > 0) {
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

  const handlePaymentMethodSelect = (gateway) => {
    setSelectedGateway(gateway);
  };

  const handleProcessPayment = async () => {
    if (!selectedGateway) {
      toast.error('Por favor selecciona un método de pago');
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

      const result = await processPayment(selectedGateway, paymentData);
      setPaymentResult(result);

      if (result.success) {
        // Enviar notificación de éxito
        await createPaymentSuccessNotification({
          id: result.transactionId,
          amount: total,
          payment_gateways: { name: selectedGateway.name }
        });

        // Limpiar carrito
        clearCart();
        
        // Redirigir según el tipo de pago
        if (result.requiresRedirect) {
          window.location.href = result.approvalUrl;
        } else if (result.requiresAction) {
          // Para Stripe, mostrar formulario de tarjeta
          navigate('/payment/confirm', { state: { result } });
        } else if (result.requiresManualConfirmation) {
          // Para transferencias, mostrar información
          navigate('/payment/manual', { state: { result } });
        } else {
                           // Pago completado
                 navigate('/thank-you', { 
                   state: { 
                     purchaseData: {
                       eventId: cartItems[0]?.eventId,
                       eventName: cartItems[0]?.nombreEvento,
                       amount: total,
                       ticketCount: cartItems.length,
                       transactionId: result.transactionId
                     }
                   } 
                 });
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Enviar notificación de fallo
      await createPaymentFailureNotification({
        id: 'temp-id',
        amount: total,
        payment_gateways: { name: selectedGateway.name }
      });

      toast.error('Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleProcessReservation = async () => {
    if (!selectedGateway) {
      toast.error('Por favor selecciona un método de pago');
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

      const result = await processPayment(selectedGateway, reservationData);
      setPaymentResult(result);

      if (result.success) {
        clearCart();
        navigate('/reservation/success', { state: { result } });
      }
    } catch (error) {
      console.error('Error processing reservation:', error);
      toast.error('Error al procesar la reserva');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getGatewayIcon = (type) => {
    const icons = {
      stripe: <CreditCardOutlined style={{ color: '#6772e5' }} />,
      paypal: <DollarOutlined style={{ color: '#0070ba' }} />,
      transfer: <BankOutlined style={{ color: '#52c41a' }} />,
      mobile_payment: <MobileOutlined style={{ color: '#1890ff' }} />,
      zelle: <DollarOutlined style={{ color: '#6f42c1' }} />,
      reservation: <ClockCircleOutlined style={{ color: '#fa8c16' }} />
    };
    return icons[type] || <DollarOutlined />;
  };

  const getGatewayDescription = (type) => {
    const descriptions = {
      stripe: 'Pago seguro con tarjeta de crédito o débito',
      paypal: 'Pago rápido y seguro con PayPal',
      transfer: 'Transferencia bancaria directa',
      mobile_payment: 'Pago móvil (MercadoPago, etc.)',
      zelle: 'Transferencia Zelle instantánea',
      reservation: 'Reserva sin pago inmediato'
    };
    return descriptions[type] || '';
  };

  if (cartItems.length === 0) {
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
      {/* Píxel de Facebook para InitiateCheckout */}
      {facebookPixel && shouldTrackOnPage(facebookPixel, 'payment_page') && (
        <FacebookPixel
          pixelId={facebookPixel.pixel_id}
          pixelScript={facebookPixel.pixel_script}
          eventName={FACEBOOK_EVENTS.INITIATE_CHECKOUT}
          eventData={{
            content_name: cartItems.map(item => item.nombreEvento).join(', '),
            content_category: 'Eventos',
            content_ids: cartItems.map(item => item.eventId),
            value: total,
            currency: 'USD',
            num_items: cartItems.length
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
                
                {loadingGateways ? (
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Cargando métodos de pago...</p>
                  </div>
                ) : availableGateways.length === 0 ? (
                  <Alert
                    message="No hay métodos de pago disponibles"
                    description="Por favor, contacta al administrador para configurar los métodos de pago."
                    type="warning"
                    showIcon
                  />
                ) : (
                  <div className="space-y-4">
                    {availableGateways.map((gateway) => (
                      <Card
                        key={gateway.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedGateway?.id === gateway.id
                            ? 'ring-2 ring-blue-500 border-blue-500'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handlePaymentMethodSelect(gateway)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">
                              {getGatewayIcon(gateway.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{gateway.name}</h3>
                              <p className="text-gray-600 text-sm">
                                {getGatewayDescription(gateway.type)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Seleccionado</div>
                            <div className="text-lg font-bold text-green-600">
                              {selectedGateway?.id === gateway.id ? '✓' : ''}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen del Carrito */}
              <div className="lg:col-span-1">
                <Card title="Resumen de Compra" className="sticky top-4">
                  <div className="space-y-4">
                    {/* Items del carrito */}
                    <div>
                      <h4 className="font-semibold mb-2">Productos</h4>
                      <div className="space-y-2">
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.nombreZona} - {item.nombreAsiento}</span>
                            <span>${item.precio}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Divider />

                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {/* Botón de Pago */}
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={processingPayment}
                      disabled={!selectedGateway || processingPayment}
                      onClick={
                        selectedGateway?.type === 'reservation' 
                          ? handleProcessReservation 
                          : handleProcessPayment
                      }
                    >
                      {processingPayment ? 'Procesando...' : 
                       selectedGateway?.type === 'reservation' 
                         ? 'Hacer Reserva' 
                         : 'Procesar Pago'}
                    </Button>

                    {selectedGateway && (
                      <div className="text-xs text-gray-500 text-center">
                        Pagando con {selectedGateway.name}
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
