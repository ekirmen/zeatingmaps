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
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => (
                <tr key={a._id} className="text-center border-t">
                  <td className="px-4 py-2">{a.user.login}</td>
                  <td className="px-4 py-2 break-all">{`${window.location.origin}/store?ref=${a.user.login}`}</td>
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
