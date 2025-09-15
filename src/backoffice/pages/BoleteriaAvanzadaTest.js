import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const BoleteriaAvanzadaTest = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <Title level={2}>🎫 Boletería Avanzada</Title>
          <Text type="secondary">
            Nueva versión de la boletería con funcionalidades avanzadas
          </Text>
          
          <div className="space-y-2">
            <Text strong>Funcionalidades incluidas:</Text>
            <ul className="text-left space-y-1">
              <li>✅ Reserva automática de asientos</li>
              <li>✅ Precios por zona</li>
              <li>✅ Estadísticas en tiempo real</li>
              <li>✅ Carrito avanzado</li>
              <li>✅ Modo bloqueo/venta</li>
              <li>✅ Búsqueda unificada</li>
            </ul>
          </div>

          <Space>
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
