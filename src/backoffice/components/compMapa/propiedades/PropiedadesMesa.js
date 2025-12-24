import React, { useState, useEffect } from 'react';
import { Input, Button, Slider, Space, Typography, Row, Col, Card, Divider, InputNumber } from '../../../../utils/antdComponents';
import { RotateRightOutlined, ArrowsAltOutlined, EditOutlined, CloseOutlined, CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PropiedadesMesa = ({ mesa, onUpdate, onClose, onAddSillas, onRemoveSillas, onDuplicate, onDelete }) => {
  const [nombreMesa, setNombreMesa] = useState(mesa?.nombre || '');
  const [rotation, setRotation] = useState(mesa?.rotation || 0);
  const [width, setWidth] = useState(mesa?.width || 120);
  const [height, setHeight] = useState(mesa?.height || 80);
  const [radius, setRadius] = useState(mesa?.radius || 60);
  
  // Configuración de sillas
  const [sillasConfig, setSillasConfig] = useState({
    rect: { top: 0, right: 0, bottom: 0, left: 0 },
    circle: { cantidad: 8, radio: 80 },
    hexagon: { lados: [0, 0, 0, 0, 0, 0] },
    star: { puntos: [0, 0, 0, 0, 0] }
  });

  // Actualizar estado local cuando cambie la mesa
  useEffect(() => {
    if (mesa) {
      setNombreMesa(mesa.nombre || '');
      setRotation(mesa.rotation || 0);
      setWidth(mesa.width || 120);
      setHeight(mesa.height || 80);
      setRadius(mesa.radius || 60);
      
      // Cargar configuración existente de sillas
      if (mesa.sillasConfig) {
        setSillasConfig(mesa.sillasConfig);
      }
    }
  }, [mesa]);

  const handleUpdateNombre = () => {
    if (onUpdate) {
      onUpdate({ nombre: nombreMesa });
    }
  };

  const handleRotate = (value) => {
    setRotation(value);
    if (onUpdate) {
      onUpdate({ rotation: value });
    }
  };

  const handleResize = (type, value) => {
    if (type === 'width') {
      setWidth(value);
      if (onUpdate) {
        onUpdate({ width: value });
      }
    } else if (type === 'height') {
      setHeight(value);
      if (onUpdate) {
        onUpdate({ height: value });
      }
    } else if (type === 'radius') {
      setRadius(value);
      if (onUpdate) {
        onUpdate({ radius: value });
      }
    }
  };

  const handleAddSillas = () => {
    if (onAddSillas) {
      onAddSillas(mesa._id, sillasConfig);
    }
  };

  const handleRemoveSillas = () => {
    if (onRemoveSillas) {
      onRemoveSillas(mesa._id);
    }
  };

  const getTotalSillas = () => {
    switch (mesa?.shape || mesa?.type) {
      case 'rect':
        return Object.values(sillasConfig.rect).reduce((sum, val) => sum + (val || 0), 0);
      case 'circle':
        return sillasConfig.circle.cantidad || 0;
      case 'hexagon':
        return sillasConfig.hexagon.lados.reduce((sum, val) => sum + (val || 0), 0);
      case 'star':
        return sillasConfig.star.puntos.reduce((sum, val) => sum + (val || 0), 0);
      default:
        return 0;
    }
  };

  if (!mesa) return null;

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <EditOutlined />
          <span>Propiedades de Mesa</span>
        </div>
      }
      extra={
        <Button
          icon={<CloseOutlined />}
          type="text"
          size="small"
          onClick={onClose}
        />
      }
      size="small"
      className="w-80"
    >
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <Text strong>Nombre:</Text>
          <Space className="w-full mt-2">
            <Input
              placeholder="Nombre de la mesa"
              value={nombreMesa}
              onChange={(e) => setNombreMesa(e.target.value)}
              onPressEnter={handleUpdateNombre}
            />
            <Button
              type="primary"
              size="small"
              onClick={handleUpdateNombre}
            >
              Actualizar
            </Button>
          </Space>
        </div>

        {/* Tipo de Mesa */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <Text type="secondary">
            <strong>Tipo de Mesa:</strong> {mesa.shape || mesa.type || 'rect'}
          </Text>
        </div>

        {/* Rotación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Text strong>Rotación:</Text>
            <Text>{rotation}°</Text>
          </div>
          <Slider
            min={0}
            max={360}
            step={5}
            value={rotation}
            onChange={handleRotate}
            marks={{
              0: '0°',
              90: '90°',
              180: '180°',
              270: '270°',
              360: '360°'
            }}
          />
        </div>

        {/* Dimensiones según el tipo de mesa */}
        {mesa.shape === 'rect' || mesa.type === 'rect' ? (
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <Text strong>Ancho:</Text>
                <InputNumber
                  type="number"
                  min={20}
                  max={500}
                  value={width}
                  onChange={(e) => handleResize('width', parseInt(e.target.value) || 20)}
                  suffix="px"
                  className="w-full mt-1"
                />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>Alto:</Text>
                <InputNumber
                  type="number"
                  min={20}
                  max={500}
                  value={height}
                  onChange={(e) => handleResize('height', parseInt(e.target.value) || 20)}
                  suffix="px"
                  className="w-full mt-1"
                />
              </div>
            </Col>
          </Row>
        ) : (mesa.shape === 'circle' || mesa.type === 'circle') ? (
          <div>
            <Text strong>Radio:</Text>
            <InputNumber
              type="number"
              min={20}
              max={200}
              value={radius}
              onChange={(e) => handleResize('radius', parseInt(e.target.value) || 20)}
              suffix="px"
              className="w-full mt-1"
            />
          </div>
        ) : null}

        <Divider />

        {/* Gestión de Sillas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Text strong>Gestión de Sillas</Text>
            <Text type="primary" className="text-sm">
              Total: {getTotalSillas()}
            </Text>
          </div>

          {/* Configuración según tipo de mesa */}
          {(mesa.shape === 'rect' || mesa.type === 'rect') && (
            <div className="space-y-3">
              <Text type="secondary" className="text-xs">Sillas por lado:</Text>
              <Row gutter={8}>
                <Col span={6}>
                  <div className="text-center">
                    <Text className="text-xs">Arriba</Text>
                    <InputNumber
                      min={0}
                      max={20}
                      value={sillasConfig.rect.top}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        rect: { ...prev.rect, top: value || 0 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <Text className="text-xs">Derecha</Text>
                    <InputNumber
                      min={0}
                      max={20}
                      value={sillasConfig.rect.right}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        rect: { ...prev.rect, right: value || 0 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <Text className="text-xs">Abajo</Text>
                    <InputNumber
                      min={0}
                      max={20}
                      value={sillasConfig.rect.bottom}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        rect: { ...prev.rect, bottom: value || 0 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <Text className="text-xs">Izquierda</Text>
                    <InputNumber
                      min={0}
                      max={20}
                      value={sillasConfig.rect.left}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        rect: { ...prev.rect, left: value || 0 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {(mesa.shape === 'circle' || mesa.type === 'circle') && (
            <div className="space-y-3">
              <Text type="secondary" className="text-xs">Sillas circulares:</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text className="text-xs">Cantidad:</Text>
                    <InputNumber
                      min={1}
                      max={24}
                      value={sillasConfig.circle.cantidad}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        circle: { ...prev.circle, cantidad: value || 8 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text className="text-xs">Radio:</Text>
                    <InputNumber
                      min={40}
                      max={200}
                      value={sillasConfig.circle.radio}
                      onChange={(value) => setSillasConfig(prev => ({
                        ...prev,
                        circle: { ...prev.circle, radio: value || 80 }
                      }))}
                      className="w-full mt-1"
                      size="small"
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* Botones de acción para sillas */}
          <div className="flex gap-2 mt-3">
            <Button
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddSillas}
              disabled={getTotalSillas() === 0}
              className="flex-1"
            >
              Agregar {getTotalSillas()} Sillas
            </Button>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={handleRemoveSillas}
              disabled={getTotalSillas() === 0}
            >
              Remover
            </Button>
          </div>
        </div>

        <Divider />

        {/* Acciones */}
        <div className="space-y-2">
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={onDuplicate}
            className="w-full"
          >
            Duplicar Mesa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={onDelete}
            className="w-full"
          >
            Eliminar Mesa
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <Text type="secondary">
            ðŸ’á <strong>ID:</strong> {mesa._id}<br/>
            ðŸ’á <strong>Posición:</strong> X: {Math.round(mesa.posicion?.x || 0)}, Y: {Math.round(mesa.posicion?.y || 0)}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default PropiedadesMesa;

