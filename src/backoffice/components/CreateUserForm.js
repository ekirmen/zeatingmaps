// CreateUserForm.js
import React, { useState } from 'react';
import { supabaseAdmin as supabase } from '../../supabaseClient';

const CreateUserForm = ({ onCreateUser, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    login: '',
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
    permisos: { role: 'usuario' }
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

      // Asignar recintos automáticamente si el usuario es administrador
      if (formData.permisos?.role === 'administrador' || formData.permisos?.role === 'super_administrador') {
        try {
          // Obtener todos los recintos disponibles
          const { data: recintos, error: recintosError } = await supabase
            .from('recintos')
            .select('id');
          
          if (recintosError) {
            console.warn('No se pudieron obtener recintos para asignar:', recintosError);
          } else if (recintos && recintos.length > 0) {
            // Crear registros en recintos_usuario para cada recinto
            const recintosUsuario = recintos.map(recinto => ({
              usuario_id: userResponse.user.id,
              recinto_id: recinto.id,
              permisos: { role: 'administrador' }
            }));

            const { error: asignacionError } = await supabase
              .from('recintos_usuario')
              .upsert(recintosUsuario, { onConflict: 'usuario_id,recinto_id' });

            if (asignacionError) {
              console.warn('Error al asignar recintos al usuario:', asignacionError);
            } else {
              console.log(`✅ ${recintos.length} recintos asignados automáticamente al usuario administrador`);
            }
          }
        } catch (error) {
          console.warn('Error en asignación automática de recintos:', error);
        }
      }

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
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Rol:</label>
        <select
          value={formData.permisos?.role || 'usuario'}
          onChange={(e) => setFormData({ 
            ...formData, 
            permisos: { ...formData.permisos, role: e.target.value } 
          })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="usuario">Usuario</option>
          <option value="administrador">Administrador</option>
          <option value="super_administrador">Super Administrador</option>
        </select>
      </div>
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
