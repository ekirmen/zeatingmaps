import React, { useState, useEffect } from 'react';

const AdvancedEditPopup = ({
  element,
  zoom = 1,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  position = { x: 0, y: 0 },
}) => {
  const [localValues, setLocalValues] = useState({});

  useEffect(() => {
    if (element) {
      setLocalValues({
        width: element.width || 120,
        height: element.height || 80,
        radius: element.radius || 60,
        rotation: element.rotation || 0,
        strokeWidth: element.strokeWidth || 2,
        strokeColor: element.strokeColor || '#000000',
        fillColor: element.fillColor || '#ffffff',
        numSillas: element.numSillas || 4,
        openSpaces: element.openSpaces || 0,
        curve: element.curve || 0,
      });
    }
  }, [element]);

  if (!element) return null;

  const handleSliderChange = (property, value) => {
    const newValues = { ...localValues, [property]: value };
    setLocalValues(newValues);
    onUpdate(element._id, property, value);
  };

  const handleInputChange = (property, value) => {
    const newValues = { ...localValues, [property]: value };
    setLocalValues(newValues);
    onUpdate(element._id, property, value);
  };

  const handleDuplicate = () => {
    onDuplicate(element);
  };

  const handleDelete = () => {
    onDelete(element._id);
  };

  const style = {
    position: 'absolute',
    top: position.y * zoom + 40,
    left: position.x * zoom + 40,
    background: 'white',
    border: '1px solid #ccc',
    padding: '16px',
    borderRadius: '8px',
    zIndex: 1000,
    minWidth: '280px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const renderSlider = (property, label, min, max, step = 1) => (
    <div className="control mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="sliderLabel text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{localValues[property]}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValues[property] || 0}
        onChange={e => handleSliderChange(property, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const renderColorPicker = (property, label) => (
    <div className="control mb-3">
      <span className="sliderLabel text-sm font-medium text-gray-700 mb-2 block">{label}</span>
      <input
        type="color"
        value={localValues[property] || '#000000'}
        onChange={e => handleInputChange(property, e.target.value)}
        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
      />
    </div>
  );

  const renderInput = (property, label, type = 'number', min = 0, max = 1000) => (
    <div className="control mb-3">
      <span className="sliderLabel text-sm font-medium text-gray-700 mb-2 block">{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        value={localValues[property] || 0}
        onChange={e => handleInputChange(property, parseFloat(e.target.value) || 0)}
        className="w-full p-2 border border-gray-300 rounded text-sm"
      />
    </div>
  );

  const renderActionButton = (icon, label, onClick, color = 'gray') => (
    <button
      onClick={onClick}
      className={`control hoverEffect p-2 rounded text-sm transition-colors hover:bg-${color}-100 flex items-center space-x-2 w-full`}
    >
      <div className="icon-wrapper">
        <i className={icon}></i>
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="seatsIoTooltip" style={style}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-semibold text-gray-800">
            {element.type === 'mesa' ? 'Mesa' : element.type === 'silla' ? 'Silla' : 'Elemento'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        {/* Contenido específico según el tipo de elemento */}
        {element.type === 'mesa' && (
          <>
            {/* Para mesas redondas */}
            {element.shape === 'circle' && (
              <>
                <div className="control mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="sliderLabel text-sm font-medium text-gray-700">Sillas</span>
                    <span className="text-sm text-gray-600">{localValues.numSillas}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={localValues.numSillas || 4}
                    onChange={e => handleSliderChange('numSillas', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="control mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="sliderLabel text-sm font-medium text-gray-700">
                      Abrir espacios
                    </span>
                    <span className="text-sm text-gray-600">{localValues.openSpaces}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={localValues.numSillas || 4}
                    step={1}
                    value={localValues.openSpaces || 0}
                    onChange={e => handleSliderChange('openSpaces', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {renderSlider('radius', 'Radio', 20, 200)}
                {renderSlider('rotation', 'Rotación', 0, 360, 5)}
              </>
            )}

            {/* Para mesas rectangulares */}
            {element.shape === 'rect' && (
              <>
                <div className="control mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="sliderLabel text-sm font-medium text-gray-700">Sillas</span>
                    <span className="text-sm text-gray-600">{localValues.numSillas}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    step={1}
                    value={localValues.numSillas || 4}
                    onChange={e => handleSliderChange('numSillas', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {renderInput('width', 'Ancho', 'number', 20, 500)}
                {renderInput('height', 'Altura', 'number', 20, 500)}
                {renderSlider('rotation', 'Rotación', 0, 360, 5)}
              </>
            )}
          </>
        )}

        {/* Para filas de asientos */}
        {element.type === 'fila' && (
          <>
            {renderActionButton('fas fa-arrows-alt-h', 'Voltear horizontalmente', () => {})}
            {renderActionButton('fas fa-arrows-alt-v', 'Voltear verticalmente', () => {})}
            {renderSlider('curve', 'Curva', 0, 100)}
          </>
        )}

        {/* Para secciones */}
        {element.type === 'seccion' && (
          <>
            <div className="control mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del sector
              </label>
              <input
                type="text"
                placeholder="Label"
                value={localValues.nombre || ''}
                onChange={e => handleInputChange('nombre', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
            {renderSlider('labelSize', 'Tamaño de etiqueta', 10, 100)}
            {renderSlider('labelRotation', 'Rotar etiqueta', 0, 360, 5)}
            {renderActionButton('fas fa-plus', 'Crear nuevo punto', () => {})}
            {renderActionButton('fas fa-minus', 'Borrar punto', () => {})}
            <button className="control edit-section-content-button w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              <i className="fas fa-edit mr-2"></i>Editar sección
            </button>
          </>
        )}

        {/* Para formas */}
        {element.type === 'rect' || element.type === 'ellipse' ? (
          <>
            {renderSlider('strokeWidth', 'Anchura del borde', 0, 20)}
            {renderColorPicker('strokeColor', 'Color del borde')}
            {renderColorPicker('fillColor', 'Color de relleno')}
          </>
        ) : null}

        {/* Acciones comunes */}
        <div className="border-t pt-3 space-y-2">
          {renderActionButton('fas fa-copy', 'Duplicar', handleDuplicate, 'blue')}
          {renderActionButton('fas fa-trash', 'Eliminar', handleDelete, 'red')}
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditPopup;
