import React, { useState } from 'react';
import { useFooter } from '../../contexts/FooterContext';

const WebFooter = () => {
  const { footer, updateFooter } = useFooter();
  const [text, setText] = useState(footer?.copyrightText || '');

  const handleSave = () => {
    updateFooter({ copyrightText: text });
    alert('Pie de página guardado');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Pie de página</h2>
      <label className="block text-sm font-medium mb-1">Texto copyright</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        maxLength={100}
        value={text}
        onChange={e => setText(e.target.value)}
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

export default WebFooter;
