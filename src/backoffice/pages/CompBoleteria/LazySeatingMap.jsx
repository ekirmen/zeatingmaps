import React, { Suspense } from 'react';
import { Card, Typography, Spin } from 'antd';

const { Title, Text } = Typography;

// Lazy load del componente SeatingMap para evitar problemas de hoisting
const SeatingMapLazy = React.lazy(() => import('./SeatingMap'));

const LazySeatingMap = (props) => {
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
      <SeatingMapLazy {...props} />
    </Suspense>
  );
};

export default LazySeatingMap;
