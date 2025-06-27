// CreateUserForm.js
import React, { useState } from 'react';
import { supabaseAdmin as supabase } from '../services/supabaseClient';

const CreateUserForm = ({ onCreateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    login: '',
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: userResponse, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { password_set: !!formData.password },
      });

      if (error) throw error;

      // Esperar un poco para que el trigger inserte en profiles
      await new Promise((res) => setTimeout(res, 1500));

      // Actualizamos los datos del perfil usando el ID del usuario recién creado
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          login: formData.login,
          nombre: formData.nombre,
          apellido: formData.apellido,
          empresa: formData.empresa,
          telefono: formData.telefono,
          permisos: { role: 'usuario' },
        })
        .eq('id', userResponse.user.id);

      if (profileError) throw profileError;

      // Obtener el nuevo perfil
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userResponse.user.id)
        .single();

      onCreateUser(newProfile);
    } catch (err) {
      console.error('Error al crear usuario:', err);
      alert('Error al crear usuario: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {['login', 'nombre', 'apellido', 'empresa', 'telefono', 'email', 'password'].map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 capitalize">{field}:</label>
          <input
            type={field === 'password' ? 'password' : 'text'}
            required={['email', 'password', 'login'].includes(field)}
            value={formData[field]}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">
          Cancelar
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Crear Usuario
        </button>
      </div>
    </form>
  );
};

export default CreateUserForm;
