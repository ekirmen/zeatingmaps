/**
 * Componente de Onboarding interactivo para nuevos usuarios
 * Guía paso a paso para aprender a seleccionar asientos
 */
import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Card, Typography, Space, Tag } from '../utils/antdComponents';
import {
  UserOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

const ONBOARDING_STORAGE_KEY = 'seat_map_onboarding_completed';

const SeatMapOnboarding = ({
  visible,
  onComplete,
  onSkip,
  stageRef,
  onHighlightElement
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);

  // Pasos del onboarding
  const steps = [
    {
      title: t('onboarding.welcome.title', 'Bienvenido'),
      description: t('onboarding.welcome.description', 'Aprende a seleccionar tus asientos favoritos'),
      content: (
        <div>
          <Title level={4}>{t('onboarding.welcome.heading', '¡Bienvenido al Selector de Asientos!')}</Title>
          <Paragraph>
            {t('onboarding.welcome.text',
              'Esta guía rápida te ayudará a entender cómo funciona nuestro sistema de selección de asientos. ' +
              'Te mostraremos las funcionalidades principales en solo unos pasos.'
            )}
          </Paragraph>
          <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
            <Card size="small">
              <Space>
                <EyeOutlined style={{ color: '#1890ff' }} />
                <Text>{t('onboarding.welcome.feature1', 'Ver disponibilidad en tiempo real')}</Text>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <UserOutlined style={{ color: '#52c41a' }} />
                <Text>{t('onboarding.welcome.feature2', 'Seleccionar múltiples asientos')}</Text>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <ShoppingCartOutlined style={{ color: '#faad14' }} />
                <Text>{t('onboarding.welcome.feature3', 'Ver precio y resumen en el carrito')}</Text>
              </Space>
            </Card>
          </Space>
        </div>
      ),
      highlightSelector: null
    },
    {
      title: t('onboarding.seats.title', 'Selección de Asientos'),
      description: t('onboarding.seats.description', 'Haz clic en un asiento para seleccionarlo'),
      content: (
        <div>
          <Title level={4}>{t('onboarding.seats.heading', 'Cómo Seleccionar Asientos')}</Title>
          <Paragraph>
            {t('onboarding.seats.text',
              'Los asientos disponibles se muestran en verde. Haz clic en cualquier asiento disponible para seleccionarlo. ' +
              'Los asientos seleccionados aparecerán en amarillo.'
            )}
          </Paragraph>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 16 }}>
            <div>
              <Tag color="green">{t('onboarding.seats.available', 'Disponible')}</Tag>
              <Text> - {t('onboarding.seats.available_desc', 'Asiento libre que puedes seleccionar')}</Text>
            </div>
            <div>
              <Tag color="gold">{t('onboarding.seats.selected', 'Seleccionado')}</Tag>
              <Text> - {t('onboarding.seats.selected_desc', 'Asiento que has seleccionado')}</Text>
            </div>
            <div>
              <Tag color="blue">{t('onboarding.seats.occupied', 'Ocupado')}</Tag>
              <Text> - {t('onboarding.seats.occupied_desc', 'Asiento seleccionado por otro usuario')}</Text>
            </div>
            <div>
              <Tag color="red">{t('onboarding.seats.sold', 'Vendido')}</Tag>
              <Text> - {t('onboarding.seats.sold_desc', 'Asiento ya comprado')}</Text>
            </div>
          </Space>
        </div>
      ),
      highlightSelector: '.seating-map-stage'
    },
    {
      title: t('onboarding.cart.title', 'Carrito de Compra'),
      description: t('onboarding.cart.description', 'Revisa tus asientos seleccionados'),
      content: (
        <div>
          <Title level={4}>{t('onboarding.cart.heading', 'Carrito de Compra')}</Title>
          <Paragraph>
            {t('onboarding.cart.text',
              'Todos los asientos que selecciones aparecerán en tu carrito. Puedes ver el precio total ' +
              'y eliminar asientos antes de proceder al pago.'
            )}
          </Paragraph>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 16 }}>
            <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
              <Space>
                <ShoppingCartOutlined />
                <Text strong>{t('onboarding.cart.feature1', 'Ver resumen de compra')}</Text>
              </Space>
            </Card>
            <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
              <Space>
                <InfoCircleOutlined />
                <Text strong>{t('onboarding.cart.feature2', 'Precio total visible')}</Text>
              </Space>
            </Card>
            <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
              <Space>
                <CloseOutlined />
                <Text strong>{t('onboarding.cart.feature3', 'Eliminar asientos del carrito')}</Text>
              </Space>
            </Card>
          </Space>
        </div>
      ),
      highlightSelector: '.cart-container, .cart-sidebar, [data-cart]'
    },
    {
      title: t('onboarding.zoom.title', 'Navegación del Mapa'),
      description: t('onboarding.zoom.description', 'Haz zoom y desplázate por el mapa'),
      content: (
        <div>
          <Title level={4}>{t('onboarding.zoom.heading', 'Navegar por el Mapa')}</Title>
          <Paragraph>
            {t('onboarding.zoom.text',
              'Puedes hacer zoom con la rueda del mouse o los botones de zoom. También puedes arrastrar el mapa ' +
              'para moverte por diferentes áreas. Usa la vista de mapa completo (minimap) para navegación rápida.'
            )}
          </Paragraph>
          <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 16 }}>
            <div>
              <Text strong>🔍 {t('onboarding.zoom.feature1', 'Zoom In/Out')}</Text>
              <br />
              <Text type="secondary">{t('onboarding.zoom.feature1_desc', 'Usa la rueda del mouse o los botones + y -')}</Text>
            </div>
            <div>
              <Text strong>👆 {t('onboarding.zoom.feature2', 'Arrastrar')}</Text>
              <br />
              <Text type="secondary">{t('onboarding.zoom.feature2_desc', 'Haz clic y arrastra para mover el mapa')}</Text>
            </div>
            <div>
              <Text strong>🗺️ {t('onboarding.zoom.feature3', 'Vista Completa')}</Text>
              <br />
              <Text type="secondary">{t('onboarding.zoom.feature3_desc', 'Usa el minimap para navegación rápida')}</Text>
            </div>
          </Space>
        </div>
      ),
      highlightSelector: '.zoom-controls, .map-controls'
    },
    {
      title: t('onboarding.complete.title', '¡Listo!'),
      description: t('onboarding.complete.description', 'Ya estás listo para seleccionar asientos'),
      content: (
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4}>{t('onboarding.complete.heading', '¡Todo Listo!')}</Title>
          <Paragraph>
            {t('onboarding.complete.text',
              'Ahora ya sabes cómo seleccionar asientos. ¡Explora el mapa y encuentra tus asientos favoritos! ' +
              'Recuerda que los asientos seleccionados se reservan temporalmente por 15 minutos.'
            )}
          </Paragraph>
          <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 24 }}>
            <Card size="small" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <Text>
                💡 <strong>{t('onboarding.complete.tip', 'Consejo')}:</strong>{' '}
                {t('onboarding.complete.tip_text',
                  'Puedes pasar el mouse sobre un asiento para ver su precio y detalles'
                )}
              </Text>
            </Card>
          </Space>
        </div>
      ),
      highlightSelector: null
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    // Marcar el onboarding como completado
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    // Marcar como completado pero no visto
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    if (onSkip) {
      onSkip();
    }
  };

  // Efecto para resaltar elementos según el paso actual
  useEffect(() => {
    if (!visible) return;

    const step = steps[currentStep];
    if (step.highlightSelector && onHighlightElement) {
      onHighlightElement(step.highlightSelector);
    }
  }, [currentStep, visible]);

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          <span>{t('onboarding.title', 'Guía de Primer Uso')}</span>
        </Space>
      }
      open={visible}
      onCancel={handleSkip}
      width={600}
      footer={[
        <Button key="skip" onClick={handleSkip}>
          {t('onboarding.skip', 'Omitir')}
        </Button>,
        <Button key="prev" onClick={prev} disabled={currentStep === 0}>
          {t('onboarding.previous', 'Anterior')}
        </Button>,
        <Button key="next" type="primary" onClick={next}>
          {currentStep === steps.length - 1
            ? t('onboarding.finish', 'Finalizar')
            : t('onboarding.next', 'Siguiente')
          }
        </Button>
      ]}
      closable={true}
      maskClosable={false}
    >
      <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Steps.Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

      <div style={{ minHeight: 300, padding: '16px 0' }}>
        {steps[currentStep].content}
      </div>
    </Modal>
  );
};

// Función helper para verificar si el onboarding ya fue completado
export const isOnboardingCompleted = () => {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
};

// Función helper para resetear el onboarding (útil para testing)
export const resetOnboarding = () => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
};

export default SeatMapOnboarding;


