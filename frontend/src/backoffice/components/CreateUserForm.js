// CreateUserForm.js
import React, { useState } from 'react';

const CreateUserForm = ({ onCreateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    telefono: '',
    perfil: '',
    empresa: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          permisos: {}
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario');
      }

      const data = await response.json();
      onCreateUser(data);
      alert('Usuario creado con éxito');
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      alert(`Error al crear el usuario: ${error.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Crear Nuevo Usuario</h2>
      <div>
        <label>
          Login:
          <input
            type="text"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Contraseña:
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Email:
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Teléfono:
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Perfil:
          <input
            type="text"
            value={formData.perfil}
            onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Empresa:
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          />
        </label>
      </div>
      <button className="submit-button">Crear Usuario</button>
      <button className="delete-button" type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default CreateUserForm;
