// src/components/CreateRecintoForm.js
import React, { useState } from 'react';

const CreateRecintoForm = ({ onCreateRecinto, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateRecinto({ nombre, direccion, capacidad });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Nombre del recinto:</label>
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

      <label>Dirección:</label>
      <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required />

      <label>Capacidad:</label>
      <input type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} required />

      <button type="submit">Crear</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default CreateRecintoForm;
