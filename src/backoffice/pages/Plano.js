import React, { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { useRecintoSala } from '../contexts/RecintoSalaContext';
import { fetchZonasPorSala, createZona, updateZona, deleteZona, fetchMapa } from '../services/apibackoffice';
import { supabase } from '../../supabaseClient';
import Modal from 'react-modal';

import { message } from 'antd';

if (typeof document !== 'undefined' && document.getElementById('root')) {
  Modal.setAppElement('#root');
}

const Plano = () => {
  const hasInitialized = useRef(false);
  
  if (!hasInitialized.current) {
    logger.log('🎯 [PLANO] Componente Plano iniciando...');
    hasInitialized.current = true;
  }
  
  const { recinto, setRecinto, sala, setSala, recintos, setRecintos } = useRecintoSala();
  const [zonas, setZonas] = useState([]);
  const [zonaSearch, setZonaSearch] = useState('');
  const [zoneSeatCounts, setZoneSeatCounts] = useState({});
  const [nuevaZona, setNuevaZona] = useState({ nombre: '', color: '#000000', aforo: 0, numerada: false });
  const [prevAforo, setPrevAforo] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [mapaPreview, setMapaPreview] = useState(null);
  const [loadingMapa, setLoadingMapa] = useState(false);

  const numeradaBloqueada = editingZona?.numerada && editingZona.aforo > 0;

  // Debug log removed for production performance

  // Limpiar todas las suscripciones de tiempo real al montar el componente (optimizado)
  const hasCleanedChannels = useRef(false);
  useEffect(() => {
    if (hasCleanedChannels.current) return;
    
    logger.log('[PLANO] Limpiando suscripciones de tiempo real...');
    
    // Remover todos los canales activos
    const channels = supabase.getChannels();
    channels.forEach(channel => {
      try {
        logger.log('[PLANO] Desuscribiendo canal:', channel.topic);
        channel.unsubscribe();
      } catch (error) {
        logger.warn('[PLANO] Error al desuscribir canal:', error);
      }
    });
    
    hasCleanedChannels.current = true;

    return () => {
      logger.log('[PLANO] Componente desmontado, limpiando suscripciones...');
      const channels = supabase.getChannels();
      channels.forEach(channel => {
        try {
          channel.unsubscribe();
        } catch (error) {
          logger.warn('[PLANO] Error al desuscribir canal en cleanup:', error);
        }
      });
      hasCleanedChannels.current = false;
    };
  }, []);

  // Cargar recintos solo una vez (optimizado)
  const hasLoadedRecintos = useRef(false);
  useEffect(() => {
    if (hasLoadedRecintos.current || recintos.length > 0) return;
    
    const loadRecintos = async () => {
      hasLoadedRecintos.current = true;
      try {
        const recintosData = await import('../services/apibackoffice').then(mod => mod.fetchRecintos());
        setRecintos(recintosData);
        logger.log('[PLANO] Recintos cargados:', recintosData?.length || 0);
      } catch (error) {
        logger.error('[PLANO] Error al cargar recintos:', error);
        hasLoadedRecintos.current = false; // Permitir reintento en caso de error
      }
    };
    loadRecintos();
  }, [recintos.length, setRecintos]);

  // Función para cargar zonas con retry
  const loadZonas = async (salaId, retryCount = 0) => {
    if (!salaId) {
      setZonas([]);
      logger.log('[PLANO] No hay sala seleccionada, limpiando zonas');
      return;
    }

    setLoadingZonas(true);
    try {
      logger.log('[PLANO] Cargando zonas para sala:', salaId, retryCount > 0 ? `(intento ${retryCount + 1})` : '');
      const zonasData = await fetchZonasPorSala(salaId);
      
      // Verificar que zonasData sea un array válido
      if (Array.isArray(zonasData)) {
        setZonas(zonasData);
        logger.log('[PLANO] Zonas cargadas correctamente:', zonasData.length);
      } else {
        logger.warn('[PLANO] zonasData no es un array:', zonasData);
        setZonas([]);
      }
    } catch (error) {
      logger.error('[PLANO] Error al cargar zonas:', error);
      setZonas([]);
      
      // Retry logic for zones loading
      if (retryCount < 2) {
        logger.log('[PLANO] Reintentando carga de zonas en 1 segundo...');
        setTimeout(() => loadZonas(salaId, retryCount + 1), 1000);
      }
    } finally {
      setLoadingZonas(false);
    }
  };

  useEffect(() => {
    logger.log('🎯 [PLANO] useEffect sala cambiada:', sala);
    
    if (sala?.id) {
      logger.log('🎯 [PLANO] Cargando datos para sala:', sala.id);
      loadZonas(sala.id);
      loadMapaPreview(sala.id);
    } else {
      logger.log('🎯 [PLANO] Limpiando datos - no hay sala seleccionada');
      setZonas([]);
      setMapaPreview(null);
    }
  }, [sala]);

  const loadMapaPreview = async (salaId) => {
    if (!salaId) return;
    
    setLoadingMapa(true);
    try {
      const mapaData = await fetchMapa(salaId);
      
      // Verificar que mapaData sea válido
      if (mapaData && typeof mapaData === 'object') {
        setMapaPreview(mapaData);
        logger.log('[PLANO] Mapa cargado correctamente:', mapaData);
      } else {
        logger.warn('[PLANO] mapaData no es válido:', mapaData);
        setMapaPreview(null);
      }
    } catch (error) {
      logger.error('[PLANO] Error al cargar mapa:', error);
      setMapaPreview(null);
    } finally {
      setLoadingMapa(false);
    }
  };

  const refreshZonas = () => {
    if (sala?.id) {
      loadZonas(sala.id);
    }
  };

  const canCreateZona = () => {
    return recinto && sala && !loadingZonas;
  };

  const handleCrearMapa = () => {
    if (!sala?.id) {
      alert('Debe seleccionar una sala primero para crear el mapa.');
      return;
    }
    // Redirigir a la página de crear mapa
    window.location.href = `/dashboard/crear-mapa/${sala.id}`;
  };



  const handleCrearZona = async () => {
    if (!recinto) {
      alert('Debe seleccionar un recinto primero.');
      return;
    }
    
    if (!sala) {
      alert('Debe seleccionar una sala primero.');
      return;
    }

    if (!nuevaZona.nombre.trim()) {
      alert('El nombre de la zona es obligatorio.');
      return;
    }

    try {
      const nuevaZonaData = { ...nuevaZona, sala_id: sala.id };
      const zonaCreada = await createZona(nuevaZonaData);
      if (zonaCreada) {
        setZonas([...zonas, zonaCreada]);
      }
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (err) {
      logger.error('[PLANO] Error al crear zona:', err);
      alert('Error al crear la zona: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleEditZona = async () => {
    if (!recinto || !sala) {
      alert('Debe seleccionar un recinto y una sala primero.');
      return;
    }

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
      logger.error('[PLANO] Error al editar zona:', err);
      alert('Error al editar la zona: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleDeleteZona = async (zonaId) => {
    if (window.confirm('¿Eliminar esta zona?')) {
      try {
        await deleteZona(zonaId);
        setZonas(zonas.filter(z => z.id !== zonaId));
      } catch (err) {
        console.error('[PLANO] Error al eliminar zona:', err);
        alert('Error al eliminar la zona: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  console.log('🎯 [PLANO] Renderizando componente...');
  
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
                console.log('[PLANO] Recinto seleccionado:', r);
                setRecinto(r);
                setSala(null);
              }}
            >
              <option value="">Seleccionar un recinto</option>
              {Array.isArray(recintos) && recintos.map(r => (
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
                console.log('[PLANO] Sala seleccionada:', s);
                setSala(s);
              }}
              disabled={!recinto}
            >
              <option value="">Seleccionar una sala</option>
              {Array.isArray(recinto?.salas) && recinto.salas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {!recinto ? (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-6">
            <strong>Seleccione un recinto</strong> para comenzar a gestionar zonas.
          </div>
        ) : !sala ? (
          <div className="p-4 bg-blue-100 text-blue-800 rounded mb-6">
            <strong>Recinto seleccionado:</strong> {recinto.nombre}. Ahora <strong>seleccione una sala</strong> para gestionar sus zonas.
          </div>
        ) : (
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Zonas de la sala: {sala.nombre} <span className="text-sm text-gray-500">({(zonas || []).length})</span></h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={zonaSearch}
                  onChange={(e) => setZonaSearch(e.target.value)}
                  placeholder="Buscar zona por nombre..."
                  className="px-3 py-2 border border-gray-300 rounded w-60"
                />
                <button
                  onClick={refreshZonas}
                  disabled={loadingZonas}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loadingZonas ? 'Cargando...' : '🔄 Refrescar'}
                </button>
                <button
                  onClick={() => { setEditingZona(null); setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false }); setModalIsOpen(true); }}
                  disabled={!canCreateZona()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-sm text-sm"
                >
                  ➕ Nueva Zona
                </button>
                <button
                  onClick={handleCrearMapa}
                  disabled={!sala?.id}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  🎨 Crear Mapa
                </button>
              </div>
            </div>
            {loadingZonas ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">Cargando zonas...</p>
              </div>
            ) : !Array.isArray(zonas) || zonas.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">No hay zonas creadas para esta sala.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => setModalIsOpen(true)} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!canCreateZona()}
                  >
                    Crear Primera Zona
                  </button>
                  <button 
                    onClick={handleCrearMapa}
                    disabled={!sala?.id}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    🎨 Crear Mapa
                  </button>
                </div>
              </div>
            ) : Array.isArray(zonas) ? (
              <div className="space-y-4">
                {zonas
                  .filter(z => !zonaSearch || String(z.nombre || '').toLowerCase().includes(zonaSearch.toLowerCase()))
                  .map((zona, index) => (
                  <div key={zona.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: zona.color }}
                        ></div>
                        <span className="font-medium">{zona.nombre}</span>
                        <span className="text-sm text-gray-500">
                          Aforo: {zona.aforo || 'No definido'}
                        </span>
                        {zona.numerada && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Numerada
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingZona(zona);
                            setNuevaZona({ ...zona });
                            setModalIsOpen(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteZona(zona.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {Array.isArray(zonas) && zonas.filter(z => !zonaSearch || String(z.nombre || '').toLowerCase().includes(zonaSearch.toLowerCase())).length === 0 && (
                  <div className="text-center p-6 border border-dashed border-gray-300 rounded text-gray-600">No hay zonas que coincidan con la búsqueda.</div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="text-gray-600">Error: Las zonas no están disponibles</p>
              </div>
            )}

            {/* Vista previa del mapa */}
            {sala && (
              <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Vista Previa del Mapa</h3>
                {loadingMapa ? (
                  <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                ) : mapaPreview ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-800">{mapaPreview.nombre}</h4>
                        <p className="text-gray-600">{mapaPreview.descripcion}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          <span className="mr-4">
                            <strong>Estado:</strong> {mapaPreview.estado}
                          </span>
                          <span>
                            <strong>Última actualización:</strong> 
                            {mapaPreview.updated_at ? (
                              <span>{new Date(mapaPreview.updated_at).toLocaleString('es-ES')}</span>
                            ) : (
                              <span className="italic">No disponible</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={handleCrearMapa}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          ✏️ Editar Mapa
                        </button>
                        <button 
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          📊 Ver Estadísticas
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-gray-600 space-y-2">
                      <p>No hay mapa para esta sala.</p>
                      <p className="text-sm text-gray-500">
                        Crea un mapa para visualizar la distribución de asientos y mesas.
                      </p>
                      <div className="mt-3">
                        <button 
                          onClick={handleCrearMapa}
                          disabled={!sala?.id}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                        >
                          🎨 Crear Mapa de la Sala
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
