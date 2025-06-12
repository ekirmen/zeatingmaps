import React, { useEffect, useState } from 'react';
import RequireAuth from '../components/RequireAuth';

const Referidos = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [earnings, setEarnings] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/user', {
          headers: { 'Authorization': token }
        });
        if (!res.ok) throw new Error('Error cargando usuarios');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const token = localStorage.getItem('token');
        const results = await Promise.all(users.map(u =>
          fetch(`http://localhost:5000/api/payments/referrer/${u._id}`, {
            headers: { Authorization: token }
          }).then(res => res.json())
        ));
        const map = {};
        users.forEach((u, i) => {
          map[u._id] = results[i]?.totalCommission || 0;
        });
        setEarnings(map);
      } catch (err) {
        console.error(err);
      }
    };
    if (users.length) fetchEarnings();
  }, [users]);

  const filtered = users.filter(u =>
    u.login && u.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReferrer = (id) => users.find(u => u._id === id)?.login || '';
  const countReferrals = (id) => users.filter(u => u.referredBy === id).length;

  return (
    <RequireAuth>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Referidos</h1>
        <input
          type="text"
          placeholder="Buscar por usuario"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 px-3 py-2 border rounded"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Link</th>
                <th className="px-4 py-2">Referido Por</th>
                <th className="px-4 py-2"># Referidos</th>
                <th className="px-4 py-2">Ganancias</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user._id} className="text-center border-t">
                  <td className="px-4 py-2">{user.login}</td>
                  <td className="px-4 py-2">{user.referralCode}</td>
                  <td className="px-4 py-2 break-all">
                    {`${window.location.origin}/store?ref=${user.referralCode}`}
                  </td>
                  <td className="px-4 py-2">{getReferrer(user.referredBy)}</td>
                  <td className="px-4 py-2">{countReferrals(user._id)}</td>
                  <td className="px-4 py-2">{earnings[user._id]?.toFixed(2) || '0.00'}</td>
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