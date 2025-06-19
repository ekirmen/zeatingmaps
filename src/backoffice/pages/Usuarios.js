import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // asegúrate de tener esto configurado
import CreateUserForm from '../components/CreateUserForm';
import EditUserForm from '../components/edituserform';

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Error al cargar usuarios:', error.message);
    else setUsers(data);
  };

  const handleCreateUser = async (newUser) => {
    const { data, error } = await supabase.from('users').insert(newUser).single();
    if (error) {
      alert(`Error al crear usuario: ${error.message}`);
    } else {
      setUsers(prev => [...prev, data]);
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    const { data, error } = await supabase
      .from('users')
      .update(updatedUser)
      .eq('id', updatedUser.id)
      .select()
      .single();
    if (error) {
      alert(`Error al actualizar usuario: ${error.message}`);
    } else {
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? data : u)));
      setEditingUser(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      alert(`Error al eliminar usuario: ${error.message}`);
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const filteredUsers = users.filter(u =>
    u.login?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastUser = currentPage * recordsPerPage;
  const indexOfFirstUser = indexOfLastUser - recordsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500"
          />
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentUsers.map(user => (
          <div key={user.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">{user.login}</h3>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(user)}
                className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage >= Math.ceil(filteredUsers.length / recordsPerPage)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Usuario</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>
            <CreateUserForm
              onCreateUser={handleCreateUser}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Usuario</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>
            <EditUserForm
              user={editingUser}
              onUpdateUser={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
