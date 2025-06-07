import React, { useEffect, useState } from 'react';
import RequireAuth from '../components/RequireAuth';
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
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error("No se pudieron cargar los usuarios", await response.text());
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleCreateUser = async (newUser) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers(prevUsers => [...prevUsers, createdUser]);
        setIsCreating(false);
      } else {
        const errorData = await response.json();
        alert(`Error creating user: ${errorData.message}`);
      }
    } catch (error) {
      alert("Error creating user. Please check console for details.");
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/user/${updatedUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prevUsers =>
          prevUsers.map((user) => (user._id === updatedUser._id ? data : user))
        );
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        alert(`Error updating user: ${errorData.message}`);
      }
    } catch (error) {
      alert("Error updating user. Please check console for details.");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setUsers(prevUsers => prevUsers.filter((user) => user._id !== userId));
          alert('Usuario eliminado correctamente');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No se pudo eliminar el usuario');
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.login && user.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * recordsPerPage;
  const indexOfFirstUser = indexOfLastUser - recordsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <RequireAuth>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {currentUsers.map((user) => (
            <div key={user._id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{user.login}</h3>
                <span className="text-gray-500">{user.email}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-lg">
            Página {currentPage} de {Math.ceil(filteredUsers.length / recordsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / recordsPerPage)))}
            disabled={currentPage >= Math.ceil(filteredUsers.length / recordsPerPage)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>

        {/* Modal para Crear Usuario */}
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

        {/* Modal para Editar Usuario */}
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
    </RequireAuth>
  );
};

export default Usuarios;
