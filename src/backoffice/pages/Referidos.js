import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../utils/apiBase';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Referidos = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, login: '', base: 0, percentage: 0 });

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/affiliate-users`, {
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
      const res = await fetch(`${API_BASE_URL}/api/user/search?term=${encodeURIComponent(searchTerm)}`, {
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
    const base = parseFloat(prompt('Base', '0')) || 0;
    const percentage = parseFloat(prompt('Porcentaje', '0')) || 0;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/affiliate-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({ userId, base, percentage })
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
      const res = await fetch(`${API_BASE_URL}/api/affiliate-users/${id}`, {
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

  const openEditModal = (affiliate) => {
    setEditForm({
      id: affiliate._id,
      login: affiliate.user.login,
      base: affiliate.base || 0,
      percentage: affiliate.percentage || 0
    });
    setEditModalOpen(true);
  };

  const handleUpdateAffiliate = async () => {
    const { id, login, base, percentage } = editForm;
    try {
      const token = localStorage.getItem('token');
      const resSearch = await fetch(`${API_BASE_URL}/api/user/search?term=${encodeURIComponent(login)}`, {
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      const users = resSearch.ok ? await resSearch.json() : [];
      const user = users[0];
      if (!user) return toast.error('Usuario no encontrado');

      const res = await fetch(`${API_BASE_URL}/api/affiliate-users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id, base, percentage })
      });
      if (res.ok) {
        const data = await res.json();
        setAffiliates(prev => prev.map(a => a._id === id ? data : a));
        toast.success('Actualizado');
        setEditModalOpen(false);
      } else {
        toast.error('Error al actualizar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
    }
  };

  return (
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
                <th className="px-4 py-2">Base</th>
                <th className="px-4 py-2">Porcentaje</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => (
                <tr key={a._id} className="text-center border-t">
                  <td className="px-4 py-2">{a.user.login}</td>
                  <td className="px-4 py-2 break-all">{`${window.location.origin}/store?ref=${a.user.login}`}</td>
                  <td className="px-4 py-2">{a.purchases}</td>
                  <td className="px-4 py-2">{Number(a.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-2">{Number(a.base || 0).toFixed(2)}</td>
                  <td className="px-4 py-2">{Number(a.percentage || 0).toFixed(2)}%</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => openEditModal(a)}
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
        <Modal
          isOpen={editModalOpen}
          onRequestClose={() => setEditModalOpen(false)}
          contentLabel="Editar Afiliado"
          className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-20 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50"
        >
          <h2 className="text-xl font-bold mb-4">Editar Afiliado</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario login</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={editForm.login}
                onChange={e => setEditForm({ ...editForm, login: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={editForm.base}
                onChange={e => setEditForm({ ...editForm, base: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje</label>
              <input
                type="number"
                className="w-full border px-3 py-2 rounded"
                value={editForm.percentage}
                onChange={e => setEditForm({ ...editForm, percentage: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  className="w-full border px-3 py-2 rounded-l"
                  value={`${window.location.origin}/store?ref=${editForm.login}`}
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store?ref=${editForm.login}`)}
                  className="px-3 py-2 bg-gray-200 rounded-r"
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 border rounded"
                onClick={() => setEditModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpdateAffiliate}
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      </div>
  );
};

export default Referidos;
