import React, { useState, useEffect } from 'react';

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [eventos, setEventos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [selectedZonas, setSelectedZonas] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDescuentos();
    fetchEventos();
  }, []);

  const fetchDescuentos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/descuentos');
      const data = await response.json();
      setDescuentos(data);
    } catch (error) {
      console.error('Error al cargar descuentos:', error);
    }
  };

  const fetchEventos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      const data = await response.json();
      setEventos(data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  useEffect(() => {
    const loadZonas = async () => {
      if (!eventoId) return setZonas([]);
      try {
        const evRes = await fetch(`http://localhost:5000/api/events/${eventoId}`);
        const ev = await evRes.json();
        if (ev && ev.sala) {
          const zRes = await fetch(`http://localhost:5000/api/zonas/sala/${ev.sala}`);
          const zData = await zRes.json();
          setZonas(Array.isArray(zData) ? zData : []);
        }
      } catch (error) {
        console.error('Error al cargar zonas:', error);
        setZonas([]);
      }
    };
    loadZonas();
  }, [eventoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `http://localhost:5000/api/descuentos/${editingId}` : 'http://localhost:5000/api/descuentos';
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        nombreCodigo: codigo,
        cantidad: Number(cantidad),
        fechaInicio,
        fechaFinal,
        evento: eventoId,
        zonas: selectedZonas
      };
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        await fetchDescuentos();
        resetForm();
        alert(editingId ? 'Descuento actualizado' : 'Descuento creado');
      } else {
        const data = await response.json();
        alert(data.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error en la operación');
    }
  };

  const resetForm = () => {
    setCodigo('');
    setCantidad('');
    setFechaInicio('');
    setFechaFinal('');
    setEventoId('');
    setSelectedZonas([]);
    setEditingId(null);
  };

  const handleEdit = (descuento) => {
    setCodigo(descuento.nombreCodigo);
    setCantidad(descuento.cantidad);
    setFechaInicio(descuento.fechaInicio?.slice(0,10));
    setFechaFinal(descuento.fechaFinal?.slice(0,10));
    setEventoId(descuento.evento);
    setSelectedZonas(descuento.zonas || []);
    setEditingId(descuento._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/descuentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDescuentos();
      } else {
        const data = await res.json();
        alert(data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleZona = (zonaId) => {
    setSelectedZonas(prev => prev.includes(zonaId) ? prev.filter(z => z !== zonaId) : [...prev, zonaId]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Descuentos</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 mb-8 space-y-4">
        <div>
          <label className="block mb-1">Código:</label>
          <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block mb-1">Cantidad:</label>
          <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} required className="w-full border rounded p-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Fecha Inicio:</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1">Fecha Final:</label>
            <input type="date" value={fechaFinal} onChange={e => setFechaFinal(e.target.value)} required className="w-full border rounded p-2" />
          </div>
        </div>
        <div>
          <label className="block mb-1">Evento:</label>
          <select value={eventoId} onChange={e => setEventoId(e.target.value)} className="w-full border rounded p-2" required>
            <option value="">Seleccione evento</option>
            {eventos.map(ev => (
              <option key={ev._id} value={ev._id}>{ev.nombre}</option>
            ))}
          </select>
        </div>
        {zonas.length > 0 && (
          <div>
            <label className="block mb-1">Zonas:</label>
            <div className="flex flex-wrap gap-2">
              {zonas.map(z => (
                <label key={z._id} className="flex items-center gap-1">
                  <input type="checkbox" value={z._id} checked={selectedZonas.includes(z._id)} onChange={() => toggleZona(z._id)} />
                  {z.nombre}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Lista de Descuentos</h2>
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Código</th>
              <th className="py-2 px-4 text-left">Cantidad</th>
              <th className="py-2 px-4 text-left">Evento</th>
              <th className="py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {descuentos.map(d => (
              <tr key={d._id} className="border-t">
                <td className="py-2 px-4">{d.nombreCodigo}</td>
                <td className="py-2 px-4">{d.cantidad}</td>
                <td className="py-2 px-4">{d.evento?.nombre || d.evento}</td>
                <td className="py-2 px-4 space-x-2">
                  <button onClick={() => handleEdit(d)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Editar</button>
                  <button onClick={() => handleDelete(d._id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Descuentos;
