// EditUserForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const EditUserForm = ({ user, onUpdateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    login: '',
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        login: user.login || '',
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        empresa: user.tenant_id || user.empresa || '',
        telefono: user.telefono || '',
      });
    }
  }, [user]);

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const { empresa, ...rest } = formData;
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...rest, tenant_id: empresa })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar el perfil del usuario');

      onUpdateUser(data);
    } catch (err) {
      console.error('Error al actualizar el perfil:', err.message);
      alert('Error al actualizar el perfil: ' + err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 mt-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">Editar Perfil</h2>

      {['login', 'nombre', 'apellido', 'empresa', 'telefono'].map(field => (
        <div key={field}>
          <label className="block text-gray-700 font-semibold mb-1 capitalize">{field}:</label>
          <input
            type="text"
            value={formData[field]}
            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      <div className="flex justify-between mt-6">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
        >
          Actualizar
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
