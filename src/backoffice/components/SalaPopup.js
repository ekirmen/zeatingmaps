// src/components/SalaPopup.js
import React, { useState } from 'react';

const SalaPopup = ({ recintoId, onClose }) => {
  const [newSala, setNewSala] = useState({ nombre: '' });

  const handleCreateSala = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/recintos/${recintoId}/salas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSala),
        }
      );
      const sala = await response.json();
      alert('Sala creada: ' + sala.nombre);
      onClose();  // Cerrar el popup después de crear la sala
    } catch (error) {
      console.error('Error al crear la sala:', error);
    }
  };

  return (
    <div className="popup">
      <h2>Crear Sala</h2>
      <input
        type="text"
        value={newSala.nombre}
        onChange={(e) => setNewSala({ nombre: e.target.value })}
        placeholder="Nombre de la sala"
      />
      <button onClick={handleCreateSala}>Crear Sala</button>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default SalaPopup;
