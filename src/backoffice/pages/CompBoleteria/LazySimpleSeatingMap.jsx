import React, { Suspense } from 'react';
import { Card, Typography, Spin } from 'antd';

const { Title, Text } = Typography;

// Lazy load del componente SimpleSeatingMap para evitar problemas de hoisting
const SimpleSeatingMapLazy = React.lazy(() => import('./components/SimpleSeatingMap'));

const LazySimpleSeatingMap = (props) => {
  return (
    <Suspense 
      fallback={
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: '16px' }}>
              Cargando mapa de asientos...
            </Title>
            <Text type="secondary">
              Preparando la visualización del mapa
            </Text>
          </div>
        </Card>
      }
    >
      <SimpleSeatingMapLazy {...props} />
    </Suspense>
  );
};

export default LazySimpleSeatingMap;
