// src/components/AddSalaForm.js
import React, { useState } from 'react';

const AddSalaForm = ({ onAddSala, onCancel, recintoId }) => {
  const [nombre, setNombre] = useState('');

  const handleSubmit = e => {
    e.preventDefault();

    // Importante: usar la clave 'recinto' tal como está definida en tu tabla SQL
    onAddSala({ nombre, recinto_id: recintoId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre de la sala:</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Agregar Sala
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default AddSalaForm;
