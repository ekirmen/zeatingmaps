import React, { useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Popover, Space } from 'antd';

const SeatStatusLegend = () => {
  const [visible, setVisible] = useState(false);

  const legendContent = (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical" size="small">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
          <span>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#1890ff' }}></div>
          <span>Seleccionado por mí</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#faad14' }}></div>
          <span>Seleccionado por otro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ff4d4f' }}></div>
          <span>Bloqueado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#8c8c8c' }}></div>
          <span>Vendido/Reservado</span>
        </div>
      </Space>
    </div>
  );

  return (
    <Popover
      content={legendContent}
      title="Estado de Asientos"
      trigger="click"
      visible={visible}
      onVisibleChange={setVisible}
      placement="left"
    >
      <Button
        type="text"
        icon={<InfoCircleOutlined />}
        size="small"
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '50px', 
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #d9d9d9'
        }}
        title="Leyenda de Estados"
      />
    </Popover>
  );
};

export default SeatStatusLegend;
