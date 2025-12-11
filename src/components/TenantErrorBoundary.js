import React from 'react';
import { Card, Button, Typography, Space, Divider } from '../utils/antdComponents';
import { 
  ExclamationCircleOutlined, 
  PlusOutlined, 
  SettingOutlined,
  HomeOutlined
} from '@ant-design/icons';
import DomainWelcome from './DomainWelcome';

const { Title, Text } = Typography;

const TenantErrorBoundary = ({ error, subdomain, onRetry }) => {
  // Si no hay error específico, mostrar la página de bienvenida del dominio

    return <DomainWelcome />;
  }

  // Si hay error, mostrar opciones de solución
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: '64px', 
              color: '#ff4d4f',
              marginBottom: '16px'
            }} 
          />
          <Title level={2} type="danger">
            No se pudo detectar la empresa
          </Title>
          <Text type="secondary">
            {error}
          </Text>
        </div>

        <Divider />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>🔧 Opciones de Solución</Title>
            <Space wrap size="middle">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => window.open('/dashboard/saas', '_blank')}
              >
                Crear Nueva Empresa
              </Button>
              
              <Button 
                icon={<SettingOutlined />}
                size="large"
                onClick={() => window.open('/dashboard', '_blank')}
              >
                Ir al Panel SaaS
              </Button>
              
              <Button 
                icon={<HomeOutlined />}
                size="large"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </Space>
          </div>

          {subdomain && (
            <div>
              <Text strong>Subdominio detectado:</Text> {subdomain}
              <br />
              <Text type="secondary">
                Si este subdominio debería funcionar, verifica que esté configurado en la base de datos.
              </Text>
            </div>
          )}

          <div>
            <Text type="secondary">
              Si necesitas ayuda, contacta al administrador del sistema.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default TenantErrorBoundary;

