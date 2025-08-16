import React, { useState, useEffect } from 'react';
import { Input, Button, Slider, Space, Typography, Row, Col, Card } from 'antd';
import { RotateRightOutlined, ArrowsAltOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PropiedadesMesa = ({ mesa, onUpdate, onClose }) => {
  const [nombreMesa, setNombreMesa] = useState(mesa?.nombre || '');
  const [rotation, setRotation] = useState(mesa?.rotation || 0);
  const [width, setWidth] = useState(mesa?.width || 120);
  const [height, setHeight] = useState(mesa?.height || 80);
  const [radius, setRadius] = useState(mesa?.radius || 60);

  // Actualizar estado local cuando cambie la mesa
  useEffect(() => {
    if (mesa) {
      setNombreMesa(mesa.nombre || '');
      setRotation(mesa.rotation || 0);
      setWidth(mesa.width || 120);
      setHeight(mesa.height || 80);
      setRadius(mesa.radius || 60);
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

        {/* Rotación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Text strong>Rotación:</Text>
            <Text>{rotation}°</Text>
          </div>
          <Slider
            min={0}
            max={360}
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
                <Input
                  type="number"
                  min={20}
                  max={500}
                  value={width}
                  onChange={(e) => handleResize('width', parseInt(e.target.value) || 20)}
                  suffix="px"
                  className="mt-1"
                />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong>Alto:</Text>
                <Input
                  type="number"
                  min={20}
                  max={500}
                  value={height}
                  onChange={(e) => handleResize('height', parseInt(e.target.value) || 20)}
                  suffix="px"
                  className="mt-1"
                />
              </div>
            </Col>
          </Row>
        ) : (mesa.shape === 'circle' || mesa.type === 'circle') ? (
          <div>
            <Text strong>Radio:</Text>
            <Input
              type="number"
              min={20}
              max={200}
              value={radius}
              onChange={(e) => handleResize('radius', parseInt(e.target.value) || 20)}
              suffix="px"
              className="mt-1"
            />
          </div>
        ) : null}

        {/* Información adicional */}
        <div className="bg-gray-50 p-3 rounded text-xs">
          <Text type="secondary">
            💡 <strong>ID:</strong> {mesa._id}<br/>
            💡 <strong>Tipo:</strong> {mesa.shape || mesa.type}<br/>
            💡 <strong>Posición:</strong> X: {Math.round(mesa.posicion?.x || 0)}, Y: {Math.round(mesa.posicion?.y || 0)}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default PropiedadesMesa;