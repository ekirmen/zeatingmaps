import React from 'react';
import { Card, Typography, Button } from 'antd';

const { Title, Text } = Typography;

const TestCompactBoleteria = ({ selectedFuncion, mapa }) => {
  console.log('🧪 [TestCompactBoleteria] Componente de prueba renderizado');
  console.log('🧪 [TestCompactBoleteria] Función seleccionada:', selectedFuncion);
  console.log('🧪 [TestCompactBoleteria] Mapa:', mapa);

  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      <Title level={2} className="text-center mb-8">
        🧪 COMPONENTE DE PRUEBA - BOLETERÍA COMPACTA
      </Title>
      
      <Card className="mb-4">
        <Title level={3}>✅ ¡Funciona!</Title>
        <Text>
          Si puedes ver este mensaje, significa que el componente CompactBoleteria se está renderizando correctamente.
        </Text>
      </Card>

      <Card className="mb-4">
        <Title level={4}>📊 Datos de Prueba:</Title>
        <div className="space-y-2">
          <div><strong>Función seleccionada:</strong> {selectedFuncion?.nombre || 'Ninguna'}</div>
          <div><strong>ID de función:</strong> {selectedFuncion?.id || selectedFuncion?._id || 'N/A'}</div>
          <div><strong>Mapa cargado:</strong> {mapa ? '✅ Sí' : '❌ No'}</div>
          <div><strong>Contenido del mapa:</strong> {mapa?.contenido?.length || 0} elementos</div>
        </div>
      </Card>

      <Card>
        <Title level={4}>🎯 Próximos pasos:</Title>
        <Text>
          Una vez que confirmes que este componente se muestra, podremos activar el componente CompactBoleteria completo.
        </Text>
      </Card>

      <div className="text-center mt-8">
        <Button type="primary" size="large">
          🎉 ¡Componente de prueba funcionando!
        </Button>
      </div>
    </div>
  );
};

export default TestCompactBoleteria;
