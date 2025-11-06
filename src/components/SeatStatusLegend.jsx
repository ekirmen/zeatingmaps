import React, { useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Popover, Space } from 'antd';
import { useTheme } from '../contexts/ThemeContext';

const SeatStatusLegend = () => {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();

  const legendContent = (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical" size="small">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatAvailable || '#52c41a' }}></div>
          <span>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatSelectedMe || '#ffd700' }}></div>
          <span>Seleccionado por mí</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatSelectedOther || '#2196F3' }}></div>
          <span>Seleccionado por otro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatBlocked || '#f56565' }}></div>
          <span>Bloqueado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatSold || '#2d3748' }}></div>
          <span>Vendido</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.seatReserved || '#805ad5' }}></div>
          <span>Reservado</span>
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
