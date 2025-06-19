import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { supabase } from '../services/supabaseClient';

Modal.setAppElement('#root');

const PlantillaPrecios = () => {
  const [recintos, setRecintos] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [zonas, setZonas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [nombrePlantilla, setNombrePlantilla] = useState('');
  const [detallesPrecios, setDetallesPrecios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [recinto, setRecinto] = useState(null);
  const [sala, setSala] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [editingPlantilla, setEditingPlantilla] = useState(null);

  /* ------------------------- CARGAR RECINTOS ------------------------- */
  useEffect(() => {
    const fetchRecintos = async () => {
      const { data, error } = await supabase.from('recintos').select('*, salas(*)');
      if (!error) {
        setRecintos(data || []);
      }
    };
    fetchRecintos();
  }, []);

  /* ------------------------- ACTUALIZAR SALAS ------------------------ */
  useEffect(() => {
    if (recinto) setSalas(recinto.salas || []);
  }, [recinto]);

  /* -------------------------- CARGAR ZONAS --------------------------- */
  useEffect(() => {
    if (!sala) return;
    const fetchZonas = async () => {
      const { data, error } = await supabase.from('zonas').select('*').eq('sala_id', sala.id);
      if (!error) setZonas(data || []);
    };
    fetchZonas();
  }, [sala]);

  /* ------------------------- CARGAR ENTRADAS ------------------------- */
  useEffect(() => {
    if (!recinto) return;
    const fetchEntradas = async () => {
      const { data, error } = await supabase.from('entradas').select('*').eq('recinto', recinto.id);
      setEntradas(!error ? data : []);
    };
    fetchEntradas();
  }, [recinto]);

  /* ------------------------ CARGAR PLANTILLAS ------------------------ */
  const cargarPlantillas = useCallback(async () => {
    if (!recinto || !sala) return;
    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .eq('recinto', recinto.id)
      .eq('sala', sala.id);
    setPlantillas(!error ? data : []);
  }, [recinto, sala]);

  useEffect(() => {
    cargarPlantillas();
  }, [cargarPlantillas]);

  /* -------------------- HANDLERS INPUTS DETALLE --------------------- */
  const handleInputChange = (zonaId, productoId, field, value) => {
    const updated = [...detallesPrecios];
    const idx = updated.findIndex(d => d.zonaId === zonaId && d.productoId === productoId);
    const numeric = ['precio', 'comision', 'precioGeneral', 'orden'];
    let v = numeric.includes(field) ? Number(value) : value;
    if (numeric.includes(field) && v < 0) v = 0;

    if (idx !== -1) {
      if (value === '') delete updated[idx][field];
      else updated[idx] = { ...updated[idx], [field]: v };
    } else if (value !== '') {
      updated.push({ zonaId, productoId, [field]: v });
    }

    setDetallesPrecios(updated);
  };

  /* ----------------------- SUBMIT PLANTILLA ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const detallesValidos = detallesPrecios.filter(d => d.precio !== undefined);
    if (!detallesValidos.length) {
      alert('Debe asignar al menos un precio');
      return;
    }
    const payload = {
      nombre: nombrePlantilla,
      recinto: recinto.id,
      sala: sala.id,
      detalles: detallesValidos,
    };

    let res;
    if (editingPlantilla) {
      res = await supabase.from('plantillas').update(payload).eq('id', editingPlantilla.id);
    } else {
      res = await supabase.from('plantillas').insert(payload);
    }

    if (res.error) alert(res.error.message);
    else {
      alert(editingPlantilla ? 'Actualizada' : 'Creada');
      closeModal();
      cargarPlantillas();
    }
  };

  /* ------------------------- EDITAR/ELIMINAR ------------------------ */
  const handleEditPlantilla = (p) => {
    setEditingPlantilla(p);
    setNombrePlantilla(p.nombre);
    setDetallesPrecios(p.detalles);
    setModalIsOpen(true);
  };

  const handleDeletePlantilla = async (id) => {
    if (!window.confirm('¿Eliminar plantilla?')) return;
    const { error } = await supabase.from('plantillas').delete().eq('id', id);
    if (!error) setPlantillas(plantillas.filter(p => p.id !== id));
  };

  /* ------------------- UTILS PARA RENDER TABLA ---------------------- */
  const combinedItems = zonas.flatMap(z => entradas.map(e => ({ zonaId: z.id, zona: z.nombre, producto: e.producto, productoId: e.id })));
  const currentItems = combinedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const closeModal = () => {
    setModalIsOpen(false);
    setEditingPlantilla(null);
    setNombrePlantilla('');
    setDetallesPrecios([]);
  };

  const renderTableRows = () => {
    if (!zonas.length || !entradas.length) return (
      <tr><td colSpan="7" className="py-4 text-center">Debes crear zonas y entradas</td></tr>
    );

    return currentItems.map((item, idx) => {
      const detalle = detallesPrecios.find(d => d.zonaId === item.zonaId && d.productoId === item.productoId) || {};
      return (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="px-6 py-3">{item.zona}</td>
          <td className="px-6 py-3">{item.producto}</td>
          {['precio', 'comision', 'precioGeneral'].map(f => (
            <td key={f} className="px-6 py-3"><input type="number" className="w-full border px-2 py-1" value={detalle[f] ?? ''} onChange={e => handleInputChange(item.zonaId, item.productoId, f, e.target.value)} /></td>
          ))}
          <td className="px-6 py-3"><input type="text" className="w-full border px-2 py-1" value={detalle.canales ?? ''} onChange={e => handleInputChange(item.zonaId, item.productoId, 'canales', e.target.value)} /></td>
          <td className="px-6 py-3"><input type="number" className="w-full border px-2 py-1" value={detalle.orden ?? ''} onChange={e => handleInputChange(item.zonaId, item.productoId, 'orden', e.target.value)} /></td>
        </tr>
      );
    });
  };

  /* ------------------------------ UI ------------------------------- */
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Plantilla de Precios</h2>
      <div className="bg-white p-6 rounded shadow">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select className="border p-2 flex-1" value={recinto?.id || ''} onChange={e => { const r = recintos.find(r => r.id === e.target.value); setRecinto(r); setSala(null);} }>
            <option value="">Seleccionar Recinto</option>
            {recintos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          {salas.length > 0 && (
            <select className="border p-2 flex-1" value={sala?.id || ''} onChange={e => setSala(salas.find(s => s.id === e.target.value))}>
              <option value="">Seleccionar Sala</option>
              {salas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          )}
          <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={!recinto || !sala} onClick={() => setModalIsOpen(true)}>Añadir Plantilla</button>
        </div>

        <h3 className="font-semibold mb-2">Plantillas Guardadas</h3>
        {!plantillas.length ? <p className="italic text-gray-500">No hay plantillas</p> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantillas.map(p => (
              <div key={p.id} className="border rounded shadow-sm">
                <div className="bg-gray-50 p-3 font-medium">{p.nombre}</div>
                <div className="p-3 text-sm text-gray-600">Zonas: {p.detalles?.length || 0}</div>
                <div className="flex justify-end gap-2 p-3 bg-gray-50">
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEditPlantilla(p)}>Editar</button>
                  <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDeletePlantilla(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal" overlayClassName="modal-overlay">
        <div className="bg-white p-6 rounded shadow max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{editingPlantilla ? 'Editar' : 'Crear'} Plantilla</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" className="border p-2 w-full" placeholder="Nombre" value={nombrePlantilla} onChange={e => setNombrePlantilla(e.target.value)} required />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Zona','Producto','Precio','Comisión','Precio Gen','Canales','Orden'].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="border px-4 py-2" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingPlantilla ? 'Actualizar' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </Modal>

      <style>{`
        .modal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:1200px;background:transparent;border:none;outline:none;}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:1000}
      `}</style>
    </div>
  );
};

export default PlantillaPrecios;
