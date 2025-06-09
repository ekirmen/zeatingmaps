import React, { useState, useEffect, useCallback } from 'react';
import { useRecinto } from '../contexts/RecintoContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faList } from '@fortawesome/free-solid-svg-icons';
import DatosBasicos from '../components/Evento/DatosBasicos';
import DisenoEspectaculo from '../components/Evento//DisenoEspectaculo';
import ConfiguracionVenta from '../components/Evento/ConfiguracionVenta';
import ConfiguracionBoletas from '../components/Evento/ConfiguracionBoletas';
import OpcionesAvanzadas from '../components/Evento/OpcionesAvanzadas';
import EventsList from '../components/Evento/EventsList';
import SearchBar from '../components/Evento/SearchBar';
import VenueSelectors from '../components/Evento/VenueSelectors';
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
        fecha: '',
        activo: true,
        oculto: false,
        desactivado: false,
        sector: '',
        recinto: recintoSeleccionado._id,
        sala: salaSeleccionada._id,
        otrasOpciones: {
          observacionesEmail: { mostrar: false, texto: '' },
          observacionesCompra: { mostrar: false, texto: '' },
          popupAntesAsiento: { mostrar: false, texto: '' },
          metodosPagoPermitidos: []
        }
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


  const tabs = [
    { id: 'datosBasicos', label: 'Datos Básicos', Component: DatosBasicos },
    { id: 'disenoEspectaculo', label: 'Diseño del Espectáculo', Component: DisenoEspectaculo },
    { id: 'configuracionVenta', label: 'Configuración de Venta', Component: ConfiguracionVenta },
    { id: 'configuracionBoletas', label: 'Configuración de Boletas', Component: ConfiguracionBoletas },
    { id: 'opcionesAvanzadas', label: 'Opciones Avanzadas', Component: OpcionesAvanzadas }
  ];
    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.Component || null;

  return (
    <div className="p-6 space-y-4">
      <VenueSelectors
        recintos={recintos}
        recintoSeleccionado={recintoSeleccionado}
        handleRecintoChange={handleRecintoChange}
        salaSeleccionada={salaSeleccionada}
        setSalaSeleccionada={setSalaSeleccionada}
      />

      <div className="flex justify-between items-center">
        <SearchBar
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          searchResults={searchResults}
          handleEdit={handleEdit}
        />
        <div className="flex items-center gap-2">
          <button onClick={() => toggleView('grid')} className={`${viewMode === 'grid' ? 'text-blue-600' : ''}`}>
            <FontAwesomeIcon icon={faThLarge} />
          </button>
          <button onClick={() => toggleView('list')} className={`${viewMode === 'list' ? 'text-blue-600' : ''}`}>
            <FontAwesomeIcon icon={faList} />
          </button>
          <button
            onClick={handleCreateEventClick}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Crear Evento
          </button>
        </div>
      </div>

      <EventsList
        eventosFiltrados={eventosFiltrados}
        viewMode={viewMode}
        recintoSeleccionado={recintoSeleccionado}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleDuplicate={handleDuplicate}
      />

      {menuVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Configuración de Evento</h2>
              <button
                onClick={() => setMenuVisible(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex border-b bg-gray-100 px-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {ActiveComponent && (
                <ActiveComponent eventoData={eventoData} setEventoData={setEventoData} />
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setMenuVisible(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => console.log('Guardar evento', eventoData)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Evento;
