import React, { useState } from 'react';
import './ShapeBuilder.css';

const ShapeBuilder = ({ 
  onShapeComplete, 
  gridSize, 
  points, 
  setPoints, 
  isDrawing, 
  setIsDrawing 
}) => {
  const [shapeType, setShapeType] = useState('custom');
  const [shapeConfig, setShapeConfig] = useState({
    width: 120,
    height: 80,
    radius: 60,
    fill: '#4CAF50',
    stroke: '#2E7D32',
    strokeWidth: 2,
    opacity: 0.8
  });

  const shapeTypes = {
    custom: {
      icon: '✏️',
      label: 'Forma Personalizable',
      description: 'Crear con puntos libres'
    },
    rectangular: {
      icon: '🟦',
      label: 'Rectangular',
      description: 'Ancho x Largo configurable'
    },
    circular: {
      icon: '🟡',
      label: 'Circular',
      description: 'Radio personalizable'
    },
    oval: {
      icon: '🟨',
      label: 'Oval',
      description: 'Ancho x Largo'
    }
  };

  const handleStartDrawing = () => {
    if (shapeType === 'custom') {
      setIsDrawing(true);
      setPoints([]);
    } else {
      createPredefinedShape();
    }
  };

  const createPredefinedShape = () => {
    let shape;
    
    switch (shapeType) {
      case 'rectangular':
        shape = {
          id: Date.now(),
          type: 'rectangular',
          width: shapeConfig.width,
          height: shapeConfig.height,
          fill: shapeConfig.fill,
          stroke: shapeConfig.stroke,
          strokeWidth: shapeConfig.strokeWidth,
          opacity: shapeConfig.opacity,
          position: { x: 100, y: 100 }
        };
        break;
        
      case 'circular':
        shape = {
          id: Date.now(),
          type: 'circular',
          radius: shapeConfig.radius,
          fill: shapeConfig.fill,
          stroke: shapeConfig.stroke,
          strokeWidth: shapeConfig.strokeWidth,
          opacity: shapeConfig.opacity,
          position: { x: 100, y: 100 }
        };
        break;
        
      case 'oval':
        shape = {
          id: Date.now(),
          type: 'oval',
          width: shapeConfig.width,
          height: shapeConfig.height,
          fill: shapeConfig.fill,
          stroke: shapeConfig.stroke,
          strokeWidth: shapeConfig.strokeWidth,
          opacity: shapeConfig.opacity,
          position: { x: 100, y: 100 }
        };
        break;
        
      default:
        return;
    }
    
    onShapeComplete(shape);
  };

  const clearPoints = () => {
    setPoints([]);
    setIsDrawing(false);
  };

  const createCustomShape = () => {
    if (points.length >= 3) {
      const shape = {
        id: Date.now(),
        type: 'custom',
        points: points,
        fill: shapeConfig.fill,
        stroke: shapeConfig.stroke,
        strokeWidth: shapeConfig.strokeWidth,
        opacity: shapeConfig.opacity,
        position: { x: 0, y: 0 }
      };
      
      onShapeComplete(shape);
      setPoints([]);
      setIsDrawing(false);
    }
  };

  const updateShapeConfig = (key, value) => {
    setShapeConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="shape-builder">
      <h4>✏️ CREAR SHAPE PERSONALIZADO</h4>
      
      {/* Selector de tipo de shape */}
      <div className="shape-type-selector">
        {Object.entries(shapeTypes).map(([type, config]) => (
          <button 
            key={type}
            className={`shape-type-btn ${shapeType === type ? 'active' : ''}`}
            onClick={() => setShapeType(type)}
          >
            <span className="shape-icon">{config.icon}</span>
            <div className="shape-info">
              <div className="shape-label">{config.label}</div>
              <div className="shape-description">{config.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Configuración específica del tipo */}
      {shapeType === 'rectangular' && (
        <div className="shape-config">
          <h5>📐 Configuración Rectangular</h5>
          <div className="config-row">
            <label>Ancho (cm):</label>
            <input 
              type="number" 
              value={shapeConfig.width}
              onChange={(e) => updateShapeConfig('width', parseInt(e.target.value))}
              min="20"
              max="500"
            />
          </div>
          <div className="config-row">
            <label>Largo (cm):</label>
            <input 
              type="number" 
              value={shapeConfig.height}
              onChange={(e) => updateShapeConfig('height', parseInt(e.target.value))}
              min="20"
              max="500"
            />
          </div>
        </div>
      )}
      
      {shapeType === 'circular' && (
        <div className="shape-config">
          <h5>📐 Configuración Circular</h5>
          <div className="config-row">
            <label>Radio (cm):</label>
            <input 
              type="number" 
              value={shapeConfig.radius}
              onChange={(e) => updateShapeConfig('radius', parseInt(e.target.value))}
              min="20"
              max="200"
            />
          </div>
        </div>
      )}
      
      {shapeType === 'oval' && (
        <div className="shape-config">
          <h5>📐 Configuración Oval</h5>
          <div className="config-row">
            <label>Ancho (cm):</label>
            <input 
              type="number" 
              value={shapeConfig.width}
              onChange={(e) => updateShapeConfig('width', parseInt(e.target.value))}
              min="20"
              max="500"
            />
          </div>
          <div className="config-row">
            <label>Largo (cm):</label>
            <input 
              type="number" 
              value={shapeConfig.height}
              onChange={(e) => updateShapeConfig('height', parseInt(e.target.value))}
              min="20"
              max="500"
            />
          </div>
        </div>
      )}
      
      {/* Configuración de estilo */}
      <div className="style-config">
        <h5>🎨 Estilo del Shape</h5>
        <div className="config-row">
          <label>Color de relleno:</label>
          <input 
            type="color" 
            value={shapeConfig.fill}
            onChange={(e) => updateShapeConfig('fill', e.target.value)}
          />
        </div>
        <div className="config-row">
          <label>Color de borde:</label>
          <input 
            type="color" 
            value={shapeConfig.stroke}
            onChange={(e) => updateShapeConfig('stroke', e.target.value)}
          />
        </div>
        <div className="config-row">
          <label>Grosor de borde:</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={shapeConfig.strokeWidth}
            onChange={(e) => updateShapeConfig('strokeWidth', parseInt(e.target.value))}
          />
          <span>{shapeConfig.strokeWidth}px</span>
        </div>
        <div className="config-row">
          <label>Opacidad:</label>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1"
            value={shapeConfig.opacity}
            onChange={(e) => updateShapeConfig('opacity', parseFloat(e.target.value))}
          />
          <span>{Math.round(shapeConfig.opacity * 100)}%</span>
        </div>
      </div>
      
      {/* Controles de dibujo */}
      <div className="drawing-controls">
        {shapeType === 'custom' ? (
          <>
            <div className="builder-instructions">
              <h5>📋 Instrucciones para Shape Personalizado</h5>
              <ol>
                <li>Haz clic en "Empezar a Dibujar"</li>
                <li>Haz clic en el canvas para añadir puntos</li>
                <li>Los puntos se conectarán automáticamente</li>
                <li>El último punto se unirá al primero</li>
                <li>Mínimo 3 puntos para crear el shape</li>
              </ol>
            </div>
            
            <div className="control-buttons">
              <button 
                className={`start-btn ${isDrawing ? 'active' : ''}`}
                onClick={handleStartDrawing}
              >
                {isDrawing ? '🛑 Detener Dibujo' : '✏️ Empezar a Dibujar'}
              </button>
              
              <button 
                className="clear-btn"
                onClick={clearPoints}
                disabled={points.length === 0}
              >
                🗑️ Limpiar Puntos
              </button>
              
              <button 
                className="create-btn"
                onClick={createCustomShape}
                disabled={points.length < 3}
              >
                ✅ Crear Shape ({points.length} puntos)
              </button>
            </div>
            
            <div className="points-info">
              <div className="points-count">
                <span className="label">Puntos actuales:</span>
                <span className={`count ${points.length < 3 ? 'warning' : 'success'}`}>
                  {points.length}
                </span>
              </div>
              
              {points.length < 3 && (
                <div className="warning-message">
                  ⚠️ Necesitas al menos 3 puntos para crear un shape
                </div>
              )}
              
              {points.length >= 3 && (
                <div className="success-message">
                  ✅ Puedes crear el shape ahora
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="predefined-controls">
            <button 
              className="create-btn"
              onClick={createPredefinedShape}
            >
              ✅ Crear {shapeTypes[shapeType].label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShapeBuilder;
