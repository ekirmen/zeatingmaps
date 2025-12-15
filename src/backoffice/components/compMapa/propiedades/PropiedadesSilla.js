import React, { useState } from 'react';

const PropiedadesSilla = ({ selectedElement, setElements, setSelectedElement }) => {
  const [nombreSilla, setNombreSilla] = useState(selectedElement.nombre);

  const handleUpdateNombre = () => {
    setElements(prev =>
      prev.map(el => ({
        ...el,
        sillas: el.sillas.map(silla =>
          silla._id === selectedElement._id ? { ...silla, nombre: nombreSilla } : silla
        ),
      }))
    );
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
      <h4>Editar Silla</h4>
      <input
        type="text"
        placeholder="Nombre de la silla"
        value={nombreSilla}
        onChange={e => setNombreSilla(e.target.value)}
      />
      <button onClick={handleUpdateNombre}>Actualizar Nombre</button>
      <button onClick={() => setSelectedElement(null)}>Cerrar</button>
    </div>
  );
};

export default PropiedadesSilla;
