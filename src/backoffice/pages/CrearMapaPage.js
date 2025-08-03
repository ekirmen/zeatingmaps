// src/pages/CrearMapaPage.js
import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const CrearMapaPage = () => {
  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Crear Mapa</Title>
        <p>Funcionalidad para crear mapas de asientos en desarrollo.</p>
      </Card>
    </div>
  );
};

export default CrearMapaPage;
