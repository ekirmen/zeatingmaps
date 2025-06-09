import React, { useState, useEffect, useCallback } from 'react';
import { useRecinto } from '../contexts/RecintoContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faList } from '@fortawesome/free-solid-svg-icons';

const Evento = () => {
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const { recintos, recintoSeleccionado, setRecintoSeleccionado, salaSeleccionada, setSalaSeleccionada } = useRecinto();
  const [eventos, setEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [eventoData, setEventoData] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('datosBasicos');

  const filtrarEventos = useCallback(() => {
    if (!recintoSeleccionado || !salaSeleccionada) return;
    const filtrados = eventos.filter(
      (evento) =>
        evento.recinto === recintoSeleccionado._id && evento.sala === salaSeleccionada._id
    );
    setEventosFiltrados(filtrados);
  }, [recintoSeleccionado, salaSeleccionada, eventos]);

  const fetchEventos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (recintoSeleccionado) queryParams.append('recinto', recintoSeleccionado._id);
      if (salaSeleccionada) queryParams.append('sala', salaSeleccionada._id);
      
      const response = await fetch(`http://localhost:5000/api/events?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Error al cargar eventos');
      }
      const data = await response.json();
      if (Array.isArray(data.eventos)) setEventos(data.eventos);
      else if (Array.isArray(data)) setEventos(data);
      else setEventos([]);
    } catch (error) {
      console.error(error);
      setEventos([]);
    }
  }, [navigate, recintoSeleccionado, salaSeleccionada]);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);
  useEffect(() => { filtrarEventos(); }, [filtrarEventos]);

  const handleRecintoChange = useCallback((e) => {
    const selectedRecintoId = e.target.value;
    const selectedRecinto = recintos.find(r => r._id === selectedRecintoId);
    setRecintoSeleccionado(selectedRecinto);
    setSalaSeleccionada(null);
  }, [recintos, setRecintoSeleccionado, setSalaSeleccionada]);

  const handleSalaChange = useCallback((e) => {
    const salaId = e.target.value;
    const sala = recintoSeleccionado?.salas?.find(s => s._id === salaId) || null;
    setSalaSeleccionada(sala);
  }, [recintoSeleccionado, setSalaSeleccionada]);

  const handleCreateEventClick = useCallback(() => {
    if (recintoSeleccionado && salaSeleccionada) {
      setEventoData({
        nombre: '',
        activo: true,
        oculto: false,
        desactivado: false,
        sector: '',
        recinto: recintoSeleccionado._id,
        sala: salaSeleccionada._id,
      });
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala para crear un evento.');
    }
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleEdit = useCallback((eventoId) => {
    const eventoParaEditar = eventos.find((evento) => evento._id === eventoId);
    setEventoData(eventoParaEditar);
    setMenuVisible(true);
  }, [eventos]);

  const handleDelete = useCallback(async (eventoId) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Error al eliminar el evento.');
      fetchEventos();
    } catch (error) {
      alert('Hubo un problema al eliminar el evento.');
      console.error(error);
    }
  }, [navigate, fetchEventos]);

  const handleDuplicate = useCallback(async (eventoId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventoId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      const eventoOriginal = await response.json();
      if (!eventoOriginal) throw new Error('Evento no encontrado');
      const { _id, ...eventoDuplicado } = eventoOriginal;

      const saveResponse = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoDuplicado),
      });
      if (!saveResponse.ok) throw new Error('Error al duplicar el evento');
      fetchEventos();
    } catch (error) {
      console.error(error);
    }
  }, [navigate, fetchEventos]);

  const handleSave = useCallback(async () => {
    const token = localStorage.getItem('token');
    const url = eventoData._id
      ? `http://localhost:5000/api/events/${eventoData._id}`
      : 'http://localhost:5000/api/events';

    const method = eventoData._id ? 'PUT' : 'POST';

    try {
      const formData = new FormData();

      const imageTypes = [
        'banner', 'obraImagen', 'portada', 'espectaculo',
        'logoHorizontal', 'logoVertical', 'bannerPublicidad',
        'logoCuadrado', 'logoPassbook', 'passBookBanner', 'icono'
      ];

      if (eventoData.imagenes) {
        imageTypes.forEach(type => {
          if (type === 'espectaculo') {
            if (eventoData.imagenes[type]?.length) {
              eventoData.imagenes[type].forEach(file => {
                if (file instanceof File) formData.append(type, file);
              });
            }
          } else if (eventoData.imagenes[type] instanceof File) {
            formData.append(type, eventoData.imagenes[type]);
          }
        });
      }

      const { imagenes, ...eventDataWithoutImages } = eventoData;
      formData.append('data', JSON.stringify(eventDataWithoutImages));

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al guardar el evento');
      }

      setIsSaved(true);
      setMenuVisible(false);
      fetchEventos();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert(error.message || 'Error al guardar el evento');
    }
  }, [eventoData, fetchEventos]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    const results = eventos.filter(e => e.nombre.toLowerCase().includes(term.toLowerCase())).slice(0, 10);
    setSearchResults(results);
  };

  const toggleView = (mode) => setViewMode(mode);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Gestión de Eventos</h2>

      <div className="flex items-center gap-4 mb-4">
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={recintoSeleccionado ? recintoSeleccionado._id : ''}
          onChange={handleRecintoChange}
        >
          <option value="">Seleccionar Recinto</option>
          {recintos.map(recinto => (
            <option key={recinto._id} value={recinto._id}>
              {recinto.nombre}
            </option>
          ))}
        </select>

        {recintoSeleccionado && (
          <select
            className="border border-gray-300 rounded px-3 py-2"
            value={salaSeleccionada ? salaSeleccionada._id : ''}
            onChange={handleSalaChange}
          >
            <option value="">Seleccionar Sala</option>
            {recintoSeleccionado.salas.map(sala => (
              <option key={sala._id} value={sala._id}>
                {sala.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => toggleView('list')}
          className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          title="Vista Lista"
        >
          <FontAwesomeIcon icon={faList} />
        </button>
        <button
          onClick={() => toggleView('grid')}
          className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          title="Vista Cuadrícula"
        >
          <FontAwesomeIcon icon={faThLarge} />
        </button>

        <input
          type="text"
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="ml-auto px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleCreateEventClick}
          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Crear Evento
        </button>
      </div>

      {searchTerm && (
        <ul className="mb-4 max-h-48 overflow-auto border border-gray-300 rounded bg-white shadow-sm">
          {searchResults.length === 0 && (
            <li className="p-2 text-gray-500">No se encontraron resultados.</li>
          )}
          {searchResults.map(evento => (
            <li
              key={evento._id}
              className="p-2 cursor-pointer hover:bg-blue-100"
              onClick={() => {
                setEventoData(evento);
                setMenuVisible(true);
                setSearchTerm('');
                setSearchResults([]);
              }}
            >
              {evento.nombre}
            </li>
          ))}
        </ul>
      )}

      {!menuVisible && (
        <div>
          {viewMode === 'list' ? (
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 border border-gray-300">Nombre</th>
                  <th className="p-3 border border-gray-300">Activo</th>
                  <th className="p-3 border border-gray-300">Oculto</th>
                  <th className="p-3 border border-gray-300">Desactivado</th>
                  <th className="p-3 border border-gray-300">Sector</th>
                  <th className="p-3 border border-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventosFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-4 text-gray-500">No hay eventos disponibles.</td></tr>
                ) : (
                  eventosFiltrados.map(evento => (
                    <tr key={evento._id} className="border-t border-gray-300 hover:bg-gray-100">
                      <td className="p-3">{evento.nombre}</td>
                      <td className="p-3">{evento.activo ? 'Sí' : 'No'}</td>
                      <td className="p-3">{evento.oculto ? 'Sí' : 'No'}</td>
                      <td className="p-3">{evento.desactivado ? 'Sí' : 'No'}</td>
                      <td className="p-3">{evento.sector || '-'}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleEdit(evento._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(evento._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => handleDuplicate(evento._id)}
                          className="text-green-600 hover:text-green-800"
                          title="Duplicar"
                        >
                          Duplicar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {eventosFiltrados.length === 0 && (
                <p className="col-span-full text-center text-gray-500">No hay eventos disponibles.</p>
              )}
              {eventosFiltrados.map(evento => (
                <div key={evento._id} className="border border-gray-300 rounded p-4 shadow hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">{evento.nombre}</h3>
                  <p><strong>Activo:</strong> {evento.activo ? 'Sí' : 'No'}</p>
                  <p><strong>Oculto:</strong> {evento.oculto ? 'Sí' : 'No'}</p>
                  <p><strong>Desactivado:</strong> {evento.desactivado ? 'Sí' : 'No'}</p>
                  <p><strong>Sector:</strong> {evento.sector || '-'}</p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => handleEdit(evento._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(evento._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => handleDuplicate(evento._id)}
                      className="text-green-600 hover:text-green-800"
                      title="Duplicar"
                    >
                      Duplicar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {menuVisible && eventoData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setMenuVisible(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              title="Cerrar"
            >
              &times;
            </button>

            <h3 className="text-2xl font-semibold mb-4">{eventoData._id ? 'Editar Evento' : 'Crear Evento'}</h3>

            <div className="mb-4">
              <label className="block font-medium mb-1" htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={eventoData.nombre}
                onChange={(e) => setEventoData({ ...eventoData, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventoData.activo}
                  onChange={(e) => setEventoData({ ...eventoData, activo: e.target.checked })}
                  className="form-checkbox"
                />
                Activo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventoData.oculto}
                  onChange={(e) => setEventoData({ ...eventoData, oculto: e.target.checked })}
                  className="form-checkbox"
                />
                Oculto
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventoData.desactivado}
                  onChange={(e) => setEventoData({ ...eventoData, desactivado: e.target.checked })}
                  className="form-checkbox"
                />
                Desactivado
              </label>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1" htmlFor="sector">Sector</label>
              <input
                id="sector"
                type="text"
                value={eventoData.sector || ''}
                onChange={(e) => setEventoData({ ...eventoData, sector: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Aquí podrías añadir más campos o subir imágenes como en el original */}

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setMenuVisible(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>

            {isSaved && (
              <p className="mt-4 text-green-600 font-semibold">¡Evento guardado con éxito!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Evento;
