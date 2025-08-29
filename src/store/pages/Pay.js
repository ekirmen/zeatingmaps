import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Card, Button, Space, Alert, Spin, Divider, message } from 'antd';
import { CreditCardOutlined, BankOutlined, MobileOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useCartStore } from '../cartStore';
import { getActivePaymentGateways, validateGatewayConfig, calculatePriceWithFees } from '../services/paymentGatewaysService';
import { processPayment } from '../services/paymentProcessors';
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
  const [availableGateways, setAvailableGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [facebookPixel, setFacebookPixel] = useState(null);
  const [pricesWithFees, setPricesWithFees] = useState({});

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
        
        // Calcular precios con comisiones para cada pasarela
        const feesPromises = validGateways.map(async (gateway) => {
          const priceWithFees = await calculatePriceWithFees(total, gateway.id);
          return { gatewayId: gateway.id, ...priceWithFees };
        });
        
        const feesResults = await Promise.all(feesPromises);
        const feesMap = {};
        feesResults.forEach(result => {
          feesMap[result.gatewayId] = result;
        });
        setPricesWithFees(feesMap);
      } catch (error) {
        console.error('Error loading payment gateways:', error);
        message.error('Error al cargar métodos de pago');
      } finally {
        setLoadingGateways(false);
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

  const handlePaymentMethodSelect = (gateway) => {
    setSelectedGateway(gateway);
  };

  const handleProcessPayment = async () => {
    if (!selectedGateway) {
      message.error('Por favor selecciona un método de pago');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Obtener precio con comisiones
      const priceWithFees = pricesWithFees[selectedGateway.id];
      const finalAmount = priceWithFees ? priceWithFees.precioTotal : total;
      
      const paymentData = {
        orderId: `ORDER-${Date.now()}`,
        amount: finalAmount,
        currency: 'USD',
        items: cartItems,
        user: {
          id: 'user-id', // Obtener del contexto de autenticación
          email: 'user@example.com'
        },
        gatewayFees: priceWithFees
      };

      const result = await processPayment(selectedGateway, paymentData);
      setPaymentResult(result);

      if (result.success) {
        // Enviar notificación de éxito
        await createPaymentSuccessNotification({
          id: result.transactionId,
          amount: finalAmount,
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
          navigate('/payment/success', { state: { result } });
        }
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

      const result = await processPayment(selectedGateway, reservationData);
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
                    {availableGateways.map((gateway) => {
                      const priceInfo = getPriceWithFees(gateway);
                      const isSelected = selectedGateway?.id === gateway.id;
                      
                      return (
                        <Card
                          key={gateway.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
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
                                {priceInfo.hasFees && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Comisión: ${priceInfo.fees.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ${priceInfo.finalPrice.toFixed(2)}
                              </div>
                              {priceInfo.hasFees && (
                                <div className="text-xs text-gray-500 line-through">
                                  ${priceInfo.originalPrice.toFixed(2)}
                                </div>
                              )}
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
