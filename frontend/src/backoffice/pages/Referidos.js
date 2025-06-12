import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import RequireAuth from '../components/RequireAuth';

const Referidos = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/affiliate-users', {
          headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
        });
        if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAffiliates();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/user/search?term=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addAffiliate = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/affiliate-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setAffiliates(prev => [...prev, data]);
        toast.success('Usuario agregado');
      } else {
        toast.error('Error al guardar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    }
  };

  const deleteAffiliate = async (id) => {
    if (!window.confirm('¿Eliminar afiliado?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/affiliate-users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      if (res.ok) {
        setAffiliates(prev => prev.filter(a => a._id !== id));
        toast.success('Eliminado');
      } else {
        toast.error('Error al eliminar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const editAffiliate = async (id) => {
    const login = prompt('Nuevo usuario login:');
    if (!login) return;
    try {
      const token = localStorage.getItem('token');
      const resSearch = await fetch(`http://localhost:5000/api/user/search?term=${encodeURIComponent(login)}`, {
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      const users = resSearch.ok ? await resSearch.json() : [];
      const user = users[0];
      if (!user) return toast.error('Usuario no encontrado');

      const res = await fetch(`http://localhost:5000/api/affiliate-users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });
      if (res.ok) {
        const data = await res.json();
        setAffiliates(prev => prev.map(a => a._id === id ? data : a));
        toast.success('Actualizado');
      } else {
        toast.error('Error al actualizar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
    }
  };

  return (
    <RequireAuth>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Usuarios</h1>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar usuario"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded grow"
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded">Buscar</button>
        </div>
        <ul className="mb-6">
          {results.map(user => (
            <li key={user._id} className="flex justify-between items-center border-b py-2">
              <span>{user.login}</span>
              <button onClick={() => addAffiliate(user._id)} className="bg-green-600 text-white px-2 py-1 rounded">Agregar</button>
            </li>
          ))}
        </ul>
        <h2 className="text-xl font-semibold mb-2">Lista</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Link</th>
                <th className="px-4 py-2">Compras</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => (
                <tr key={a._id} className="text-center border-t">
                  <td className="px-4 py-2">{a.user.login}</td>
                  <td className="px-4 py-2 break-all">{`${window.location.origin}/store?ref=${a.user.login}`}</td>
                  <td className="px-4 py-2">{a.purchases}</td>
                  <td className="px-4 py-2">{a.total.toFixed(2)}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => editAffiliate(a._id)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAffiliate(a._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
};

export default Referidos;
