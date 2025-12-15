import React from 'react';
import { Alert, Card, Button, Typography, Space, Divider } from '../utils/antdComponents';
import { ExclamationCircleOutlined, PlusOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const TenantErrorBoundary = ({ error, onRetry, subdomain }) => {
  const handleCreateTenant = () => {
    // Abrir el panel de SaaS en una nueva pestaña
    const baseUrl = window.location.origin;
    const saasUrl = `${baseUrl}/backoffice/saas`;
    window.open(saasUrl, '_blank');
  };

  const handleGoToBackoffice = () => {
    // Ir al backoffice principal
    const baseUrl = window.location.origin;
    const backofficeUrl = `${baseUrl}/backoffice`;
    window.location.href = backofficeUrl;
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <ExclamationCircleOutlined
              style={{ fontSize: '64px', color: '#faad14', marginBottom: '16px' }}
            />
            <Title level={2} style={{ color: '#d48806' }}>
              Empresa No Configurada
            </Title>
          </div>

          <Alert
            message="Error de Configuración"
            description={error || `No se pudo detectar la empresa para el subdominio: ${subdomain}`}
            type="warning"
            showIcon
            style={{ textAlign: 'left' }}
          />

          <Divider />

          <div style={{ textAlign: 'left' }}>
            <Title level={4}>¿Qué está pasando?</Title>
            <Paragraph>
              Tu aplicación está intentando acceder a una empresa que no existe o no está
              configurada en la base de datos. El subdominio <Text code>{subdomain}</Text> no tiene
              una empresa asociada.
            </Paragraph>

            <Title level={4}>¿Cómo solucionarlo?</Title>
            <Paragraph>
              Necesitas crear una empresa en el panel de administración SaaS. Esto incluye:
            </Paragraph>

            <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
              <li>Configurar los datos básicos de la empresa</li>
              <li>Crear un recinto y salas</li>
              <li>Configurar eventos y funciones</li>
              <li>Establecer plantillas de precios</li>
              <li>Configurar mapas y zonas</li>
            </ul>
          </div>

          <Divider />

          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreateTenant}
            >
              Crear Empresa
            </Button>

            <Button size="large" icon={<DatabaseOutlined />} onClick={handleGoToBackoffice}>
              Ir al Panel de Administración
            </Button>

            <Button size="large" onClick={onRetry}>
              Reintentar Detección
            </Button>
          </Space>

          <Divider />

          <div style={{ textAlign: 'left', fontSize: '12px', color: '#8c8c8c' }}>
            <Text strong>Información Técnica:</Text>
            <br />
            <Text code>Hostname:</Text> {window.location.hostname}
            <br />
            <Text code>Subdominio detectado:</Text> {subdomain}
            <br />
            <Text code>URL actual:</Text> {window.location.href}
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default TenantErrorBoundary;
