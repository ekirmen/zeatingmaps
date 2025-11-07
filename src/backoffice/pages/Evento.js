import React, { useState, useEffect, useCallback } from 'react';
import { useRecinto } from '../contexts/RecintoContext';
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
import { validateAndCleanJsonField, cleanEventoJsonFields, cleanEventosArray } from '../../utils/jsonValidation';


const Evento = () => {
  const { currentTenant } = useTenant();
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { recintos, recintoSeleccionado, setRecintoSeleccionado, salaSeleccionada, setSalaSeleccionada } = useRecinto();
  const [eventos, setEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [eventoData, setEventoData] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('datosBasicos');
  const [isUploading, setIsUploading] = useState(false);

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
      return;
    }
  
    try {
      
      
      let query = supabase
        .from('eventos')
        .select('*')
        .eq('recinto', recintoSeleccionado.id)
        .eq('sala', salaSeleccionada.id);
      
      // Filtrar por tenant_id si está disponible
      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
  
      if (error) { throw error; }
      
      
      
      // Limpiar campos JSON corruptos en todos los eventos cargados
      const eventosLimpios = cleanEventosArray(data || []);
      setEventos(eventosLimpios);
    } catch (error) { setEventos([]); }
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
      // Limpiar campos JSON corruptos al cargar el evento
      const eventoLimpio = cleanEventoJsonFields(eventoParaEditar);
      setEventoData(eventoLimpio);
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
      } catch (error) { alert('Error al eliminar el evento: ' + error.message); }
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
    } catch (error) { alert('Error al duplicar el evento: ' + error.message); }
  }, [fetchEventos, currentTenant]);

  const handleToggleEventStatus = useCallback(async (eventoId, evento) => {
    try {
      const currentActivo = evento.activo === true || evento.activo === 'true';
      const currentDesactivado = evento.desactivado === true || evento.desactivado === 'true';
      
      const newActivo = !currentActivo;
      const newDesactivado = !newActivo;
      
      const { error } = await supabase
        .from('eventos')
        .update({
          activo: newActivo,
          desactivado: newDesactivado
        })
        .eq('id', eventoId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setEventos(prev => prev.map(e => 
        e.id === eventoId 
          ? { ...e, activo: newActivo, desactivado: newDesactivado }
          : e
      ));
      
      setEventosFiltrados(prev => prev.map(e => 
        e.id === eventoId 
          ? { ...e, activo: newActivo, desactivado: newDesactivado }
          : e
      ));

      // Si el evento actual está siendo editado, actualizarlo también
      if (eventoData?.id === eventoId) {
        setEventoData(prev => ({
          ...prev,
          activo: newActivo,
          desactivado: newDesactivado
        }));
      }

      const statusText = newActivo ? 'activado' : 'desactivado';
      alert(`Evento ${statusText} correctamente`);
    } catch (error) { alert('Error al cambiar el estado del evento: ' + error.message); }
  }, [eventoData]);






  const handleSave = useCallback(async () => {
    if (!eventoData) return;

    try {
      setIsUploading(true);
      const isExisting = !!eventoData.id;
      
      // Detectar si el evento se está activando (estadoVenta cambia a 'a-la-venta')
      let wasActivated = false;
      if (isExisting && eventoData.estadoVenta === 'a-la-venta') {
        // Obtener el estado anterior del evento
        const { data: previousEvent } = await supabase
          .from('eventos')
          .select('estadoVenta')
          .eq('id', eventoData.id)
          .single();
        
        if (previousEvent && previousEvent.estadoVenta !== 'a-la-venta') {
          wasActivated = true;
        }
      } else if (!isExisting && eventoData.estadoVenta === 'a-la-venta') {
        // Si es un evento nuevo y ya está a la venta, también activar notificación
        wasActivated = true;
      }
      
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

      // Validar y limpiar campos JSON ANTES de guardar para prevenir corrupción
      const cleanDataValidated = cleanEventoJsonFields(cleanData);
      Object.assign(cleanData, cleanDataValidated);
      

      // Asegurar tenant_id
      if (currentTenant?.id) { cleanData.tenant_id = currentTenant.id; }

      let response;
      if (isExisting) {
        response = await supabase
          .from('eventos')
          .update(cleanData)
          .eq('id', cleanData.id);
      } else {
        response = await supabase
          .from('eventos')
          .insert([cleanData])
          .select()
          .single();
      }

      if (response.error) throw response.error;
      
      // NOTA: Las notificaciones push ahora se envían cuando se crea una función en canal internet
      // No se envían cuando se activa un evento, solo cuando se crea la función
      // Esto se maneja en src/backoffice/pages/Funciones.js
      
      setIsSaved(true);
      setMenuVisible(false);
      fetchEventos();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) { alert(error.message || 'Error al guardar el evento'); } finally {
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
                
              </div>
            </div>
          </div>
        </div>

        {/* Selectores de Recinto y Sala + Acciones (una sola línea) */}
        <VenueSelectors
          recintos={recintos}
          recintoSeleccionado={recintoSeleccionado}
          handleRecintoChange={handleRecintoChange}
          salaSeleccionada={salaSeleccionada}
          setSalaSeleccionada={setSalaSeleccionada}
          rightContent={recintoSeleccionado && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden lg:block min-w-[320px]">
                <SearchBar
                  searchTerm={searchTerm}
                  handleSearch={handleSearch}
                  searchResults={searchResults}
                  handleEdit={handleEdit}
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
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
              <button
                onClick={handleCreateEventClick}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm transition-all duration-200 font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Evento
              </button>
            </div>
          )}
        />

        {/* Lista de Eventos */}
        <EventsList
          eventosFiltrados={eventosFiltrados}
          viewMode={viewMode}
          recintoSeleccionado={recintoSeleccionado}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleDuplicate={handleDuplicate}
          onToggleEventStatus={handleToggleEventStatus}
        />

        {/* Modal de Configuración de Evento */}
        {menuVisible && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
              {/* Header del Modal - Diseño Minimalista */}
              <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Configuración de Evento</h2>
                      
                      {/* Estado del evento y botón de activación/desactivación */}
                      {eventoData?.id && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Estado:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              eventoData?.activo && !eventoData?.desactivado 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {eventoData?.activo && !eventoData?.desactivado ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => {
                              const newActivo = !eventoData?.activo;
                              const newDesactivado = !newActivo;
                              setEventoData(prev => ({
                                ...prev,
                                activo: newActivo,
                                desactivado: newDesactivado
                              }));
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              eventoData?.activo && !eventoData?.desactivado
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {eventoData?.activo && !eventoData?.desactivado ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuVisible(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tabs de Navegación - Diseño Minimalista Mejorado */}
              <div className="bg-white/80 backdrop-blur-sm px-8 py-4 border-b border-gray-200/60">
                <div className="flex gap-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 hover:shadow-sm'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido del Tab Activo */}
              <div className="flex-grow overflow-y-auto p-8 bg-gray-50/30">
                <div className="max-w-4xl mx-auto">
                  {ActiveComponent && (
                    <ActiveComponent eventoData={eventoData} setEventoData={setEventoData} />
                  )}
                </div>
              </div>

              {/* Footer con Botones - Diseño Mejorado */}
              <div className="bg-white border-t border-gray-100 px-8 py-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 flex items-center gap-2"></div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMenuVisible(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isUploading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg text-white font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Evento
                        </>
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
