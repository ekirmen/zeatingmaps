import React, { useEffect, useState } from 'react';
import { fetchAbonosByUser, createAbono } from '../../services/abonoService';

const Abonos = () => {
  const [userId, setUserId] = useState('');
  const [seatId, setSeatId] = useState('');
  const [packageType, setPackageType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [abonos, setAbonos] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setAbonos([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const data = await fetchAbonosByUser(userId, token);
        setAbonos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading abonos', err);
        setAbonos([]);
      }
    };
    load();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await createAbono(
        {
          usuario_id: userId,
          seat_id: seatId,
          package_type: packageType,
          start_date: startDate,
          end_date: endDate,
        },
        token,
      );
      setSeatId('');
      setPackageType('');
      setStartDate('');
      setEndDate('');
      const data = await fetchAbonosByUser(userId, token);
      setAbonos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Create abono error', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gestión de Abonos</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 space-y-4 mb-6">
        <div>
          <label className="block mb-1">Usuario ID</label>
          <input className="border p-2 w-full" value={userId} onChange={e => setUserId(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Seat ID</label>
          <input className="border p-2 w-full" value={seatId} onChange={e => setSeatId(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Tipo de Paquete</label>
          <input className="border p-2 w-full" value={packageType} onChange={e => setPackageType(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Fecha Inicio</label>
          <input type="date" className="border p-2 w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Fecha Fin</label>
          <input type="date" className="border p-2 w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Crear Abono</button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Abonos del Usuario</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Seat</th>
            <th className="py-2 px-4 text-left">Tipo</th>
            <th className="py-2 px-4 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {abonos.map(a => (
            <tr key={a._id} className="border-t">
              <td className="py-2 px-4">{a.seat?.nombre || a.seat}</td>
              <td className="py-2 px-4">{a.packageType}</td>
              <td className="py-2 px-4">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Abonos;
