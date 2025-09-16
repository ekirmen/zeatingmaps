import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const BoleteriaAvanzadaTest = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '32px' }}>
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>🎫 Boletería Avanzada</Title>
          <Text type="secondary">
            Nueva versión de la boletería con funcionalidades avanzadas
          </Text>
          
          <div style={{ marginTop: '16px', textAlign: 'left' }}>
            <Text strong>Funcionalidades incluidas:</Text>
            <ul style={{ marginTop: '8px' }}>
              <li>✅ Reserva automática de asientos</li>
              <li>✅ Precios por zona</li>
              <li>✅ Estadísticas en tiempo real</li>
              <li>✅ Carrito avanzado</li>
              <li>✅ Modo bloqueo/venta</li>
              <li>✅ Búsqueda unificada</li>
            </ul>
          </div>

          <Space style={{ marginTop: '24px' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/backoffice/boleteria-avanzada')}
            >
              Ir a Boletería Avanzada
            </Button>
            <Button 
              onClick={() => navigate('/backoffice')}
            >
              Volver al Dashboard
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default BoleteriaAvanzadaTest;
