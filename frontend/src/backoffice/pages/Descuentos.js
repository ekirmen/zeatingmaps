import React, { useState, useEffect } from 'react';

const Descuentos = () => {
  const [descuentos, setDescuentos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [maxUsos, setMaxUsos] = useState('');
  const [eventos, setEventos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [zoneDetails, setZoneDetails] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDescuentos();
    fetchEventos();
  }, []);

  const fetchDescuentos = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/descuentos`);
      const data = await response.json();
      setDescuentos(data);
    } catch (error) {
      console.error('Error al cargar descuentos:', error);
    }
  };

  const fetchEventos = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events`);
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
        const evRes = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventoId}`);
        const ev = await evRes.json();
        if (ev && ev.sala) {
          const zRes = await fetch(`${process.env.REACT_APP_API_URL}/api/zonas/sala/${ev.sala}`);
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
      const url = editingId ? `${process.env.REACT_APP_API_URL}/api/descuentos/${editingId}` : `${process.env.REACT_APP_API_URL}/api/descuentos`;
      const method = editingId ? 'PUT' : 'POST';
      const detalles = Object.entries(zoneDetails).map(([zonaId, det]) => ({
        zona: zonaId,
        tipo: det.tipo,
        valor: Number(det.cantidad)
      }));
      const body = {
        nombreCodigo: codigo,
        fechaInicio,
        fechaFinal,
        evento: eventoId,
        detalles,
        maxUsos: maxUsos ? Number(maxUsos) : 0
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
    setFechaInicio('');
    setFechaFinal('');
    setEventoId('');
    setMaxUsos('');
    setZoneDetails({});
    setEditingId(null);
  };

  const handleEdit = (descuento) => {
    setCodigo(descuento.nombreCodigo);
    setFechaInicio(descuento.fechaInicio?.slice(0, 10));
    setFechaFinal(descuento.fechaFinal?.slice(0, 10));
    setEventoId(descuento.evento);
    setMaxUsos(descuento.maxUsos ?? '');
    const detalles = {};
    (descuento.detalles || []).forEach(d => {
      const id = typeof d.zona === 'object' ? d.zona._id : d.zona;
      detalles[id] = { tipo: d.tipo, cantidad: d.valor };
    });
    setZoneDetails(detalles);
    setEditingId(descuento._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/descuentos/${id}`, { method: 'DELETE' });
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
    setZoneDetails(prev => {
      if (prev[zonaId]) {
        const { [zonaId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [zonaId]: { tipo: 'monto', cantidad: '' } };
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Descuentos</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 mb-8 space-y-4">
        <div>
          <label className="block mb-1">Código:</label>
          <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required className="w-full border rounded p-2" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Fecha Inicio:</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1">Fecha Final:</label>
            <input type="date" value={fechaFinal} onChange={e => setFechaFinal(e.target.value)} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1">Máximo de Usos:</label>
            <input type="number" value={maxUsos} onChange={e => setMaxUsos(e.target.value)} className="w-full border rounded p-2" />
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
            <div className="space-y-2">
              {zonas.map(z => (
                <div key={z._id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!zoneDetails[z._id]} onChange={() => toggleZona(z._id)} />
                  <span>{z.nombre}</span>
                  {zoneDetails[z._id] && (
                    <>
                      <select
                        value={zoneDetails[z._id].tipo}
                        onChange={e =>
                          setZoneDetails(prev => ({
                            ...prev,
                            [z._id]: { ...prev[z._id], tipo: e.target.value }
                          }))
                        }
                        className="border rounded p-1"
                      >
                        <option value="monto">Monto</option>
                        <option value="porcentaje">Porcentaje</option>
                      </select>
                      <input
                        type="number"
                        value={zoneDetails[z._id].cantidad}
                        onChange={e =>
                          setZoneDetails(prev => ({
                            ...prev,
                            [z._id]: { ...prev[z._id], cantidad: e.target.value }
                          }))
                        }
                        placeholder="Valor"
                        className="w-24 border rounded p-1"
                      />
                    </>
                  )}
                </div>
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
              <th className="py-2 px-4 text-left">Detalles</th>
              <th className="py-2 px-4 text-left">Evento</th>
              <th className="py-2 px-4 text-left">Máx Usos</th>
              <th className="py-2 px-4 text-left">Usados</th>
              <th className="py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {descuentos.map(d => (
              <tr key={d._id} className="border-t">
                <td className="py-2 px-4">{d.nombreCodigo}</td>
                <td className="py-2 px-4">
                  {d.detalles?.map(dt => {
                    const name = dt.zona?.nombre || dt.zona;
                    const val = dt.tipo === 'porcentaje' ? `${dt.valor}%` : dt.valor;
                    return `${name}: ${val}`;
                  }).join(', ')}
                </td>
                <td className="py-2 px-4">{d.evento?.nombre || d.evento}</td>
                <td className="py-2 px-4 text-center">{d.maxUsos || 0}</td>
                <td className="py-2 px-4 text-center">{d.usos || 0}</td>
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
