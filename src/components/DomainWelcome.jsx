import React from 'react';
import { Card, Typography, Space, Button, Divider } from '../utils/antdComponents';
import {
  SettingOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import {
  getCurrentDomainConfig,
  shouldShowSaaS,
  shouldShowBackoffice,
  shouldShowStore,
} from '../config/domainConfig';

const { Title, Text } = Typography;

const DomainWelcome = () => {
  const config = getCurrentDomainConfig();
  const hostname = window.location.hostname;

  return (
    <div
      style={{
        padding: '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      {/* Header con branding del dominio */}
      <div style={{ marginBottom: '40px' }}>
        <Title level={1} style={{ color: config.theme.primaryColor }}>
          🚀 {config.branding.companyName}
        </Title>
        <Title level={3} type="secondary">
          {config.branding.tagline}
        </Title>
        <Text type="secondary">Dominio: {hostname}</Text>
      </div>

      {/* Información del sistema */}
      <Card style={{ marginBottom: '30px', textAlign: 'left' }}>
        <Title level={4}>📋 Información del Sistema</Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Dominio:</Text> {hostname}
          </div>
          <div>
            <Text strong>Empresa:</Text> {config.branding.companyName}
          </div>
          <div>
            <Text strong>Contacto:</Text> {config.branding.contactEmail}
          </div>
          <div>
            <Text strong>Estado:</Text>
            <Text type="success" style={{ marginLeft: '8px' }}>
              ✅ Activo y funcionando
            </Text>
          </div>
        </Space>
      </Card>

      {/* Funcionalidades disponibles */}
      <Card style={{ marginBottom: '30px' }}>
        <Title level={4}>⚙️ Funcionalidades Disponibles</Title>
        <Space wrap size="large" style={{ justifyContent: 'center' }}>
          {shouldShowSaaS() && (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              size="large"
              onClick={() => (window.location.href = '/dashboard')}
            >
              Panel SaaS
            </Button>
          )}

          {shouldShowBackoffice() && (
            <Button
              icon={<BankOutlined />}
              size="large"
              onClick={() => (window.location.href = '/dashboard/backoffice')}
            >
              Backoffice
            </Button>
          )}

          {shouldShowStore() && (
            <Button
              icon={<ShoppingOutlined />}
              size="large"
              onClick={() => (window.location.href = '/store')}
            >
              Tienda
            </Button>
          )}

          {config.features.showEvents && (
            <Button
              icon={<CalendarOutlined />}
              size="large"
              onClick={() => (window.location.href = '/eventos')}
            >
              Eventos
            </Button>
          )}

          {config.features.showVenues && (
            <Button
              icon={<BankOutlined />}
              size="large"
              onClick={() => (window.location.href = '/recintos')}
            >
              Recintos
            </Button>
          )}
        </Space>
      </Card>

      {/* Configuración específica del dominio */}
      <Card>
        <Title level={4}>🎨 Configuración del Dominio</Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>Colores del Tema:</Text>
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  backgroundColor: config.theme.primaryColor,
                  marginRight: '10px',
                  borderRadius: '3px',
                }}
              ></div>
              <Text>Primario: {config.theme.primaryColor}</Text>
              <div
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  backgroundColor: config.theme.secondaryColor,
                  marginLeft: '20px',
                  marginRight: '10px',
                  borderRadius: '3px',
                }}
              ></div>
              <Text>Secundario: {config.theme.secondaryColor}</Text>
            </div>
          </div>

          <Divider />

          <div>
            <Text strong>Características Habilitadas:</Text>
            <ul style={{ textAlign: 'left', marginTop: '10px' }}>
              {config.features.showSaaS && <li>✅ Panel SaaS</li>}
              {config.features.showStore && <li>✅ Tienda</li>}
              {config.features.showBackoffice && <li>✅ Backoffice</li>}
              {config.features.showTicketing && <li>✅ Sistema de Ticketing</li>}
              {config.features.showEvents && <li>✅ Gestión de Eventos</li>}
              {config.features.showVenues && <li>✅ Gestión de Recintos</li>}
            </ul>
          </div>
        </Space>
      </Card>

      {/* Footer */}
      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary">
          Sistema configurado para {config.branding.companyName} | Desarrollado con ❤️ por
          ZeatingMaps
        </Text>
      </div>
    </div>
  );
};

export default DomainWelcome;
