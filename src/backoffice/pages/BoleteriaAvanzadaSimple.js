import React from 'react';
import { Card, Button, Typography, Space, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TicketOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BoleteriaAvanzadaSimple = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '32px' }}>
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Result
            icon={<TicketOutlined style={{ color: '#1890ff', fontSize: '64px' }} />}
            title="🎫 Boletería Avanzada"
            subTitle="Nueva versión de la boletería con funcionalidades avanzadas"
            extra={[
              <Button 
                type="primary" 
                size="large"
                icon={<TicketOutlined />}
                onClick={() => navigate('/backoffice/boleteria')}
                style={{ marginRight: '8px' }}
              >
                Ir a Boletería Normal
              </Button>,
              <Button 
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/backoffice')}
              >
                Volver al Dashboard
              </Button>
            ]}
          />
          
          <div style={{ marginTop: '24px', textAlign: 'left', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
            <Title level={4}>Funcionalidades incluidas:</Title>
            <ul style={{ marginTop: '8px' }}>
              <li>✅ Reserva automática de asientos</li>
              <li>✅ Precios por zona</li>
              <li>✅ Estadísticas en tiempo real</li>
              <li>✅ Carrito avanzado</li>
              <li>✅ Modo bloqueo/venta</li>
              <li>✅ Búsqueda unificada</li>
              <li>✅ Interfaz moderna</li>
            </ul>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
            <Text type="secondary">
              <strong>Estado:</strong> Componente de prueba funcionando correctamente. 
              Los permisos están configurados y la ruta es accesible.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BoleteriaAvanzadaSimple;
