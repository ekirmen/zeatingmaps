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
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import { v4 as uuidv4 } from 'uuid';

// Bucket where event related images are stored
const rawEventBucket = process.env.REACT_APP_EVENT_BUCKET || 'eventos';
const EVENT_BUCKET = rawEventBucket.replace(/^\/+|\/+$/g, '');
// Optional subdirectory inside the bucket
const rawEventFolder = process.env.REACT_APP_EVENT_FOLDER || '';
const EVENT_FOLDER = rawEventFolder.replace(/^\/+|\/+$/g, '');

const Evento = () => {
  const { currentTenant } = useTenant();
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
  // Keep track of original images when editing so we can delete replaced files
  const [originalImages, setOriginalImages] = useState({});

  const filtrarEventos = useCallback(() => {
    if (!recintoSeleccionado || !salaSeleccionada) return;
    const filtrados = eventos.filter(
      (evento) =>
        evento.recinto === recintoSeleccionado.id && evento.sala === salaSeleccionada.id
    );
    setEventosFiltrados(filtrados);
  }, [recintoSeleccionado, salaSeleccionada, eventos]);

  const fetchEventos = useCallback(async () => {
    if (!recintoSeleccionado || !salaSeleccionada) {
      console.log('No recinto or sala selected');
      return;
    }
  
    try {
      console.log('Fetching eventos for recinto:', recintoSeleccionado.id, 'sala:', salaSeleccionada.id);
      
      let query = supabase
        .from('eventos')
        .select('*')
        .eq('recinto', recintoSeleccionado.id)
        .eq('sala', salaSeleccionada.id);
      
      // Filtrar por tenant_id si está disponible
      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
        console.log('🔍 Filtrando por tenant_id:', currentTenant.id);
      } else {
        console.warn('⚠️ No hay tenant disponible para filtrar eventos');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching eventos:', error);
        throw error;
      }
      
      console.log('✅ Eventos cargados:', data?.length || 0, 'eventos');
      setEventos(data || []);
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      setEventos([]);
    }
  }, [recintoSeleccionado, salaSeleccionada, currentTenant]);
  

  useEffect(() => { fetchEventos(); }, [fetchEventos]);
  useEffect(() => { filtrarEventos(); }, [filtrarEventos]);

  const handleRecintoChange = useCallback(
    (e) => {
      const selectedRecintoId = e.target.value;
      const selectedRecinto = recintos.find(
        (r) => String(r.id) === String(selectedRecintoId)
      );
      setRecintoSeleccionado(selectedRecinto);
      setSalaSeleccionada(null);
    },
    [recintos, setRecintoSeleccionado, setSalaSeleccionada]
  );

  const handleSalaChange = useCallback(
    (e) => {
      const salaId = e.target.value;
      const sala =
        recintoSeleccionado?.salas?.find((s) => String(s.id) === String(salaId)) ||
        null;
      setSalaSeleccionada(sala);
    },
    [recintoSeleccionado, setSalaSeleccionada]
  );

  const handleCreateEventClick = useCallback(() => {
    if (recintoSeleccionado && salaSeleccionada) {
      setEventoData({
        nombre: '',
        fecha: null,
        activo: 'true',
        oculto: false,
        desactivado: false,
        sector: '',
        recinto: recintoSeleccionado.id,
        sala: salaSeleccionada.id,
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
          gtmId: ''
        },
        created_at: new Date().toISOString(),
      });
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala');
    }
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleEdit = useCallback((eventoId) => {
    const eventoParaEditar = eventos.find((evento) => evento.id === eventoId);
    if (eventoParaEditar) {
      setEventoData(eventoParaEditar);
      setMenuVisible(true);
    } else {
      alert('Evento no encontrado');
    }
  }, [eventos]);

  const handleDelete = useCallback(async (eventoId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      try {
        const { error } = await supabase
          .from('eventos')
          .delete()
          .eq('id', eventoId);

        if (error) throw error;

        alert('Evento eliminado correctamente');
        fetchEventos();
      } catch (error) {
        console.error('Error al eliminar evento:', error);
        alert('Error al eliminar el evento: ' + error.message);
      }
    }
  }, [fetchEventos]);

  const handleDuplicate = useCallback(async (eventoId) => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (error || !data) {
        alert('No se pudo duplicar');
        return;
      }

      const { id: _, ...duplicatedData } = data;
      duplicatedData.nombre += ' (copia)';
      duplicatedData.created_at = new Date().toISOString();
      
      // Asegurar tenant_id en el evento duplicado
      if (currentTenant?.id) {
        duplicatedData.tenant_id = currentTenant.id;
      }

      const { error: insertError } = await supabase.from('eventos').insert([duplicatedData]);
      if (insertError) {
        alert('Error al duplicar');
      } else {
        alert('Evento duplicado correctamente');
        fetchEventos();
      }
    } catch (error) {
      console.error('Error al duplicar evento:', error);
      alert('Error al duplicar el evento: ' + error.message);
    }
  }, [fetchEventos, currentTenant]);

  const handleSave = useCallback(async () => {
    if (!eventoData) return;

    try {
      setIsUploading(true);
      const isExisting = !!eventoData.id;
      
      // Limpiar datos antes de enviar
      const cleanData = { ...eventoData };
      delete cleanData.__v;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      // Mapear fecha -> fecha_evento (timestamp)
      if (cleanData.fecha && typeof cleanData.fecha === 'string' && cleanData.fecha.trim() !== '') {
        // Mantener como ISO o YYYY-MM-DD; la columna es timestamp
        cleanData.fecha_evento = cleanData.fecha;
      }
      delete cleanData.fecha;

      // Asegurar tenant_id
      if (currentTenant?.id) {
        cleanData.tenant_id = currentTenant.id;
        console.log('✅ Tenant ID asignado:', currentTenant.id);
      } else {
        console.warn('⚠️ No hay tenant disponible');
      }

      let response;
      if (isExisting) {
        response = await supabase
          .from('eventos')
          .update(cleanData)
          .eq('id', cleanData.id);
      } else {
        response = await supabase
          .from('eventos')
          .insert([cleanData]);
      }

      if (response.error) throw response.error;

      console.log('✅ Evento guardado exitosamente con tenant_id:', cleanData.tenant_id);
      setIsSaved(true);
      setMenuVisible(false);
      fetchEventos();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('❌ Error al guardar evento:', error);
      alert(error.message || 'Error al guardar el evento');
    } finally {
      setIsUploading(false);
    }
  }, [eventoData, fetchEventos, currentTenant]);
  

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Eventos</h1>
                <p className="text-lg text-gray-600">
                  Crea y administra eventos para tus recintos y salas
                </p>
                {currentTenant && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      Tenant: {currentTenant.company_name || currentTenant.id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selectores de Recinto y Sala */}
        <VenueSelectors
          recintos={recintos}
          recintoSeleccionado={recintoSeleccionado}
          handleRecintoChange={handleRecintoChange}
          salaSeleccionada={salaSeleccionada}
          setSalaSeleccionada={setSalaSeleccionada}
        />

        {/* Barra de Herramientas */}
        {recintoSeleccionado && salaSeleccionada && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <SearchBar
                  searchTerm={searchTerm}
                  handleSearch={handleSearch}
                  searchResults={searchResults}
                  handleEdit={handleEdit}
                />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Toggle de Vista */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => toggleView('grid')} 
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vista de cuadrícula"
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                  <button 
                    onClick={() => toggleView('list')} 
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Vista de lista"
                  >
                    <FontAwesomeIcon icon={faList} />
                  </button>
                </div>

                {/* Botón Crear Evento */}
                <button
                  onClick={handleCreateEventClick}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-200 font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Evento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Eventos */}
        <EventsList
          eventosFiltrados={eventosFiltrados}
          viewMode={viewMode}
          recintoSeleccionado={recintoSeleccionado}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleDuplicate={handleDuplicate}
        />

        {/* Modal de Configuración de Evento */}
        {menuVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Configuración de Evento</h2>
                    <p className="text-blue-100 mt-1">
                      {eventoData?.id ? 'Editando evento existente' : 'Creando nuevo evento'}
                    </p>
                  </div>
                  <button
                    onClick={() => setMenuVisible(false)}
                    className="text-white hover:text-blue-100 text-3xl font-bold transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Tabs de Navegación */}
              <div className="flex border-b bg-gray-50 px-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm whitespace-nowrap font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido del Tab Activo */}
              <div className="flex-grow overflow-y-auto p-8">
                {ActiveComponent && (
                  <ActiveComponent eventoData={eventoData} setEventoData={setEventoData} />
                )}
              </div>

              {/* Footer con Botones */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {currentTenant && (
                      <span>Tenant ID: {currentTenant.id}</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMenuVisible(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isUploading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg text-white font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando {uploadProgress}%
                        </>
                      ) : (
                        'Guardar Evento'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notificación de Guardado */}
        {isSaved && (
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Evento guardado exitosamente</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Evento;
