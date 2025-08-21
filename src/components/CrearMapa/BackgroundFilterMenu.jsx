import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Slider, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Card,
  Divider
} from 'antd';
import {
  PictureOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  RotateLeftOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BackgroundFilterMenu = ({
  backgroundImage,
  filters = {},
  onFiltersChange,
  onResetFilters,
  visible = false,
  onClose
}) => {
  const [form] = Form.useForm();
  const [localFilters, setLocalFilters] = useState(filters);

  // ===== FILTROS DISPONIBLES =====
  const availableFilters = [
    {
      key: 'blur',
      label: 'Desenfoque',
      min: 0,
      max: 40,
      step: 1,
      defaultValue: 0,
      description: 'Aplica un efecto de desenfoque a la imagen'
    },
    {
      key: 'brightness',
      label: 'Brillo',
      min: -1,
      max: 1,
      step: 0.1,
      defaultValue: 0,
      description: 'Ajusta el brillo de la imagen'
    },
    {
      key: 'contrast',
      label: 'Contraste',
      min: -100,
      max: 100,
      step: 1,
      defaultValue: 0,
      description: 'Ajusta el contraste de la imagen'
    },
    {
      key: 'saturation',
      label: 'Saturación',
      min: -1,
      max: 1,
      step: 0.1,
      defaultValue: 0,
      description: 'Ajusta la saturación de los colores'
    },
    {
      key: 'hue',
      label: 'Tono',
      min: -180,
      max: 180,
      step: 1,
      defaultValue: 0,
      description: 'Rota los colores de la imagen'
    }
  ];

  // ===== EFECTOS =====
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(localFilters);
    }
  }, [visible, localFilters, form]);

  // ===== MANEJADORES =====
  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...localFilters,
      [filterKey]: value
    };
    setLocalFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleFilterToggle = (filterKey, enabled) => {
    const newFilters = {
      ...localFilters,
      [filterKey]: enabled ? localFilters[filterKey] || 0 : null
    };
    setLocalFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {};
    availableFilters.forEach(filter => {
      resetFilters[filter.key] = null;
    });
    
    setLocalFilters(resetFilters);
    form.resetFields();
    
    if (onResetFilters) {
      onResetFilters(resetFilters);
    }
  };

  const handleApply = () => {
    if (onFiltersChange) {
      onFiltersChange(localFilters);
    }
    onClose();
  };

  // ===== RENDERIZADO =====
  if (!backgroundImage) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <PictureOutlined />
          Filtros de Imagen de Fondo
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" icon={<RotateLeftOutlined />} onClick={handleReset}>
          Restablecer
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Aplicar Filtros
        </Button>
      ]}
      width={700}
    >
      <div className="space-y-6">
        {/* ===== PREVIEW DE LA IMAGEN ===== */}
        <Card size="small" title="Vista Previa">
          <div className="text-center">
            <img
              src={backgroundImage}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
            />
          </div>
        </Card>

        {/* ===== FILTROS ===== */}
        <div className="space-y-4">
          {availableFilters.map(filter => (
            <Card key={filter.key} size="small">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Text strong>{filter.label}</Text>
                  <Text type="secondary" className="block text-xs">
                    {filter.description}
                  </Text>
                </div>
                <Switch
                  checked={localFilters[filter.key] !== null}
                  onChange={(checked) => handleFilterToggle(filter.key, checked)}
                />
              </div>
              
              {localFilters[filter.key] !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text type="secondary">Valor: {localFilters[filter.key]}</Text>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => handleFilterChange(filter.key, filter.defaultValue)}
                    >
                      Reset
                    </Button>
                  </div>
                  
                  <Slider
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    value={localFilters[filter.key]}
                    onChange={(value) => handleFilterChange(filter.key, value)}
                    tooltip={{
                      formatter: (value) => `${value}`
                    }}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* ===== INFORMACIÓN ADICIONAL ===== */}
        <Card size="small" title="Información">
          <Text type="secondary" className="text-sm">
            Los filtros se aplican en tiempo real. Puedes combinar múltiples filtros 
            para crear efectos únicos. Usa el botón "Restablecer" para volver a la 
            imagen original.
          </Text>
        </Card>
      </div>
    </Modal>
  );
};

export default BackgroundFilterMenu;
