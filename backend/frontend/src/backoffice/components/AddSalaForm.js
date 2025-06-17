import React, { useState } from 'react';

const AddSalaForm = ({ onAddSala, onCancel, recintoId }) => {
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Llamar a onAddSala, pasando tanto el nombre como el recintoId
    onAddSala({ nombre, recintoId });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Nombre de la sala:</label>
      <input 
        type="text" 
        value={nombre} 
        onChange={(e) => setNombre(e.target.value)} 
        required 
      />
      
      <button type="submit">Agregar Sala</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default AddSalaForm;

