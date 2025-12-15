import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Modal, 
  Form, 
  Slider, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Card,
  Divider,
  InputNumber
} from '../../../utils/antdComponents';
import {
  PictureOutlined,
  SettingOutlined,
  EyeOutlined,
  RotateLeftOutlined,
  BulbOutlined,
  HighlightOutlined,
  DashboardOutlined,
  PaletteOutlined,
  FilterOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// ===== FILTROS DISPONIBLES CON ICONOS DISPONIBLES =====
const AVAILABLE_FILTERS = [
  {
    key: 'blur',
    label: 'Desenfoque',
    icon: <FilterOutlined />,
    min: 0,
    max: 40,
    step: 0.5,
    defaultValue: 0,
    unit: 'px',
    description: 'Aplica un efecto de desenfoque a la imagen'
  },
  {
    key: 'brightness',
    label: 'Brillo',
    icon: <BulbOutlined />,
    min: 50,
    max: 200,
    step: 1,
    defaultValue: 100,
    unit: '%',
    description: 'Ajusta el brillo de la imagen'
  },
  {
    key: 'contrast',
    label: 'Contraste',
    icon: <PaletteOutlined />,
    min: 50,
    max: 200,
    step: 1,
    defaultValue: 100,
    unit: '%',
    description: 'Ajusta el contraste de la imagen'
  },
  {
    key: 'saturation',
    label: 'Saturación',
    icon: <HighlightOutlined />,
    min: 0,
    max: 200,
    step: 1,
    defaultValue: 100,
    unit: '%',
    description: 'Ajusta la saturación de los colores'
  },
  {
    key: 'hue',
    label: 'Tono',
    icon: <PaletteOutlined />,
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
    unit: '°',
    description: 'Rota los colores de la imagen'
  },
  {
    key: 'opacity',
    label: 'Opacidad',
    icon: <EyeOutlined />,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 100,
    unit: '%',
    description: 'Ajusta la transparencia de la imagen'
  },
  {
    key: 'grayscale',
    label: 'Escala de grises',
    icon: <DashboardOutlined />,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    unit: '%',
    description: 'Convierte la imagen a escala de grises'
  },
  {
    key: 'sepia',
    label: 'Sepia',
    icon: <PictureOutlined />,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    unit: '%',
    description: 'Aplica un efecto sepia vintage'
  }
];

// ===== PRESETS DE FILTROS =====
const FILTER_PRESETS = {
  none: { 
    name: 'Original', 
    filters: {},
    description: 'Sin filtros aplicados'
  },
  vintage: { 
    name: 'Vintage', 
    filters: { 
      sepia: 60,
      contrast: 90,
      brightness: 95,
      saturation: 85
    },
    description: 'Efecto clásico retro'
  },
  modern: { 
    name: 'Moderno', 
    filters: { 
      contrast: 120,
      saturation: 110,
      brightness: 105
    },
    description: 'Colores vibrantes y definidos'
  },
  dark: { 
    name: 'Oscuro', 
    filters: { 
      brightness: 70,
      contrast: 130,
      saturation: 80
    },
    description: 'Tono oscuro dramático'
  },
  light: { 
    name: 'Claro', 
    filters: { 
      brightness: 130,
      contrast: 90,
      saturation: 95
    },
    description: 'Iluminación brillante'
  },
  artistic: { 
    name: 'Artístico', 
    filters: { 
      blur: 2,
      saturation: 120,
      hue: 15,
      contrast: 110
    },
    description: 'Efecto creativo suave'
  }
};

const BackgroundFilterMenu = ({
  backgroundImage,
  filters = {},
  onFiltersChange,
  onResetFilters,
  visible = false,
  onClose
}) => {
  const [form] = Form.useForm();
  const [localFilters, setLocalFilters] = useState(() => ({
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    opacity: 100,
    grayscale: 0,
    sepia: 0,
    ...filters
  }));
  const [activePreset, setActivePreset] = useState('none');

  // ===== EFECTOS =====
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(localFilters);
      updateActivePreset(localFilters);
    }
  }, [visible, localFilters, form]);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      setLocalFilters(prev => ({ ...prev, ...filters }));
    }
  }, [filters]);

  // ===== FUNCIONES DE UTILIDAD =====
  const updateActivePreset = useCallback((currentFilters) => {
    let bestMatch = 'none';
    let highestSimilarity = 0;

    Object.entries(FILTER_PRESETS).forEach(([presetKey, preset]) => {
      if (presetKey === 'none') return;
      
      let similarity = 0;
      const presetFilters = preset.filters;
      
      Object.entries(presetFilters).forEach(([filterKey, value]) => {
        const currentValue = currentFilters[filterKey] || 0;
        if (Math.abs(currentValue - value) < 10) {
          similarity += 1;
        }
      });

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = presetKey;
      }
    });

    setActivePreset(bestMatch);
  }, []);

  // ===== MANEJADORES =====
  const handleFilterChange = useCallback((filterKey, value) => {
    const newFilters = {
      ...localFilters,
      [filterKey]: value
    };
    setLocalFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
    
    // Actualizar preset activo
    updateActivePreset(newFilters);
  }, [localFilters, onFiltersChange, updateActivePreset]);

  const handleFilterToggle = useCallback((filterKey, enabled) => {
    const filterConfig = AVAILABLE_FILTERS.find(f => f.key === filterKey);
    if (!filterConfig) return;

    const newFilters = {
      ...localFilters,
      [filterKey]: enabled ? filterConfig.defaultValue : null
    };
    setLocalFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
    
    updateActivePreset(newFilters);
  }, [localFilters, onFiltersChange, updateActivePreset]);

  const handlePresetSelect = useCallback((presetKey) => {
    const preset = FILTER_PRESETS[presetKey];
    if (!preset) return;

    const newFilters = {
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      opacity: 100,
      grayscale: 0,
      sepia: 0,
      ...preset.filters
    };

    setLocalFilters(newFilters);
    setActivePreset(presetKey);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [onFiltersChange]);

  const handleReset = useCallback(() => {
    const resetFilters = {};
    AVAILABLE_FILTERS.forEach(filter => {
      resetFilters[filter.key] = filter.defaultValue;
    });
    
    setLocalFilters(resetFilters);
    setActivePreset('none');
    form.resetFields();
    
    if (onResetFilters) {
      onResetFilters(resetFilters);
    }
  }, [form, onResetFilters]);

  const handleApply = useCallback(() => {
    if (onFiltersChange) {
      onFiltersChange(localFilters);
    }
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  // ===== CALCULAR ESTILOS DE FILTRO CSS =====
  const getFilterStyle = useMemo(() => {
    const filterValues = [];
    
    if (localFilters.blur > 0) {
      filterValues.push(`blur(${localFilters.blur}px)`);
    }
    if (localFilters.brightness !== 100) {
      filterValues.push(`brightness(${localFilters.brightness}%)`);
    }
    if (localFilters.contrast !== 100) {
      filterValues.push(`contrast(${localFilters.contrast}%)`);
    }
    if (localFilters.saturation !== 100) {
      filterValues.push(`saturate(${localFilters.saturation}%)`);
    }
    if (localFilters.hue !== 0) {
      filterValues.push(`hue-rotate(${localFilters.hue}deg)`);
    }
    if (localFilters.grayscale > 0) {
      filterValues.push(`grayscale(${localFilters.grayscale}%)`);
    }
    if (localFilters.sepia > 0) {
      filterValues.push(`sepia(${localFilters.sepia}%)`);
    }

    return filterValues.join(' ') || 'none';
  }, [localFilters]);

  const getOpacityStyle = useMemo(() => {
    return localFilters.opacity !== 100 ? localFilters.opacity / 100 : 1;
  }, [localFilters.opacity]);

  // ===== FUNCIÓN PARA OBTENER EL COLOR DE ICONO BASADO EN EL FILTRO =====
  const getFilterIconColor = useCallback((filterKey) => {
    const value = localFilters[filterKey];
    if (value === null || value === undefined) return '#bfbfbf';
    
    const filter = AVAILABLE_FILTERS.find(f => f.key === filterKey);
    if (!filter) return '#1890ff';
    
    const defaultValue = filter.defaultValue;
    if (value === defaultValue) return '#bfbfbf';
    
    // Color basado en el tipo de filtro
    const filterColors = {
      blur: '#722ed1',
      brightness: '#faad14',
      contrast: '#13c2c2',
      saturation: '#eb2f96',
      hue: '#52c41a',
      opacity: '#1890ff',
      grayscale: '#595959',
      sepia: '#d48806'
    };
    
    return filterColors[filterKey] || '#1890ff';
  }, [localFilters]);

  // ===== RENDERIZADO =====
  const renderFilterControl = useCallback((filter) => {
    const value = localFilters[filter.key];
    const isActive = value !== null && value !== filter.defaultValue;
    const iconColor = getFilterIconColor(filter.key);

    return (
      <Card 
        key={filter.key} 
        size="small"
        className={`filter-card ${isActive ? 'active-filter' : ''}`}
        style={{
          borderColor: isActive ? iconColor : undefined,
          backgroundColor: isActive ? `${iconColor}10` : undefined
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="mr-2" style={{ color: iconColor }}>
              {React.cloneElement(filter.icon, { style: { fontSize: '16px' } })}
            </span>
            <div>
              <Text strong className="text-sm">{filter.label}</Text>
              <Text type="secondary" className="block text-xs">
                {filter.description}
              </Text>
            </div>
          </div>
          <Switch
            checked={value !== null}
            onChange={(checked) => handleFilterToggle(filter.key, checked)}
            size="small"
            style={{ backgroundColor: value !== null ? iconColor : undefined }}
          />
        </div>
        
        {value !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Text type="secondary" className="text-xs">
                  Valor:
                </Text>
                <InputNumber
                  size="small"
                  min={filter.min}
                  max={filter.max}
                  step={filter.step}
                  value={value}
                  onChange={(newValue) => handleFilterChange(filter.key, newValue)}
                  className="w-20"
                  addonAfter={filter.unit}
                  style={{ borderColor: iconColor }}
                />
              </div>
              <Button
                size="small"
                type="text"
                onClick={() => handleFilterChange(filter.key, filter.defaultValue)}
                style={{ color: iconColor }}
              >
                Restablecer
              </Button>
            </div>
            
            <Slider
              min={filter.min}
              max={filter.max}
              step={filter.step}
              value={value}
              onChange={(newValue) => handleFilterChange(filter.key, newValue)}
              tooltip={{
                formatter: (val) => `${val}${filter.unit}`,
                color: iconColor
              }}
              trackStyle={{ backgroundColor: iconColor }}
              handleStyle={{ borderColor: iconColor }}
            />
          </div>
        )}
      </Card>
    );
  }, [localFilters, handleFilterChange, handleFilterToggle, getFilterIconColor]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <PictureOutlined />
          <span className="font-semibold">Filtros de Imagen de Fondo</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" icon={<RotateLeftOutlined />} onClick={handleReset}>
          Restablecer Todo
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Aplicar Filtros
        </Button>
      ]}
      width={800}
      className="filter-menu-modal"
    >
      <div className="space-y-6">
        {/* ===== PREVIEW DE LA IMAGEN ===== */}
        <Card size="small" title="Vista Previa" className="preview-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <img
                  src={backgroundImage}
                  alt="Original"
                  className="preview-image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}
                />
                <div className="preview-label original">
                  Original
                </div>
              </div>
            </div>
            
            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <img
                  src={backgroundImage}
                  alt="Con Filtros"
                  className="preview-image filtered"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    filter: getFilterStyle,
                    opacity: getOpacityStyle
                  }}
                />
                <div className="preview-label filtered">
                  Con Filtros
                </div>
              </div>
            </div>
          </div>
          
          {/* Estilos CSS generados */}
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
            <Text strong className="block mb-1">Estilos CSS generados:</Text>
            <code className="text-blue-600">
              filter: {getFilterStyle};<br />
              opacity: {getOpacityStyle};
            </code>
          </div>
        </Card>

        {/* ===== PRESETS DE FILTROS ===== */}
        <Card size="small" title="Presets Rápidos" className="presets-card">
          <div className="space-y-2">
            <Text type="secondary" className="text-xs">
              Selecciona un preset para aplicar combinaciones predefinidas:
            </Text>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type={activePreset === key ? 'primary' : 'default'}
                  size="small"
                  onClick={() => handlePresetSelect(key)}
                  className={`preset-button ${activePreset === key ? 'active-preset' : ''}`}
                  title={preset.description}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Divider />

        {/* ===== FILTROS INDIVIDUALES ===== */}
        <div className="space-y-4">
          <Title level={5} className="mb-4">
            <SettingOutlined className="mr-2" />
            Filtros Individuales
          </Title>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_FILTERS.map(renderFilterControl)}
          </div>
        </div>

        {/* ===== RESUMEN ===== */}
        <Card size="small" title="Resumen" className="summary-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text type="secondary">Preset activo:</Text>
              <Text strong style={{ color: '#1890ff' }}>
                {FILTER_PRESETS[activePreset].name}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text type="secondary">Filtros activos:</Text>
              <Text strong style={{ color: '#52c41a' }}>
                {Object.values(localFilters).filter(v => v !== null && 
                  (typeof v === 'number' ? v !== AVAILABLE_FILTERS.find(f => f.defaultValue === v)?.defaultValue : false)).length}
                /{AVAILABLE_FILTERS.length}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text type="secondary">Efecto CSS:</Text>
              <Text code className="text-xs" style={{ color: '#722ed1' }}>
                {getFilterStyle}
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== ESTILOS INLINE (alternativa a CSS externo) ===== */}
      <style jsx>{`
        .preview-image {
          transition: filter 0.3s ease, opacity 0.3s ease;
        }
        
        .preview-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .preview-label.original {
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
        }
        
        .preview-label.filtered {
          background-color: rgba(24, 144, 255, 0.8);
          color: white;
        }
        
        .preset-button {
          transition: all 0.2s ease;
        }
        
        .active-preset {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }
        
        .filter-card {
          transition: all 0.2s ease;
          border: 1px solid #f0f0f0;
        }
        
        .active-filter {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .summary-card {
          background-color: #fafafa;
        }
        
        .filter-menu-modal .ant-modal-body {
          max-height: 70vh;
          overflow-y: auto;
        }
      `}</style>
    </Modal>
  );
};

export default BackgroundFilterMenu;