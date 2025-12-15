import React from 'react';
import { Dropdown, Button, Space, Menu } from '../../utils/antdComponents';
import {
  PlusOutlined,
  AppstoreOutlined,
  RadiusUprightOutlined,
  BorderOuterOutlined,
  StarOutlined,
} from '@ant-design/icons';

const MesaTypeMenu = ({ onAddMesa, disabled = false }) => {
  const mesaTypes = [
    {
      key: 'rect',
      icon: <BorderOuterOutlined />,
      label: 'Mesa Cuadrada',
      description: 'Mesa rectangular est¡ndar',
      defaultSize: { width: 120, height: 80 },
    },
    {
      key: 'circle',
      icon: <RadiusUprightOutlined />,
      label: 'Mesa Redonda',
      description: 'Mesa circular',
      defaultSize: { radius: 60 },
    },
    {
      key: 'hexagon',
      icon: <AppstoreOutlined />,
      label: 'Mesa Hexagonal',
      description: 'Mesa de 6 lados',
      defaultSize: { width: 100, height: 100 },
    },
    {
      key: 'star',
      icon: <StarOutlined />,
      label: 'Mesa Estrella',
      description: 'Mesa en forma de estrella',
      defaultSize: { width: 120, height: 120 },
    },
  ];

  const handleMenuClick = ({ key }) => {
    const mesaType = mesaTypes.find(type => type.key === key);
    if (mesaType && onAddMesa) {
      onAddMesa(mesaType.key, mesaType.defaultSize);
    }
  };

  const menu = (
    <Menu
      onClick={handleMenuClick}
      items={mesaTypes.map(type => ({
        key: type.key,
        icon: type.icon,
        label: (
          <div>
            <div style={{ fontWeight: 500 }}>{type.label}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{type.description}</div>
          </div>
        ),
      }))}
    />
  );

  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomLeft" disabled={disabled}>
      <Button icon={<PlusOutlined />} type="primary" className="flex items-center">
        <Space>
          <AppstoreOutlined />
          Mesa
        </Space>
      </Button>
    </Dropdown>
  );
};

export default MesaTypeMenu;
