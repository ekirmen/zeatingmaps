import React, { useState, useEffect } from 'react';
import { NotificationManager } from 'react-notifications';

const EditUserForm = ({ user, onUpdateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    empresa: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        login: user.login,
        email: user.email,
        empresa: user.empresa,
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user._id) {
      NotificationManager.error('Error: Usuario no válido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró el token de autorización');

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      const updatedUser = await response.json();
      onUpdateUser(updatedUser);
      NotificationManager.success('Usuario actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar:', error);
      NotificationManager.error(`Error: ${error.message}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 mt-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">Editar Usuario</h2>

      <div>
        <label className="block text-gray-700 font-semibold mb-1">Login:</label>
        <input
          type="text"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-1">Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-1">Empresa:</label>
        <input
          type="text"
          value={formData.empresa}
          onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
        >
          Actualizar Usuario
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
