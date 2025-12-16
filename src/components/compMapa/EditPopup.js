import React from 'react';

export default function EditPopup({ element, zoom = 1, onNameChange = () => {}, onSizeChange = () => {}, onDelete = () => {}, onClose = () => {} }) {
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
    <div className="seatsIoTooltip" style={style}>
      <div>
        <div className="control">
          <label className="block text-sm">Nombre:</label>
          <input
            type="text"
            value={element.nombre || ''}
            onChange={(e) => onNameChange(element._id, 'nombre', e.target.value)}
            className="border p-1 rounded"
          />
        </div>
        {element.type === 'mesa' && (
          <>
            <div className="control">
              <span className="sliderLabel">Ancho</span>
              <input
                type="number"
                value={element.width || 0}
                onChange={(e) => onSizeChange(element._id, parseInt(e.target.value, 10), element.height)}
                className="border p-1 rounded w-20"
              />
            </div>
            <div className="control">
              <span className="sliderLabel">Alto</span>
              <input
                type="number"
                value={element.height || 0}
                onChange={(e) => onSizeChange(element._id, element.width, parseInt(e.target.value, 10))}
                className="border p-1 rounded w-20"
              />
            </div>
          </>
        )}
        <div className="control hoverEffect mt-2 flex gap-2">
          <button onClick={onDelete} className="bg-red-600 text-white px-2 rounded">Eliminar</button>
          <button onClick={onClose} className="bg-gray-300 px-2 rounded">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
