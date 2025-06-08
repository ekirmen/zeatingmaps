import React from 'react';

const EditPopup = ({ element, zoom = 1, onNameChange, onSizeChange, onDelete, onClose }) => {
  if (!element) return null;

  const posX = element.posicion?.x || 0;
  const posY = element.posicion?.y || 0;

  const style = {
    position: 'absolute',
    top: posY * zoom + 40,
    left: posX * zoom + 40,
    background: 'white',
    border: '1px solid #ccc',
    padding: '8px',
    borderRadius: '4px',
    zIndex: 1000,
  };

  return (
    <div style={style}>
      <div>
        <label className="block text-sm">Nombre:</label>
        <input
          type="text"
          value={element.nombre || ''}
          onChange={(e) => onNameChange(element._id, e.target.value)}
          className="border p-1 rounded"
        />
      </div>
      {element.type === 'mesa' && (
        <>
          <div>
            <label className="block text-sm">Ancho:</label>
            <input
              type="number"
              value={element.width || 0}
              onChange={(e) => onSizeChange(element._id, parseInt(e.target.value, 10), element.height)}
              className="border p-1 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Alto:</label>
            <input
              type="number"
              value={element.height || 0}
              onChange={(e) => onSizeChange(element._id, element.width, parseInt(e.target.value, 10))}
              className="border p-1 rounded"
            />
          </div>
        </>
      )}
      <div className="mt-2 flex gap-2">
        <button onClick={onDelete} className="bg-red-600 text-white px-2 rounded">Eliminar</button>
        <button onClick={onClose} className="bg-gray-300 px-2 rounded">Cerrar</button>
      </div>
    </div>
  );
};

export default EditPopup;
