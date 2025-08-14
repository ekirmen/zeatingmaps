import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecintoSala } from '../contexts/RecintoSalaContext';
import { fetchZonasPorSala, createZona, updateZona, deleteZona, fetchMapa } from '../services/apibackoffice';
import { supabase } from '../../supabaseClient';
import Modal from 'react-modal';

if (typeof document !== 'undefined' && document.getElementById('root')) {
  Modal.setAppElement('#root');
}

const Plano = () => {
  const { recinto, setRecinto, sala, setSala, recintos, setRecintos } = useRecintoSala();
  const [zonas, setZonas] = useState([]);
  const [zoneSeatCounts, setZoneSeatCounts] = useState({});
  const [nuevaZona, setNuevaZona] = useState({ nombre: '', color: '#000000', aforo: 0, numerada: false });
  const [prevAforo, setPrevAforo] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [mapaPreview, setMapaPreview] = useState(null);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const numeradaBloqueada = editingZona?.numerada && editingZona.aforo > 0;
  const navigate = useNavigate();

  // Limpiar todas las suscripciones de tiempo real al montar el componente
  useEffect(() => {
    console.log('[PLANO] Limpiando suscripciones de tiempo real...');
    
    // Remover todos los canales activos
    const channels = supabase.getChannels();
    channels.forEach(channel => {
      try {
        console.log('[PLANO] Desuscribiendo canal:', channel.topic);
        channel.unsubscribe();
      } catch (error) {
        console.warn('[PLANO] Error al desuscribir canal:', error);
      }
    });

    return () => {
      console.log('[PLANO] Componente desmontado, limpiando suscripciones...');
      const channels = supabase.getChannels();
      channels.forEach(channel => {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('[PLANO] Error al desuscribir canal en cleanup:', error);
        }
      });
    };
  }, []);

  useEffect(() => {
    const loadRecintos = async () => {
      try {
        const recintosData = await import('../services/apibackoffice').then(mod => mod.fetchRecintos());
        setRecintos(recintosData);
        console.log('[PLANO] Recintos cargados:', recintosData?.length || 0);
      } catch (error) {
        console.error('[PLANO] Error al cargar recintos:', error);
      }
    };
    loadRecintos();
  }, [setRecintos]);

  // Función para cargar zonas con retry
  const loadZonas = async (salaId, retryCount = 0) => {
    if (!salaId) {
      setZonas([]);
      console.log('[PLANO] No hay sala seleccionada, limpiando zonas');
      return;
    }

    setLoadingZonas(true);
    try {
      console.log('[PLANO] Cargando zonas para sala:', salaId, retryCount > 0 ? `(intento ${retryCount + 1})` : '');
      const zonasData = await fetchZonasPorSala(salaId);
      setZonas(zonasData || []);
      console.log('[PLANO] Zonas cargadas:', zonasData?.length || 0);
    } catch (error) {
      console.error('[PLANO] Error al cargar zonas:', error);
      setZonas([]);
      
      // Retry logic for zones loading
      if (retryCount < 2) {
        console.log('[PLANO] Reintentando carga de zonas en 1 segundo...');
        setTimeout(() => loadZonas(salaId, retryCount + 1), 1000);
      }
    } finally {
      setLoadingZonas(false);
    }
  };

  useEffect(() => {
    if (sala?.id) {
      loadZonas(sala.id);
    } else {
      setZonas([]);
      console.log('[PLANO] No hay sala seleccionada, limpiando zonas');
    }
  }, [sala?.id]);

  useEffect(() => {
    if (!sala) {
      setZoneSeatCounts({});
      setMapaPreview(null);
      return;
    }
    const loadMapa = async () => {
      setLoadingMapa(true);
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
              counts[el.zona] = (counts[s.zona] || 0) + 1;
            }
          });
        }
        setZoneSeatCounts(counts);
        setMapaPreview(mapa);
        console.log('[PLANO] Conteo de asientos por zona:', counts);
        console.log('[PLANO] Mapa cargado para preview:', mapa);
      } catch (error) {
        console.error('[PLANO] Error al cargar mapa:', error);
        setZoneSeatCounts({});
        setMapaPreview(null);
      } finally {
        setLoadingMapa(false);
      }
    };
    loadMapa();
  }, [sala]);

  const handleCrearZona = async () => {
    if (!recinto) {
      console.warn('[PLANO] Intento de crear zona sin recinto seleccionado');
      alert('Debe seleccionar un recinto primero.');
      return;
    }
    
    if (!sala) {
      console.warn('[PLANO] Intento de crear zona sin sala seleccionada');
      alert('Debe seleccionar una sala primero.');
      return;
    }

    if (!nuevaZona.nombre.trim()) {
      alert('El nombre de la zona es obligatorio.');
      return;
    }

    try {
      console.log('[PLANO] Creando zona:', { ...nuevaZona, sala_id: sala.id });
      const nuevaZonaData = { ...nuevaZona, sala_id: sala.id };
      const zonaCreada = await createZona(nuevaZonaData);
      if (zonaCreada) {
        setZonas([...zonas, zonaCreada]);
        console.log('[PLANO] Zona creada exitosamente:', zonaCreada);
      }
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (err) {
      console.error('[PLANO] Error al crear zona:', err);
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
        console.log('[PLANO] Zona actualizada:', updatedZona);
      }
      setEditingZona(null);
      setNuevaZona({ nombre: '', color: '#000000', aforo: 0, numerada: false });
      setModalIsOpen(false);
    } catch (err) {
      console.error('[PLANO] Error al editar zona:', err);
      alert('Error al editar la zona: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleDeleteZona = async (zonaId) => {
    if (window.confirm('¿Eliminar esta zona?')) {
      try {
        await deleteZona(zonaId);
        setZonas(zonas.filter(z => z.id !== zonaId));
        console.log('[PLANO] Zona eliminada:', zonaId);
      } catch (err) {
        console.error('[PLANO] Error al eliminar zona:', err);
        alert('Error al eliminar la zona: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  const handleNavigateToCrearMapa = () => {
    if (!recinto) {
      console.warn('[PLANO] Intento de ir a crear mapa sin recinto seleccionado');
      alert('Debe seleccionar un recinto primero.');
      return;
    }
    
    if (!sala) {
      console.warn('[PLANO] Intento de ir a crear mapa sin sala seleccionada');
      alert('Debe seleccionar una sala primero.');
      return;
    }

    if (zonas.length === 0) {
      console.warn('[PLANO] Intento de ir a crear mapa sin zonas creadas');
      alert('Debe crear al menos una zona antes de crear el mapa.');
      return;
    }

    navigate('/dashboard/crear-mapa');
  };

  // Función para refrescar zonas manualmente
  const refreshZonas = () => {
    if (sala?.id) {
      console.log('[PLANO] Refrescando zonas manualmente...');
      loadZonas(sala.id);
    }
  };

  // Función para validar si se puede crear zona
  const canCreateZona = () => {
    return recinto && sala;
  };

  // Función para validar si se puede ir a crear mapa
  const canCreateMapa = () => {
    return recinto && sala && zonas.length > 0;
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
                console.log('[PLANO] Recinto seleccionado:', r);
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
                console.log('[PLANO] Sala seleccionada:', s);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Zonas de la sala: {sala.nombre}</h2>
              <button
                onClick={refreshZonas}
                disabled={loadingZonas}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loadingZonas ? 'Cargando...' : '🔄 Refrescar'}
              </button>
            </div>
            {loadingZonas ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">Cargando zonas...</p>
              </div>
            ) : zonas.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-gray-300 rounded">
                <p className="mb-4 text-gray-600">No hay zonas creadas para esta sala.</p>
                <button 
                  onClick={() => setModalIsOpen(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!canCreateZona()}
                >
                  Crear Primera Zona
                </button>
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
                <button 
                  onClick={() => setModalIsOpen(true)} 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!canCreateZona()}
                >
                  Crear Nueva Zona
                </button>
              </>
            )}
                         <div className="mt-6">
               <button 
                 onClick={handleNavigateToCrearMapa} 
                 className={`px-5 py-2 rounded text-white ${
                   canCreateMapa() 
                     ? 'bg-blue-600 hover:bg-blue-700' 
                     : 'bg-gray-400 cursor-not-allowed'
                 }`}
                 disabled={!canCreateMapa()}
               >
                 {canCreateMapa() ? 'Crear Mapa' : 'Seleccione recinto, sala y cree zonas primero'}
               </button>
             </div>

             {/* Preview del Mapa Existente */}
             {mapaPreview && (
               <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Vista Previa del Mapa</h3>
                 
                 {loadingMapa ? (
                   <div className="text-center p-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                     <p className="text-gray-600">Cargando preview del mapa...</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-white p-4 rounded-lg border">
                         <h4 className="font-medium text-gray-700 mb-2">📊 Elementos del Mapa</h4>
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-sm text-gray-600">Mesas:</span>
                             <span className="font-medium">
                               {mapaPreview.contenido?.filter(el => el.type === 'mesa').length || 0}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-gray-600">Sillas:</span>
                             <span className="font-medium">
                               {mapaPreview.contenido?.filter(el => el.type === 'silla').length || 0}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-sm text-gray-600">Total:</span>
                             <span className="font-medium">
                               {mapaPreview.contenido?.length || 0}
                             </span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white p-4 rounded-lg border">
                         <h4 className="font-medium text-gray-700 mb-2">🎯 Zonas Utilizadas</h4>
                         <div className="space-y-2">
                           {Object.entries(zoneSeatCounts).map(([zonaId, count]) => {
                             const zona = zonas.find(z => z.id === zonaId);
                             return (
                               <div key={zonaId} className="flex justify-between items-center">
                                 <span className="text-sm text-gray-600 flex items-center gap-2">
                                   <div 
                                     className="w-3 h-3 rounded-full" 
                                     style={{ backgroundColor: zona?.color || '#000' }}
                                   ></div>
                                   {zona?.nombre || 'Zona ' + zonaId}
                                 </span>
                                 <span className="font-medium">{count}</span>
                               </div>
                             );
                           })}
                           {Object.keys(zoneSeatCounts).length === 0 && (
                             <p className="text-sm text-gray-500 italic">No hay zonas asignadas</p>
                           )}
                         </div>
                       </div>
                       
                       <div className="bg-white p-4 rounded-lg border">
                         <h4 className="font-medium text-gray-700 mb-2">📅 Última Actualización</h4>
                         <div className="text-sm text-gray-600">
                           {mapaPreview.updated_at ? (
                             <span>{new Date(mapaPreview.updated_at).toLocaleString('es-ES')}</span>
                           ) : (
                             <span className="italic">No disponible</span>
                           )}
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex gap-3">
                       <button
                         onClick={() => navigate('/dashboard/crear-mapa')}
                         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                       >
                         ✏️ Editar Mapa
                       </button>
                       <button
                         onClick={() => window.open(`/dashboard/crear-mapa`, '_blank')}
                         className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                       >
                         🔗 Abrir en Nueva Pestaña
                       </button>
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
