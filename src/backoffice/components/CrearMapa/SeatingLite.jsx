import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text as KonvaText } from 'react-konva';
import { Button, Space, message, Row, Col, Card } from 'antd';

const SeatingLite = ({ salaId, onSave, onCancel, initialMapa = null }) => {
  const [elements, setElements] = useState(Array.isArray(initialMapa?.contenido) ? initialMapa.contenido : []);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);

  const addMesa = useCallback(() => {
    const mesa = {
      _id: `mesa_${Date.now()}`,
      type: 'mesa',
      posicion: { x: 100 + (elements.length % 5) * 140, y: 120 + Math.floor(elements.length / 5) * 120 },
      width: 120,
      height: 80,
      fill: '#f0f0f0',
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`
    };
    setElements(prev => [...prev, mesa]);
  }, [elements]);

  const addSilla = useCallback(() => {
    const mesa = elements.find(e => e.type === 'mesa');
    const baseX = mesa ? mesa.posicion.x + mesa.width + 20 : 80 + (elements.length % 8) * 40;
    const baseY = mesa ? mesa.posicion.y : 80 + Math.floor(elements.length / 8) * 40;
    const silla = {
      _id: `silla_${Date.now()}`,
      type: 'silla',
      posicion: { x: baseX, y: baseY },
      shape: 'circle',
      radius: 10,
      fill: '#00d6a4',
      state: 'available',
      numero: (elements.filter(e => e.type === 'silla').length + 1)
    };
    setElements(prev => [...prev, silla]);
  }, [elements]);

  const onDragEnd = useCallback((id, x, y) => {
    setElements(prev => prev.map(el => el._id === id ? { ...el, posicion: { x, y } } : el));
  }, []);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el._id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  const handleSaveClick = useCallback(async () => {
    try {
      if (!Array.isArray(elements)) {
        throw new Error('El contenido del mapa debe ser un array');
      }
      const payload = {
        nombre: 'Mapa de Sala',
        descripcion: '',
        estado: 'active',
        contenido: elements
      };
      await onSave(payload);
    } catch (err) {
      message.error(err.message || 'Error al guardar');
    }
  }, [elements, onSave]);

  const renderElement = useCallback((el) => {
    const isSelected = selectedId === el._id;
    const commonProps = {
      key: el._id,
      x: el.posicion.x,
      y: el.posicion.y,
      draggable: true,
      onClick: () => setSelectedId(el._id),
      onDragEnd: (e) => onDragEnd(el._id, e.target.x(), e.target.y())
    };
    if (el.type === 'mesa') {
      return (
        <Group {...commonProps}>
          <Rect width={el.width || 120} height={el.height || 80} fill={el.fill || '#f0f0f0'} stroke={isSelected ? '#1890ff' : '#d9d9d9'} strokeWidth={isSelected ? 3 : 2} />
          <KonvaText text={el.nombre || 'Mesa'} fontSize={14} fill="#333" x={4} y={-18} />
        </Group>
      );
    }
    if (el.type === 'silla') {
      return (
        <Group {...commonProps}>
          <Circle radius={el.radius || 10} fill={el.fill || '#00d6a4'} stroke={isSelected ? '#1890ff' : '#a8aebc'} strokeWidth={isSelected ? 3 : 2} />
          {el.numero ? <KonvaText text={String(el.numero)} fontSize={10} fill="#333" x={-4} y={-4} /> : null}
        </Group>
      );
    }
    return null;
  }, [onDragEnd, selectedId]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <Card size="small" className="mb-2">
        <Row align="middle" gutter={8}>
          <Col>
            <Space size="small">
              <Button onClick={addMesa}>Añadir mesa</Button>
              <Button onClick={addSilla}>Añadir silla</Button>
              <Button onClick={handleDelete} disabled={!selectedId}>Eliminar seleccionado</Button>
              <Button onClick={handleClear}>Limpiar</Button>
            </Space>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space size="small">
              <Button onClick={onCancel}>Cancelar</Button>
              <Button type="primary" onClick={handleSaveClick}>Guardar</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div className="flex-1 bg-white border rounded">
        <Stage ref={stageRef} width={Math.max(1200, window.innerWidth - 80)} height={Math.max(700, window.innerHeight - 240)}>
          <Layer>
            <Rect width={2000} height={1400} fill="#fff" />
            {elements.map(renderElement)}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default SeatingLite;


