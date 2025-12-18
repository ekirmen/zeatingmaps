import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Alert,
  Space,
  Typography,
  Divider,
  Row,
  Col
} from '../../../utils/antdComponents';
import {
  FacebookOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { upsertFacebookPixel, getFacebookPixelByEvent } from '../../../store/services/facebookPixelService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FacebookPixelConfig = ({ eventoData, setEventoData, handleChange }) => {
  const [facebookPixel, setFacebookPixel] = useState({
    pixel_id: '',
    pixel_script: '',
    is_active: false,
    tracking_pages: {
      event_page: true,
      cart_page: true,
      payment_page: true,
      thank_you_page: true
    }
  });
  const [loading, setLoading] = useState(false);

  const loadFacebookPixel = async () => {
    try {
      setLoading(true);
      const pixel = await getFacebookPixelByEvent(eventoData.id);
      if (pixel) {
        setFacebookPixel({
          pixel_id: pixel.pixel_id || '',
          pixel_script: pixel.pixel_script || '',
          is_active: pixel.is_active || false,
          tracking_pages: pixel.tracking_pages || {
            event_page: true,
            cart_page: true,
            payment_page: true,
            thank_you_page: true
          }
        });
      }
    } catch (error) {
      console.error('Error loading Facebook pixel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventoData?.id) {
      loadFacebookPixel();
    }
  }, [eventoData?.id]);

  const handleSavePixel = async () => {
    try {
      setLoading(true);

      if (facebookPixel.pixel_id || facebookPixel.pixel_script) {
        await upsertFacebookPixel({
          evento: eventoData.id,
          pixel_id: facebookPixel.pixel_id,
          pixel_script: facebookPixel.pixel_script,
          is_active: facebookPixel.is_active,
          tracking_pages: facebookPixel.tracking_pages
        });

        // Mostrar mensaje de ©xito
        alert('P­xel de Facebook guardado correctamente');
      }
    } catch (error) {
      console.error('Error saving Facebook pixel:', error);
      alert('Error al guardar el p­xel de Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="facebook-pixel-config">
      <Card
        title={
          <Space>
            <FacebookOutlined />
            <span>Configuraci³n del P­xel de Facebook</span>
          </Space>
        }
        className="mb-4"
      >
        <Alert
          message="Informaci³n del P­xel de Facebook"
          description="Configura el p­xel de Facebook para trackear conversiones espec­ficas de este evento. Esto te permitir¡ medir el ROI de tus campa±as publicitarias."
          type="info"
          showIcon
          className="mb-4"
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ID del P­xel de Facebook"
              help="Ejemplo: 123456789012345"
            >
              <Input
                placeholder="Ingresa el ID de tu p­xel de Facebook"
                value={facebookPixel.pixel_id}
                onChange={(e) => setFacebookPixel(prev => ({
                  ...prev,
                  pixel_id: e.target.value
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="P­xel Activo"
              help="Activa o desactiva el tracking del p­xel"
            >
              <Switch
                checked={facebookPixel.is_active}
                onChange={(checked) => setFacebookPixel(prev => ({
                  ...prev,
                  is_active: checked
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Script Personalizado (Opcional)"
          help="Si tienes un script personalizado de Facebook, puedes agregarlo aqu­"
        >
          <TextArea
            rows={8}
            placeholder={`<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'TU_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript>
<img height='1' width='1' style='display:none'
src='https://www.facebook.com/tr?id=TU_PIXEL_ID&ev=PageView&noscript=1'/>
</noscript>
<!-- End Facebook Pixel Code -->`}
            value={facebookPixel.pixel_script}
            onChange={(e) => setFacebookPixel(prev => ({
              ...prev,
              pixel_script: e.target.value
            }))}
          />
        </Form.Item>

        <Divider />

        <Title level={5}>P¡ginas de Tracking</Title>
        <Text type="secondary" className="mb-4 block">
          Selecciona en qu© p¡ginas quieres que se active el p­xel de Facebook
        </Text>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="tracking-page-item">
              <div className="tracking-page-header">
                <Switch
                  checked={facebookPixel.tracking_pages.event_page}
                  onChange={(checked) => setFacebookPixel(prev => ({
                    ...prev,
                    tracking_pages: {
                      ...prev.tracking_pages,
                      event_page: checked
                    }
                  }))}
                />
                <Space className="ml-2">
                  <EyeOutlined />
                  <Text strong>P¡gina del Evento</Text>
                </Space>
              </div>
              <Text type="secondary" className="ml-6">
                Trackea cuando los usuarios ven el contenido del evento
              </Text>
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div className="tracking-page-item">
              <div className="tracking-page-header">
                <Switch
                  checked={facebookPixel.tracking_pages.cart_page}
                  onChange={(checked) => setFacebookPixel(prev => ({
                    ...prev,
                    tracking_pages: {
                      ...prev.tracking_pages,
                      cart_page: checked
                    }
                  }))}
                />
                <Space className="ml-2">
                  <ShoppingCartOutlined />
                  <Text strong>P¡gina del Carrito</Text>
                </Space>
              </div>
              <Text type="secondary" className="ml-6">
                Trackea cuando los usuarios agregan tickets al carrito
              </Text>
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div className="tracking-page-item">
              <div className="tracking-page-header">
                <Switch
                  checked={facebookPixel.tracking_pages.payment_page}
                  onChange={(checked) => setFacebookPixel(prev => ({
                    ...prev,
                    tracking_pages: {
                      ...prev.tracking_pages,
                      payment_page: checked
                    }
                  }))}
                />
                <Space className="ml-2">
                  <CreditCardOutlined />
                  <Text strong>P¡gina de Pago</Text>
                </Space>
              </div>
              <Text type="secondary" className="ml-6">
                Trackea cuando los usuarios inician el proceso de pago
              </Text>
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div className="tracking-page-item">
              <div className="tracking-page-header">
                <Switch
                  checked={facebookPixel.tracking_pages.thank_you_page}
                  onChange={(checked) => setFacebookPixel(prev => ({
                    ...prev,
                    tracking_pages: {
                      ...prev.tracking_pages,
                      thank_you_page: checked
                    }
                  }))}
                />
                <Space className="ml-2">
                  <CheckCircleOutlined />
                  <Text strong>P¡gina de Gracias</Text>
                </Space>
              </div>
              <Text type="secondary" className="ml-6">
                Trackea cuando se completa una compra exitosa
              </Text>
            </div>
          </Col>
        </Row>

        <Alert
          message="Informaci³n Importante"
          description="El p­xel de Facebook se cargar¡ autom¡ticamente en las p¡ginas seleccionadas. Asegºrate de cumplir con las pol­ticas de privacidad de Facebook y obtener el consentimiento de los usuarios."
          type="warning"
          showIcon
          className="mt-4"
        />

        <div className="mt-4">
          <Button
            type="primary"
            onClick={handleSavePixel}
            loading={loading}
            icon={<FacebookOutlined />}
          >
            Guardar Configuraci³n del P­xel
          </Button>
        </div>
      </Card>

      <style jsx>{`
        .tracking-page-item {
          padding: 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        
        .tracking-page-header {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

export default FacebookPixelConfig;

