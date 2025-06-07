import React, { useState, useEffect } from 'react';

const EditRecintoForm = ({ recinto, onEditRecinto, onCancel }) => {  // Changed from onUpdateRecinto to onEditRecinto
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    capacidad: '',
  });

  useEffect(() => {
    if (recinto) {
      setFormData({
        nombre: recinto.nombre,
        direccion: recinto.direccion,
        capacidad: recinto.capacidad,
      });
    }
  }, [recinto]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:5000/api/recintos/${recinto._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
      }

      const updatedRecinto = await response.json();
      onEditRecinto(updatedRecinto);  // Changed from onUpdateRecinto to onEditRecinto
      alert('Recinto actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar el recinto:', error);
      alert(`Error al actualizar el recinto: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Editar Recinto</h2>
      <div>
        <label>
          Nombre:
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Dirección:
          <input
            type="text"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Capacidad:
          <input
            type="number"
            value={formData.capacidad}
            onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
          />
        </label>
      </div>
      <button type="submit">Actualizar Recinto</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default EditRecintoForm;
