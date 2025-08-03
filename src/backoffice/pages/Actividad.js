// Actividad.js
import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Actividad = () => {
  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Actividad</Title>
        <p>Panel de actividad del sistema en desarrollo.</p>
      </Card>
    </div>
  );
};

export default Actividad;
