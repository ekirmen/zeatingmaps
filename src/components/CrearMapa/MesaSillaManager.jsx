import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, InputNumber, Select, Row, Col, Card } from '../../utils/antdComponents';
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const MesaSillaManager = ({
  visible,
  onClose,
  mesa,
  onAddSillas,
  onRemoveSillas
}) => {
  const [sillasConfig, setSillasConfig] = useState({
    rect: { top: 0, right: 0, bottom: 0, left: 0 },
    circle: { cantidad: 8, radio: 80 },
    hexagon: { lados: [0, 0, 0, 0, 0, 0] },
    star: { puntos: [0, 0, 0, 0, 0] }
  });

  useEffect(() => {
    if (mesa && visible) {
      // Cargar configuraci³n existente si la mesa ya tiene sillas
      if (mesa.sillasConfig) {
        setSillasConfig(mesa.sillasConfig);
      }
    }
  }, [mesa, visible]);

  const getSillaConfigForType = (type) => {
    switch (type) {
      case 'rect':
        return (
          <div className="space-y-4">
            <Title level={5}>Sillas por lado</Title>
            <Row gutter={16}>
              <Col span={6}>
                <div className="text-center">
                  <Text strong>Arriba</Text>
                  <InputNumber
                    min={0}
                    max={20}
                    value={sillasConfig.rect.top}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      rect: { ...prev.rect, top: value || 0 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Text strong>Derecha</Text>
                  <InputNumber
                    min={0}
                    max={20}
                    value={sillasConfig.rect.right}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      rect: { ...prev.rect, right: value || 0 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Text strong>Abajo</Text>
                  <InputNumber
                    min={0}
                    max={20}
                    value={sillasConfig.rect.bottom}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      rect: { ...prev.rect, bottom: value || 0 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <Text strong>Izquierda</Text>
                  <InputNumber
                    min={0}
                    max={20}
                    value={sillasConfig.rect.left}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      rect: { ...prev.rect, left: value || 0 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
            </Row>
          </div>
        );

      case 'circle':
        return (
          <div className="space-y-4">
            <Title level={5}>Sillas circulares</Title>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong>Cantidad de sillas:</Text>
                  <InputNumber
                    min={1}
                    max={24}
                    value={sillasConfig.circle.cantidad}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      circle: { ...prev.circle, cantidad: value || 8 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Radio (px):</Text>
                  <InputNumber
                    min={40}
                    max={200}
                    value={sillasConfig.circle.radio}
                    onChange={(value) => setSillasConfig(prev => ({
                      ...prev,
                      circle: { ...prev.circle, radio: value || 80 }
                    }))}
                    className="w-full mt-2"
                  />
                </div>
              </Col>
            </Row>
          </div>
        );

      case 'hexagon':
        return (
          <div className="space-y-4">
            <Title level={5}>Sillas por lado del hex¡gono</Title>
            <Row gutter={8}>
              {[0, 1, 2, 3, 4, 5].map((lado) => (
                <Col span={4} key={lado}>
                  <div className="text-center">
                    <Text strong>Lado {lado + 1}</Text>
                    <InputNumber
                      min={0}
                      max={10}
                      value={sillasConfig.hexagon.lados[lado]}
                      onChange={(value) => {
                        const newLados = [...sillasConfig.hexagon.lados];
                        newLados[lado] = value || 0;
                        setSillasConfig(prev => ({
                          ...prev,
                          hexagon: { ...prev.hexagon, lados: newLados }
                        }));
                      }}
                      className="w-full mt-2"
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );

      case 'star':
        return (
          <div className="space-y-4">
            <Title level={5}>Sillas por punto de la estrella</Title>
            <Row gutter={8}>
              {[0, 1, 2, 3, 4].map((punto) => (
                <Col span={4} key={punto}>
                  <div className="text-center">
                    <Text strong>Punto {punto + 1}</Text>
                    <InputNumber
                      min={0}
                      max={8}
                      value={sillasConfig.star.puntos[punto]}
                      onChange={(value) => {
                        const newPuntos = [...sillasConfig.star.puntos];
                        newPuntos[punto] = value || 0;
                        setSillasConfig(prev => ({
                          ...prev,
                          star: { ...prev.star, puntos: newPuntos }
                        }));
                      }}
                      className="w-full mt-2"
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        );

      default:
        return <Text>Tipo de mesa no soportado</Text>;
    }
  };

  const handleAddSillas = () => {
    if (onAddSillas) {
      onAddSillas(mesa._id, sillasConfig);
    }
    onClose();
  };

  const handleRemoveSillas = () => {
    if (onRemoveSillas) {
      onRemoveSillas(mesa._id);
    }
    onClose();
  };

  const getTotalSillas = () => {
    switch (mesa?.shape || mesa?.type) {
      case 'rect':
        return (sillasConfig?.rect && typeof sillasConfig.rect === 'object' ? Object.values(sillasConfig.rect).reduce((sum, val) => sum + (val || 0), 0) : 0);
      case 'circle':
        return sillasConfig?.circle?.cantidad || 0;
      case 'hexagon':
        return (sillasConfig?.hexagon?.lados && Array.isArray(sillasConfig.hexagon.lados) ? sillasConfig.hexagon.lados.reduce((sum, val) => sum + (val || 0), 0) : 0);
      case 'star':
        return (sillasConfig?.star?.puntos && Array.isArray(sillasConfig.star.puntos) ? sillasConfig.star.puntos.reduce((sum, val) => sum + (val || 0), 0) : 0);
      default:
        return 0;
    }
  };

  if (!mesa) return null;

  return (
    <Modal
      title={`Gestionar Sillas - ${mesa.nombre || 'Mesa'}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="remove"
          danger
          onClick={handleRemoveSillas}
          disabled={getTotalSillas() === 0}
        >
          <DeleteOutlined />
          Remover Sillas
        </Button>,
        <Button
          key="add"
          type="primary"
          onClick={handleAddSillas}
          disabled={getTotalSillas() === 0}
        >
          <PlusOutlined />
          Agregar {getTotalSillas()} Sillas
        </Button>
      ]}
      width={600}
    >
      <div className="space-y-6">
        <Card size="small">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Tipo de Mesa: </Text>
              <Text>{mesa.shape || mesa.type}</Text>
            </div>
            <div>
              <Text strong>Total Sillas: </Text>
              <Text type="primary" className="text-lg font-bold">
                {getTotalSillas()}
              </Text>
            </div>
          </div>
        </Card>

        {getSillaConfigForType(mesa.shape || mesa.type)}

        <div className="bg-gray-50 p-3 rounded">
          <Text type="secondary" className="text-sm">
            ðŸ’¡ Las sillas se colocar¡n autom¡ticamente alrededor de la mesa segºn la configuraci³n.
            {mesa.shape === 'circle' && ' Para mesas circulares, las sillas se distribuyen uniformemente.'}
            {mesa.shape === 'hexagon' && ' Para mesas hexagonales, las sillas se colocan en cada lado.'}
            {mesa.shape === 'star' && ' Para mesas en forma de estrella, las sillas se colocan en cada punto.'}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default MesaSillaManager;


