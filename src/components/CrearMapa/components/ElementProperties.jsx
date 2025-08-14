import React, { useState } from 'react';
import './ElementProperties.css';

const ElementProperties = ({ element, onUpdate }) => {
  const [properties, setProperties] = useState({
    name: element?.name || '',
    fill: element?.fill || '#4CAF50',
    stroke: element?.stroke || '#2E7D32',
    strokeWidth: element?.strokeWidth || 2,
    opacity: element?.opacity || 0.8,
    rotation: element?.rotation || 0,
    scaleX: element?.scaleX || 1,
    scaleY: element?.scaleY || 1
  });

  const handlePropertyChange = (key, value) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    onUpdate(newProperties);
  };

  if (!element) {
    return (
      <div className="element-properties">
        <h4>📋 PROPIEDADES</h4>
        <div className="no-selection">
          <p>Selecciona un elemento para ver sus propiedades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="element-properties">
      <h4>📋 PROPIEDADES DEL ELEMENTO</h4>
      
      {/* Información básica */}
      <div className="property-section">
        <h5>📝 Información Básica</h5>
        <div className="property-row">
          <label>Nombre:</label>
          <input 
            type="text"
            value={properties.name}
            onChange={(e) => handlePropertyChange('name', e.target.value)}
            placeholder="Nombre del elemento"
          />
        </div>
        <div className="property-row">
          <label>Tipo:</label>
          <span className="property-value">{element.type}</span>
        </div>
        <div className="property-row">
          <label>ID:</label>
          <span className="property-value">{element.id}</span>
        </div>
      </div>
      
      {/* Propiedades de estilo */}
      <div className="property-section">
        <h5>🎨 Estilo</h5>
        <div className="property-row">
          <label>Color de relleno:</label>
          <input 
            type="color"
            value={properties.fill}
            onChange={(e) => handlePropertyChange('fill', e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Color de borde:</label>
          <input 
            type="color"
            value={properties.stroke}
            onChange={(e) => handlePropertyChange('stroke', e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Grosor de borde:</label>
          <input 
            type="range"
            min="0"
            max="10"
            value={properties.strokeWidth}
            onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))}
          />
          <span className="property-value">{properties.strokeWidth}px</span>
        </div>
        <div className="property-row">
          <label>Opacidad:</label>
          <input 
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={properties.opacity}
            onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
          />
          <span className="property-value">{Math.round(properties.opacity * 100)}%</span>
        </div>
      </div>
      
      {/* Propiedades de transformación */}
      <div className="property-section">
        <h5>🔄 Transformación</h5>
        <div className="property-row">
          <label>Rotación:</label>
          <input 
            type="range"
            min="0"
            max="360"
            value={properties.rotation}
            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
          />
          <span className="property-value">{properties.rotation}°</span>
        </div>
        <div className="property-row">
          <label>Escala X:</label>
          <input 
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={properties.scaleX}
            onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value))}
          />
          <span className="property-value">{properties.scaleX}x</span>
        </div>
        <div className="property-row">
          <label>Escala Y:</label>
          <input 
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={properties.scaleY}
            onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value))}
          />
          <span className="property-value">{properties.scaleY}x</span>
        </div>
      </div>
      
      {/* Propiedades específicas del tipo */}
      {element.type === 'rectangular' && (
        <div className="property-section">
          <h5>📐 Dimensiones Rectangulares</h5>
          <div className="property-row">
            <label>Ancho:</label>
            <span className="property-value">{element.width}cm</span>
          </div>
          <div className="property-row">
            <label>Alto:</label>
            <span className="property-value">{element.height}cm</span>
          </div>
        </div>
      )}
      
      {element.type === 'circular' && (
        <div className="property-section">
          <h5>📐 Dimensiones Circulares</h5>
          <div className="property-row">
            <label>Radio:</label>
            <span className="property-value">{element.radius}cm</span>
          </div>
        </div>
      )}
      
      {element.type === 'custom' && (
        <div className="property-section">
          <h5>📐 Puntos Personalizados</h5>
          <div className="property-row">
            <label>Número de puntos:</label>
            <span className="property-value">{element.points?.length || 0}</span>
          </div>
        </div>
      )}
      
      {/* Posición */}
      <div className="property-section">
        <h5>📍 Posición</h5>
        <div className="property-row">
          <label>X:</label>
          <span className="property-value">{element.position?.x || 0}px</span>
        </div>
        <div className="property-row">
          <label>Y:</label>
          <span className="property-value">{element.position?.y || 0}px</span>
        </div>
      </div>
      
      {/* Acciones rápidas */}
      <div className="property-section">
        <h5>⚡ Acciones Rápidas</h5>
        <div className="quick-actions">
          <button 
            className="reset-btn"
            onClick={() => {
              const resetProps = {
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1
              };
              setProperties({ ...properties, ...resetProps });
              onUpdate(resetProps);
            }}
          >
            🔄 Resetear Transformaciones
          </button>
          <button 
            className="center-btn"
            onClick={() => {
              onUpdate({ position: { x: 0, y: 0 } });
            }}
          >
            🎯 Centrar en Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElementProperties;
