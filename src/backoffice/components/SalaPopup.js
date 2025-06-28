// src/components/SalaPopup.js
import React, { useState } from 'react';
// Use the shared Supabase client to avoid creating multiple instances
import { supabase } from '../services/supabaseClient';

const SalaPopup = ({ recintoId, onClose }) => {
  const [newSala, setNewSala] = useState({ nombre: '' });

  const handleCreateSala = async () => {
    try {
      const { data, error } = await supabase
        .from('salas')
        .insert([{ nombre: newSala.nombre, recinto_id: recintoId }]);

      if (error) throw error;

      alert('Sala creada: ' + data[0].nombre);
      onClose();
    } catch (error) {
      console.error('Error al crear la sala:', error.message);
      alert('Error al crear la sala');
    }
  };

  return (
    <div className="popup bg-white p-4 rounded shadow max-w-sm mx-auto">
      <h2 className="text-lg font-semibold mb-2">Crear Sala</h2>
      <input
        type="text"
        className="w-full border p-2 mb-2"
        value={newSala.nombre}
        onChange={(e) => setNewSala({ nombre: e.target.value })}
        placeholder="Nombre de la sala"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreateSala}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crear Sala
        </button>
        <button
          onClick={onClose}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default SalaPopup;
