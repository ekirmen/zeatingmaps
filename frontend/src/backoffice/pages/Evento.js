import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events?${queryParams}`, {
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
        estadoVenta: 'a-la-venta',
        descripcionEstado: '',
        estadoPersonalizado: false,
        mostrarDatosComprador: false,
        mostrarDatosBoleto: false,
        datosComprador: {
          nombre: { solicitado: false, obligatorio: false },
          email: { solicitado: false, obligatorio: false },
          telefono: { solicitado: false, obligatorio: false },
          rut: { solicitado: false, obligatorio: false },
          numeroIdentificacionFiscal: { solicitado: false, obligatorio: false },
          direccion: { solicitado: false, obligatorio: false },
          nombreFonetico: { solicitado: false, obligatorio: false },
          apellidosFoneticos: { solicitado: false, obligatorio: false },
          idioma: { solicitado: false, obligatorio: false },
          fechaNacimiento: { solicitado: false, obligatorio: false },
          sexo: { solicitado: false, obligatorio: false },
          empresa: { solicitado: false, obligatorio: false },
          departamento: { solicitado: false, obligatorio: false },
          cargoEmpresa: { solicitado: false, obligatorio: false },
          matricula: { solicitado: false, obligatorio: false },
          twitter: { solicitado: false, obligatorio: false },
          facebook: { solicitado: false, obligatorio: false },
          youtube: { solicitado: false, obligatorio: false },
          tiktok: { solicitado: false, obligatorio: false },
          snapchat: { solicitado: false, obligatorio: false },
          instagram: { solicitado: false, obligatorio: false },
          contactoEmergencia: { solicitado: false, obligatorio: false },
          nacionalidad: { solicitado: false, obligatorio: false }
        },
        datosBoleto: {
          rutTitular: false,
          idPasaporte: false,
          nombreTitular: false,
          verificarEmail: false,
          verificacionEmail: false,
          pregunta1: false,
          pregunta2: false
        },
        otrasOpciones: {
          observacionesEmail: { mostrar: false, texto: '' },
          observacionesCompra: { mostrar: false, texto: '' },
          popupAntesAsiento: { mostrar: false, texto: '' },
          habilitarMetodosPago: false,
          metodosPagoPermitidos: []
        },
        analytics: {
          enabled: false,
          gtmId: '',
          metaPixelId: '',
          metaAccessToken: ''
        }
      });
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala para crear un evento.');
    }
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleEdit = useCallback((eventoId) => {
    const eventoParaEditar = eventos.find((evento) => evento._id === eventoId);
    if (eventoParaEditar) {
      setEventoData({
        datosComprador: {},
        datosBoleto: {},
        mostrarDatosComprador: false,
        mostrarDatosBoleto: false,
        estadoVenta: 'a-la-venta',
        descripcionEstado: '',
        estadoPersonalizado: false,
        ...eventoParaEditar
      });
    }
    setMenuVisible(true);
  }, [eventos]);

  const handleDelete = useCallback(async (eventoId) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventoId}`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      const eventoOriginal = await response.json();
      if (!eventoOriginal) throw new Error('Evento no encontrado');
      const { _id, __v, createdAt, updatedAt, ...eventoDuplicado } = eventoOriginal;
      if (eventoDuplicado.slug) {
        eventoDuplicado.slug = `${eventoDuplicado.slug}-copia-${Date.now()}`;
      }

      const formData = new FormData();
      formData.append('data', JSON.stringify(eventoDuplicado));

      const saveResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
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
      ? `${process.env.REACT_APP_API_URL}/api/events/${eventoData._id}`
      : `${process.env.REACT_APP_API_URL}/api/events`;

    const method = eventoData._id ? 'PUT' : 'POST';

    try {
      const formData = new FormData();

      const imageTypes = [
        'banner', 'obraImagen', 'portada', 'espectaculo',
        'logoHorizontal', 'logoVertical', 'bannerPublicidad',
        'logoCuadrado', 'logoPassbook', 'passBookBanner', 'icono'
      ];

      let imagenesToSend = {};

      if (eventoData.imagenes) {
        imageTypes.forEach(type => {
          const value = eventoData.imagenes[type];
          if (type === 'espectaculo') {
            if (Array.isArray(value)) {
              value.forEach(item => {
                if (item instanceof File) {
                  formData.append(type, item);
                }
              });
              // Keep already uploaded URLs
              const urls = value.filter(item => !(item instanceof File));
              if (urls.length) imagenesToSend[type] = urls;
            }
          } else if (value instanceof File) {
            formData.append(type, value);
          } else if (value) {
            imagenesToSend[type] = value;
          }
        });
      }

      const { imagenes, ...eventDataWithoutImages } = eventoData;
      if (!eventoData.mostrarDatosComprador) {
        delete eventDataWithoutImages.datosComprador;
      }
      if (!eventoData.mostrarDatosBoleto) {
        delete eventDataWithoutImages.datosBoleto;
      }
      const payloadData = { ...eventDataWithoutImages, imagenes: imagenesToSend };
      formData.append('data', JSON.stringify(payloadData));

      setIsUploading(true);
      setUploadProgress(0);

      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${token}` },
        data: formData,
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(progress);
          }
        }
      });

      if (response.status < 200 || response.status >= 300) {
        const data = response.data || {};
        const message = data.errors ? data.errors.join(', ') : data.message;
        throw new Error(message || 'Error al guardar el evento');
      }

      setIsSaved(true);
      setMenuVisible(false);
      fetchEventos();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert(error.message || 'Error al guardar el evento');
    } finally {
      setIsUploading(false);
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
                onClick={handleSave}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                {isUploading ? `Guardando ${uploadProgress}%` : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Evento;
