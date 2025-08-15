import React, { useState } from 'react';
import { Modal, Radio, Button, Row, Col, Card } from 'antd';
import './SeatmapTypeSelector.css';

const { Option } = Radio;

const SeatmapTypeSelector = ({ visible, onSelect, onCancel }) => {
  const [selectedType, setSelectedType] = useState('ROWS_WITH_SECTIONS');

  const seatmapTypes = [
    {
      id: 'ROWS_WITH_SECTIONS',
      title: 'Filas con secciones',
      description: 'Recintos de tamaño medio y grande, como teatros o estadios',
      icon: '🏟️',
      value: 'ROWS_WITH_SECTIONS'
    },
    {
      id: 'ROWS_WITHOUT_SECTIONS',
      title: 'Filas sin secciones',
      description: 'Recintos pequeños, como pequeños teatros o salas de cine',
      icon: '🎭',
      value: 'ROWS_WITHOUT_SECTIONS'
    },
    {
      id: 'MIXED',
      title: 'Diseño mixto',
      description: 'Todas las herramientas están disponibles (excepto secciones)',
      icon: '🎨',
      value: 'MIXED'
    },
    {
      id: 'TABLES',
      title: 'Mesas',
      description: 'Plano de mesas, por ejemplo para restaurantes',
      icon: '🍽️',
      value: 'TABLES'
    },
    {
      id: 'GENERAL_ADMISSION',
      title: 'Entrada general',
      description: 'Recintos sin asientos, por ejemplo: festivales y conciertos',
      icon: '🎪',
      value: 'GENERAL_ADMISSION'
    }
  ];

  const handleSelect = () => {
    onSelect(selectedType);
  };

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
          🎯 ¿Qué tipo de plano de asientos quieres diseñar?
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      className="seatmap-type-selector-modal"
    >
      <div className="seatmap-type-selector">
        <div className="type-options">
          {seatmapTypes.map((type) => (
            <Card
              key={type.id}
              className={`type-option ${selectedType === type.value ? 'selected' : ''}`}
              onClick={() => setSelectedType(type.value)}
              hoverable
            >
              <div className="type-content">
                <div className="type-icon">{type.icon}</div>
                <div className="type-info">
                  <h4 className="type-title">{type.title}</h4>
                  <p className="type-description">{type.description}</p>
                </div>
                <div className="type-radio">
                  <Radio 
                    checked={selectedType === type.value}
                    onChange={handleTypeChange}
                    value={type.value}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="type-footer">
          <Button 
            type="primary" 
            size="large" 
            onClick={handleSelect}
            className="select-button"
            block
          >
            ✅ Seleccionar y Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SeatmapTypeSelector;
