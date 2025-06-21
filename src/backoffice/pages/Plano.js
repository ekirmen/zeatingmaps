import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecintoSala } from '../contexts/RecintoSalaContext';
import { fetchZonasPorSala, createZona, updateZona, deleteZona, fetchMapa } from '../services/apibackoffice';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Plano = () => {
  const { recinto, setRecinto, sala, setSala, recintos, setRecintos } = useRecintoSala();
  const [zonas, setZonas] = useState([]);
  const [zoneSeatCounts, setZoneSeatCounts] = useState({});
  const [nuevaZona, setNuevaZona] = useState({ nombre: '', color: '#000000', aforo: 0, numerada: false });
  const [prevAforo, setPrevAforo] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const numeradaBloqueada = editingZona?.numerada && editingZona.aforo > 0;
  const navigate = useNavigate();

  useEffect(() => {
    const loadRecintos = async () => {
      try {
        const recintosData = await import('../services/apibackoffice').then(mod => mod.fetchRecintos());
        setRecintos(recintosData);
      } catch (error) {
        console.error('Error al cargar recintos:', error);
      }
    };
    loadRecintos();
  }, [setRecintos]);

  useEffect(() => {
    if (!sala) {
      setZonas([]);
      return;
    }
    const loadZonas = async () => {
      try {
        const zonasData = await fetchZonasPorSala(sala.id);
        setZonas(zonasData || []);
      } catch (error) {
        console.error('Error al cargar zonas:', error);
        setZonas([]);
      }
    };
    loadZonas();
  }, [sala]);

  useEffect(() => {
    if (!sala) {
      setZoneSeatCounts({});
      return;
    }
    const loadMapa = async () => {
      try {
        const mapa = await fetchMapa(sala.id);
        const counts = {};
        if (mapa && Array.isArray(mapa.contenido)) {
          mapa.contenido.forEach(el => {
            if (el.type === 'mesa') {
              (el.sillas || []).forEach(s => {
                if (s.zona) counts[s.zona] = (counts[s.zona] || 0) + 1;
              });
            } else if (el.type === 'silla' && el.zona) {
              counts[el.zona] = (counts[el.zona] || 0) + 1;
            }
          });
        }
        setZoneSeatCounts(counts);
      } catch (error) {
        console.error('Error al cargar mapa:', error);
        setZoneSeatCounts({});
      }
    };
    loadMapa();
  }, [sala]);

  const handleCrearZona = async () => {
    if (!sala) return alert('Selecciona una sala.');
    try {
      const nuevaZonaData = { ...nuevaZona, sala_id: sala.id };
      const zonaCreada = await createZona(nuevaZonaData);
      if (zonaCreada) {
        setZonas([...zonas, zonaCreada]);
      }
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (err) {
      console.error('Error al crear zona:', err);
    }
  };

  const handleEditZona = async () => {
    try {
      const zonaData = { ...nuevaZona, sala_id: sala.id };
      const updatedZona = await updateZona(editingZona.id, zonaData);
      if (updatedZona) {
        setZonas(zonas.map(z => z.id === editingZona.id ? updatedZona : z));
      }
      setEditingZona(null);
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (err) {
      console.error('Error al editar zona:', err);
    }
  };

  const handleDeleteZona = async (zonaId) => {
    if (window.confirm('¿Eliminar esta zona?')) {
      try {
        await deleteZona(zonaId);
        setZonas(zonas.filter(z => z.id !== zonaId));
      } catch (err) {
        console.error('Error al eliminar zona:', err);
      }
    }
  };

  const handleNavigateToCrearMapa = () => {
    if (!sala) return alert('Selecciona una sala.');
    navigate(`/dashboard/crear-mapa/${sala.id}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Gestión de Zonas</h1>

        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Recinto:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={recinto?.id || ''}
              onChange={(e) => {
                const r = recintos.find(r => String(r.id) === e.target.value);
                setRecinto(r);
                setSala(null);
              }}
            >
              <option value="">Seleccionar un recinto</option>
              {recintos.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Sala:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={sala?.id || ''}
              onChange={(e) => {
                const s = recinto?.salas?.find(s => String(s.id) === e.target.value);
                setSala(s);
              }}
              disabled={!recinto}
            >
              <option value="">Seleccionar una sala</option>
              {recinto?.salas?.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {!sala ? (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-6">
            Por favor, seleccione un recinto y una sala para gestionar las zonas.
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Zonas de la sala: {sala.nombre}</h2>
            {zonas.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">No hay zonas creadas.</p>
                <button onClick={() => setModalIsOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">Crear Zona</button>
              </div>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {zonas.filter(Boolean).map(z => (
                    <li key={z.id} className="flex justify-between items-center border px-4 py-3 rounded">
                      <div>
                        <span style={{ color: z.color || '#000000' }} className="font-semibold">{z.nombre}</span>
                        <span className="ml-2 text-gray-600">- Aforo: {zoneSeatCounts[z.id] ?? z.aforo}</span>
                      </div>
                      <div className="space-x-2">
                        <button onClick={() => { setEditingZona(z); setNuevaZona(z); setModalIsOpen(true); }} className="text-indigo-600">Editar</button>
                        <button onClick={() => handleDeleteZona(z.id)} className="text-red-600">Eliminar</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setModalIsOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded">Crear Nueva Zona</button>
              </>
            )}
            <div className="mt-6">
              <button onClick={handleNavigateToCrearMapa} className="bg-blue-600 text-white px-5 py-2 rounded">Crear Mapa</button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => { setModalIsOpen(false); setEditingZona(null); setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false }); }}
        contentLabel={editingZona ? "Editar Zona" : "Crear Zona"}
        className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50"
      >
        <h2 className="text-2xl font-semibold mb-4">{editingZona ? 'Editar Zona' : 'Crear Nueva Zona'}</h2>
        <div className="space-y-4">
          <input type="text" value={nuevaZona.nombre} onChange={e => setNuevaZona({ ...nuevaZona, nombre: e.target.value })} placeholder="Nombre" className="w-full border px-3 py-2 rounded" />
          <input type="color" value={nuevaZona.color} onChange={e => setNuevaZona({ ...nuevaZona, color: e.target.value })} className="w-16 h-10 border" />
          <input type="number" value={nuevaZona.aforo} disabled={nuevaZona.numerada} onChange={e => setNuevaZona({ ...nuevaZona, aforo: Number(e.target.value) })} className="w-full border px-3 py-2 rounded" />
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={nuevaZona.numerada} disabled={numeradaBloqueada} onChange={e => {
              const checked = e.target.checked;
              if (checked) {
                setPrevAforo(nuevaZona.aforo);
                setNuevaZona({ ...nuevaZona, numerada: true, aforo: 0 });
              } else {
                setNuevaZona({ ...nuevaZona, numerada: false, aforo: prevAforo });
              }
            }} />
            <span>Numerada</span>
          </label>
          <div className="flex justify-end space-x-3">
            <button onClick={() => { setModalIsOpen(false); setEditingZona(null); setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false }); }} className="px-4 py-2 rounded border">Cancelar</button>
            <button onClick={editingZona ? handleEditZona : handleCrearZona} className="px-4 py-2 bg-indigo-600 text-white rounded">{editingZona ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Plano;
