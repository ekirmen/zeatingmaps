import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Divider,
  Alert
} from 'antd';
import { CheckCircleOutlined, HomeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import FacebookPixel from '../components/FacebookPixel';
import { getFacebookPixelByEvent, shouldTrackOnPage, FACEBOOK_EVENTS } from '../services/facebookPixelService';

const { Title, Text } = Typography;

const ThankYouPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [facebookPixel, setFacebookPixel] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);

  const getSafeAmount = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const loadFacebookPixel = async (purchaseData) => {
    try {
      if (purchaseData?.eventId) {
        const pixel = await getFacebookPixelByEvent(purchaseData.eventId);
        setFacebookPixel(pixel);
      }
    } catch (error) {
      console.error('Error loading Facebook pixel:', error);
    }
  };

  useEffect(() => {
    // Obtener datos de la compra desde el estado de navegación
    if (location.state?.purchaseData) {
      setPurchaseData(location.state.purchaseData);
      loadFacebookPixel(location.state.purchaseData);
    }
  }, [location.state]);

  const handleContinueShopping = () => {
    navigate('/store');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      {/* Píxel de Facebook para Purchase */}
      {facebookPixel && shouldTrackOnPage(facebookPixel, 'thank_you_page') && purchaseData && (
        <FacebookPixel
          pixelId={facebookPixel.pixel_id}
          pixelScript={facebookPixel.pixel_script}
          eventName={FACEBOOK_EVENTS.PURCHASE}
          eventData={{
            content_name: purchaseData.eventName,
            content_category: 'Evento',
            content_ids: [purchaseData.eventId],
            value: getSafeAmount(purchaseData.amount),
            currency: 'USD',
            num_items: purchaseData.ticketCount,
            transaction_id: purchaseData.transactionId
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <div className="mb-6">
            <CheckCircleOutlined 
              style={{ fontSize: '64px', color: '#52c41a' }} 
              className="mb-4"
            />
            <Title level={2} className="text-green-600">
              ¡Gracias por tu Compra!
            </Title>
            <Text type="secondary" className="text-lg">
              Tu transacción ha sido procesada exitosamente
            </Text>
          </div>

          <Divider />

          {purchaseData && (
            <div className="mb-6 text-left">
              <Title level={4}>Detalles de la Compra</Title>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text strong>Evento:</Text>
                  <Text>{purchaseData.eventName}</Text>
                </div>
                <div className="flex justify-between">
                  <Text strong>Número de Tickets:</Text>
                  <Text>{purchaseData.ticketCount}</Text>
                </div>
                <div className="flex justify-between">
                  <Text strong>Total:</Text>
                  <Text strong className="text-green-600">
                    ${getSafeAmount(purchaseData.amount).toFixed(2)}
                  </Text>
                </div>
                {purchaseData.transactionId && (
                  <div className="flex justify-between">
                    <Text strong>ID de Transacción:</Text>
                    <Text code>{purchaseData.transactionId}</Text>
                  </div>
                )}
              </div>
            </div>
          )}

          <Alert
            message="Confirmación Enviada"
            description="Hemos enviado un email de confirmación con los detalles de tu compra. Revisa tu bandeja de entrada."
            type="success"
            showIcon
            className="mb-6"
          />

          <Space size="large">
            <Button 
              type="primary" 
              size="large"
                              icon={<ShoppingCartOutlined />}
              onClick={handleContinueShopping}
            >
              Continuar Comprando
            </Button>
            <Button 
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            >
              Ir al Inicio
            </Button>
          </Space>

          <Divider />

          <div className="text-sm text-gray-500">
            <Text type="secondary">
              Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ThankYouPage;