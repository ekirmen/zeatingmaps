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
      
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('recinto', recintoSeleccionado.id)
        .eq('sala', salaSeleccionada.id)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching eventos:', error);
        throw error;
      }
      
      console.log('Eventos loaded:', data);
      setEventos(data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEventos([]);
    }
  }, [recintoSeleccionado, salaSeleccionada]);
  

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
          gtmId: '',
          metaPixelId: '',
          metaAccessToken: ''
        }
      });
      // No previous images when creating a new event
      setOriginalImages({});
      setMenuVisible(true);
    } else {
      alert('Por favor, selecciona un recinto y una sala para crear un evento.');
    }
  }, [recintoSeleccionado, salaSeleccionada]);

  const handleEdit = useCallback((eventoId) => {
    console.log('handleEdit called with eventoId:', eventoId);
    console.log('eventos disponibles:', eventos);
    
    const eventoParaEditar = eventos.find((evento) => evento.id === eventoId);
    console.log('eventoParaEditar found:', eventoParaEditar);
    
    if (eventoParaEditar) {
      const normalizeTags = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
            return val
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
          } catch {
            return val
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
        return [];
      };

      const parseImages = (imgs) => {
        if (!imgs) return {};
        if (typeof imgs === 'object') return imgs;
        try {
          const parsed = JSON.parse(imgs);
          return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch {
          return {};
        }
      };

      const parsedImages = parseImages(eventoParaEditar.imagenes);
      setOriginalImages(parsedImages);
      setEventoData({
        datosComprador: {},
        datosBoleto: {},
        mostrarDatosComprador: false,
        mostrarDatosBoleto: false,
        estadoVenta: 'a-la-venta',
        descripcionEstado: '',
        estadoPersonalizado: false,
        ...eventoParaEditar,
        tags: normalizeTags(eventoParaEditar.tags),
        imagenes: parsedImages,
      });
      console.log('Evento data set successfully');
    } else {
      console.error('Evento no encontrado con ID:', eventoId);
    }
    setMenuVisible(true);
  }, [eventos]);

  const handleDelete = useCallback(async (eventoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
  
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoId);
  
      if (error) throw error;
  
      fetchEventos();
    } catch (error) {
      alert('Error al eliminar el evento');
      console.error(error);
    }
  }, [fetchEventos]);
  
  const handleDuplicate = useCallback(async (eventoId) => {
    try {
      const { data: original, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();
  
      if (error || !original) throw error;
  
      const { id, created_at, updated_at, ...duplicated } = original;
      duplicated.nombre += ' (copia)';
      if (duplicated.slug) {
        duplicated.slug = `${duplicated.slug}-copia-${Date.now()}`;
      }
  
      const { error: insertError } = await supabase
        .from('eventos')
        .insert([duplicated]);
  
      if (insertError) throw insertError;
  
      fetchEventos();
    } catch (error) {
      console.error('Error duplicando el evento', error);
    }
  }, [fetchEventos]);
  

  const handleSave = useCallback(async () => {
    if (!eventoData) return;

    try {
      const cleanData = { ...eventoData };
      const isExisting = !!cleanData.id;
      if (!isExisting) {
        // Generate an ID upfront so uploaded images can be organized
        cleanData.id = uuidv4();
      }

      // Upload images from `imagenes` if they are File objects
      if (cleanData.imagenes) {
        setIsUploading(true);
        const uploaded = {};
        const extractPath = (url) => {
          try {
            const u = new URL(url);
            const prefix = `/storage/v1/object/public/${EVENT_BUCKET}/`;
            const idx = u.pathname.indexOf(prefix);
            if (idx !== -1) {
              return decodeURIComponent(u.pathname.slice(idx + prefix.length));
            }
          } catch (e) {
            console.error('Failed to parse storage url', url, e);
          }
          return null;
        };

        for (const [key, value] of Object.entries(cleanData.imagenes)) {
          if (value instanceof File) {
            const filename = `${Date.now()}-${value.name}`;
            const idPath = `${cleanData.id}/`;
            const base = EVENT_FOLDER ? `${EVENT_FOLDER}/${idPath}` : idPath;
            const path = `${base}${filename}`;
            const { data: upData, error: upErr } = await supabase.storage
              .from(EVENT_BUCKET)
              .upload(path, value);
            if (upErr) throw upErr;
            const { data: urlData } = supabase.storage
              .from(EVENT_BUCKET)
              .getPublicUrl(upData.path);
            uploaded[key] = urlData.publicUrl;

            // Remove old image if replacing on existing record
            if (isExisting && originalImages[key]) {
              const oldPath = extractPath(originalImages[key]);
              if (oldPath) {
                await supabase.storage.from(EVENT_BUCKET).remove([oldPath]);
              }
            }
          } else if (typeof value === 'string') {
            uploaded[key] = value;
          }
        }
        // Guardar como JSON string en la columna text
        cleanData.imagenes = JSON.stringify(uploaded);
        setIsUploading(false);
      }

      // Eliminar campos temporales o nulos
      delete cleanData._id;
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
