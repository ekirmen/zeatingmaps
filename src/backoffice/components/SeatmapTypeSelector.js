import React, { useState } from 'react';
import { Radio, Button } from 'antd';

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

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '2rem'
        }}>
          🎯 ¿Qué tipo de plano de asientos quieres diseñar?
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          {seatmapTypes.map((type) => (
            <div
              key={type.id}
              style={{
                border: `2px solid ${selectedType === type.value ? '#667eea' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                backgroundColor: selectedType === type.value ? '#f0f4ff' : 'white',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setSelectedType(type.value)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  fontSize: '3rem',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selectedType === type.value ? '#667eea' : '#f8fafc',
                  borderRadius: '50%',
                  border: `2px solid ${selectedType === type.value ? '#667eea' : '#e2e8f0'}`,
                  color: selectedType === type.value ? 'white' : 'black'
                }}>
                  {type.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {type.title}
                  </h4>
                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}>
                    {type.description}
                  </p>
                </div>
                <Radio
                  checked={selectedType === type.value}
                  onChange={handleTypeChange}
                  value={type.value}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleSelect}
            style={{
              height: '3.5rem',
              fontSize: '1.125rem',
              fontWeight: '700',
              borderRadius: '12px',
              backgroundColor: '#667eea',
              border: 'none',
              padding: '0 2rem'
            }}
          >
            ✅ Seleccionar y Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatmapTypeSelector;
