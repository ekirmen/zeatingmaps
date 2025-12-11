import React from 'react';


  if (!element) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded space-y-2">
        <label className="block text-sm">Fila/Mesa:</label>
        <input
          type="text"
          value={element.fila || ''}
          onChange={(e) => onChange(element._id, 'fila', e.target.value)}
          className="border p-1 rounded w-40"
        />
        <div className="text-right">
          <button onClick={onClose} className="mt-2 px-2 bg-gray-300 rounded">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default FilaPopup;
