import React, { useState } from 'react';

const EditSalaForm = ({ sala, onEditSala, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: sala.nombre
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onEditSala(formData);
  };

  return (
    <div className="edit-sala-form">
      <h3>Editar Sala</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit">Guardar Cambios</button>
          <button type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default EditSalaForm;