import React, { useState } from 'react';

const PropiedadesMesa = ({ selectedElement, setElements, setSelectedElement }) => {
  const [nombreMesa, setNombreMesa] = useState(selectedElement.nombre);
  const [rotation, setRotation] = useState(selectedElement.rotation);
  const [width, setWidth] = useState(selectedElement.width);
  const [height, setHeight] = useState(selectedElement.height);
  const [radius, setRadius] = useState(selectedElement.radius);

  const handleUpdateNombre = () => {
    setElements((prev) =>
      prev.map((el) =>
        el._id === selectedElement._id ? { ...el, nombre: nombreMesa } : el
      )
    );
  };

  const handleRotate = (value) => {
    setRotation(value);
    setElements((prev) =>
      prev.map((el) =>
        el._id === selectedElement._id ? { ...el, rotation: value } : el
      )
    );
  };

  const handleResize = (type, value) => {
    if (type === 'width') {
      setWidth(value);
      setElements((prev) =>
        prev.map((el) =>
          el._id === selectedElement._id ? { ...el, width: value } : el
        )
      );
    } else if (type === 'height') {
      setHeight(value);
      setElements((prev) =>
        prev.map((el) =>
          el._id === selectedElement._id ? { ...el, height: value } : el
        )
      );
    } else if (type === 'radius') {
      setRadius(value);
      setElements((prev) =>
        prev.map((el) =>
          el._id === selectedElement._id ? { ...el, radius: value } : el
        )
      );
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: selectedElement.posicion.y + 50,
        left: selectedElement.posicion.x + 50,
        background: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        zIndex: 1000,
      }}
    >
      <h4>Editar Mesa</h4>
      <input
        type="text"
        placeholder="Nombre de la mesa"
        value={nombreMesa}
        onChange={(e) => setNombreMesa(e.target.value)}
      />
      <button onClick={handleUpdateNombre}>Actualizar Nombre</button>
      <div>
        <label>Rotación:</label>
        <input
          type="range"
          min="0"
          max="360"
          value={rotation}
          onChange={(e) => handleRotate(parseInt(e.target.value))}
        />
      </div>
      {selectedElement.type === 'rect' && (
        <>
          <div>
            <label>Ancho:</label>
            <input
              type="number"
              value={width}
              onChange={(e) => handleResize('width', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label>Alto:</label>
            <input
              type="number"
              value={height}
              onChange={(e) => handleResize('height', parseInt(e.target.value))}
            />
          </div>
        </>
      )}
      {selectedElement.type === 'circle' && (
        <div>
          <label>Radio:</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => handleResize('radius', parseInt(e.target.value))}
          />
        </div>
      )}
      <button onClick={() => setSelectedElement(null)}>Cerrar</button>
    </div>
  );
};

export default PropiedadesMesa;