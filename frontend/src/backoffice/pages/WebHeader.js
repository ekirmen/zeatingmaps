import React, { useState } from 'react';
import { useHeader } from '../../contexts/HeaderContext';

const WebHeader = () => {
  const { header, updateHeader } = useHeader();
  const [icon, setIcon] = useState(header?.logoIcon || '🎟️');

  const handleSave = () => {
    updateHeader({ logoIcon: icon });
    alert('Cabecera guardada');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cabecera</h2>
      <label className="block text-sm font-medium mb-1">Icono</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        maxLength={10}
        value={icon}
        onChange={e => setIcon(e.target.value)}
      />
      <div className="mt-6 text-right">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default WebHeader;
