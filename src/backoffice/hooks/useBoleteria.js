import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import { fetchMapa, fetchZonasPorSala } from '../services/apibackoffice';
import useSelectedSeatsStore from '../../stores/useSelectedSeatsStore';

const EVENT_KEY = 'boleteriaEventId';
const FUNC_KEY = 'boleteriaFunctionId';
const CART_KEY = 'boleteriaCart';
const SELECTED_SEATS_KEY = 'boleteriaSelectedSeats';

export const useBoleteria = () => {
  console.log('🚀 [useBoleteria] Hook initialized');
  
  // Usar el store unificado para selectedFuncion y selectedEvent
  const {
    selectedFuncion,
    selectedEvent,
    setSelectedFuncion,
    setSelectedEvent,
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected,
    syncWithSeatLocks
  } = useSelectedSeatsStore();
  
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [carrito, setCarrito] = useState(() => {
    // Cargar carrito desde localStorage al inicializar
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Debug: Track mapa state changes (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [useBoleteria] Mapa state changed:', mapa ? '✅ Cargado' : '❌ Null');
    }
  }, [mapa]);

  // Restaurar carrito cuando se cargue la función
  useEffect(() => {
    if (selectedFuncion && carrito.length === 0) {
      try {
        const savedCart = localStorage.getItem(CART_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Solo restaurar si el carrito tiene items y es para la función actual
          if (parsedCart.length > 0 && parsedCart[0]?.funcionId === selectedFuncion.id) {
            setCarrito(parsedCart);
            console.log('🔄 [useBoleteria] Carrito restaurado desde localStorage:', parsedCart.length, 'items');
          }
        }
      } catch (error) {
        console.error('❌ [useBoleteria] Error restaurando carrito:', error);
      }
    }
  }, [selectedFuncion, carrito.length]);

  // Función para guardar carrito en localStorage
  const saveCarritoToStorage = useCallback((newCarrito) => {
    try {
      if (!Array.isArray(newCarrito)) {
        console.warn('⚠️ [useBoleteria] Intento de guardar carrito inválido:', newCarrito);
        localStorage.setItem(CART_KEY, JSON.stringify([]));
        return;
      }

      localStorage.setItem(CART_KEY, JSON.stringify(newCarrito));
      console.log('💾 [useBoleteria] Carrito guardado en localStorage:', newCarrito.length, 'items');
    } catch (error) {
      console.error('❌ [useBoleteria] Error guardando carrito en localStorage:', error);
    }
  }, []);

  // Memoizar el setCarrito para evitar re-renderizados y guardar en localStorage
  const setCarritoMemo = useCallback((updater) => {
    setCarrito((prevCarrito) => {
      const resolvedValue = typeof updater === 'function' ? updater(prevCarrito) : updater;
      const normalizedCarrito = Array.isArray(resolvedValue) ? resolvedValue : [];
      saveCarritoToStorage(normalizedCarrito);
      return normalizedCarrito;
    });
  }, [saveCarritoToStorage]);

  // Memoizar el setSelectedEvent para evitar re-renderizados
  const setSelectedEventMemo = useCallback((newEvent) => {
    setSelectedEvent(newEvent);
  }, [setSelectedEvent]);

  // Función para limpiar carrito
  const clearCarrito = useCallback(() => {
    setCarritoMemo([]);
    console.log('🗑️ [useBoleteria] Carrito limpiado');
  }, [setCarritoMemo]);

  // Función para agregar asiento al carrito
  const addToCarrito = useCallback((asiento, precio, zona) => {
    const newItem = {
      id: asiento.id || asiento._id,
      asiento: asiento,
      precio: precio,
      zona: zona,
      funcionId: selectedFuncion?.id,
      timestamp: Date.now()
    };

    setCarritoMemo(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, newItem];
    });

    console.log('➕ [useBoleteria] Asiento agregado al carrito:', newItem);
  }, [selectedFuncion?.id, setCarritoMemo]);

  // Función para quitar asiento del carrito
  const removeFromCarrito = useCallback((asientoId) => {
    setCarritoMemo(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter(item => item.id !== asientoId && item._id !== asientoId && item.sillaId !== asientoId);
    });

    console.log('➖ [useBoleteria] Asiento removido del carrito:', asientoId);
  }, [setCarritoMemo]);

  // Manejar la selección de una función
  const handleFunctionSelect = useCallback(async (functionId, options = {}) => {
    console.log('🔄 [useBoleteria] handleFunctionSelect called with function ID:', functionId, 'options:', options);
    setLoading(true);
    setError(null);
    setDebugInfo({ step: 'handleFunctionSelect', functionId });
    
    setSelectedFuncion(null);
    setSelectedPlantilla(null);
    setMapa(null);
    setZonas([]);
    // Limpiar carrito solo si es una función diferente Y no se debe preservar el carrito
    if (selectedFuncion?.id !== functionId && !options.preserveCart) {
      console.log('🧹 [useBoleteria] Limpiando carrito porque es función diferente');
      setCarritoMemo([]);
    } else if (options.preserveCart) {
      console.log('🛒 [useBoleteria] Preservando carrito por opción preserveCart');
    }

    // Ensure functionId is a primitive value
    if (typeof functionId === 'object' && functionId !== null) {
      functionId = functionId._id || functionId.id || null;
    }
  
    try {
      const { data: funcionData, error: funcionError } = await supabase
        .from('funciones')
        .select(`
          *,
          plantilla(*)
        `)
        .eq('id', functionId)
        .single();
  
      if (funcionError) throw funcionError;
      if (!funcionData) {
        message.warning('Función no encontrada.');
        return false;
      }

      // Validar que funcionData tenga las propiedades necesarias
      if (!funcionData || !funcionData.id) {
        console.error('❌ [useBoleteria] funcionData no tiene ID:', funcionData);
        message.error('Datos de función inválidos');
        return false;
      }
  
      // Mapear los campos para que coincidan con lo que espera el frontend
      const salaField = funcionData.sala;
      const mappedSala = typeof salaField === 'object' && salaField !== null
        ? salaField
        : (salaField ? { id: salaField } : null);

      const funcionMapeada = {
        ...funcionData,
        sala: mappedSala,
        fechaCelebracion: funcionData.fecha_celebracion,
        inicioVenta: funcionData.inicio_venta,
        finVenta: funcionData.fin_venta,
        pagoAPlazos: funcionData.pago_a_plazos,
        permitirReservasWeb: funcionData.permitir_reservas_web
      };
  
      setSelectedFuncion(funcionMapeada);
      localStorage.setItem(FUNC_KEY, functionId);
      
      console.log('✅ [useBoleteria] Función seleccionada:', funcionMapeada);
      console.log('📋 [useBoleteria] Plantilla de la función:', funcionData.plantilla);
      console.log('🔍 [useBoleteria] Estructura completa de funcionData:', {
        id: funcionData.id,
        sala_id: funcionData.sala_id,
        sala: funcionData.sala,
        evento_id: funcionData.evento_id
      });
  
      // Cargar plantilla de precios si existe
      if (funcionData.plantilla) {
        console.log('✅ Plantilla encontrada:', funcionData.plantilla);
        console.log('📋 Plantilla ID:', funcionData.plantilla.id);
        console.log('📋 Plantilla nombre:', funcionData.plantilla.nombre);
        console.log('📋 Plantilla detalles:', funcionData.plantilla.detalles);
        console.log('📋 Tipo de detalles:', typeof funcionData.plantilla.detalles);
        setSelectedPlantilla(funcionData.plantilla);
      } else {
        console.log('❌ No hay plantilla de precios para esta función');
        console.log('🔍 Buscando en plantilla_entradas...');
        
        // Intentar cargar plantilla desde plantilla_entradas
        if (funcionData.plantilla_entradas) {
          try {
            const { data: plantillaData, error: plantillaError } = await supabase
              .from('plantillas')
              .select('*')
              .eq('id', funcionData.plantilla_entradas)
              .single();
            
            if (plantillaError) {
              console.error('❌ Error cargando plantilla desde plantilla_entradas:', plantillaError);
            } else if (plantillaData) {
              console.log('✅ Plantilla cargada desde plantilla_entradas:', plantillaData);
              console.log('📋 Plantilla detalles:', plantillaData.detalles);
              setSelectedPlantilla(plantillaData);
            } else {
              console.log('❌ No se encontró plantilla con ID:', funcionData.plantilla_entradas);
            }
          } catch (e) {
            console.error('❌ Error en fallback de plantilla:', e);
          }
        }
        
        setSelectedPlantilla(null);
      }
  
      // Cargar mapa y zonas usando salaId robusto
      const salaId = mappedSala?.id || mappedSala?._id || salaField || funcionData.sala_id || null;
      console.log('🔍 [useBoleteria] DEBUG - mappedSala:', mappedSala);
      console.log('🔍 [useBoleteria] DEBUG - salaField:', salaField);
      console.log('🔍 [useBoleteria] DEBUG - funcionData.sala_id:', funcionData.sala_id);
      console.log('🔍 [useBoleteria] DEBUG - salaId calculado:', salaId);
      
      if (salaId) {
        console.log('🔍 [useBoleteria] Cargando mapa para sala:', salaId);
        console.log('🔍 [useBoleteria] Tipo de salaId:', typeof salaId);
        
        try {
          console.log('🔍 [useBoleteria] Llamando a fetchMapa con salaId:', salaId, 'y funcionId:', funcionData.id);
          const mapData = await fetchMapa(salaId, funcionData.id);
          console.log('📊 [useBoleteria] Mapa cargado:', mapData);
          console.log('📊 [useBoleteria] Tipo de mapData:', typeof mapData);
          console.log('📊 [useBoleteria] mapData es null?', mapData === null);
          console.log('📊 [useBoleteria] mapData.contenido:', mapData?.contenido);
          
          if (!mapData) {
            console.error('❌ [useBoleteria] fetchMapa retornó null/undefined');
            console.error('❌ [useBoleteria] Verificar RLS policies para mapas');
          }
          
          setMapa(mapData);
          console.log('✅ [useBoleteria] Mapa estado actualizado con setMapa');

          console.log('🔍 [useBoleteria] Cargando zonas para sala:', salaId);
          const zonasData = await fetchZonasPorSala(salaId);
          console.log('🏷️ [useBoleteria] Zonas cargadas:', zonasData);
          setZonas(zonasData);
          
          // Calcular estadísticas del evento basadas en el mapa cargado
          if (mapData && mapData.contenido) {
            console.log('📊 [useBoleteria] Calculando estadísticas desde el mapa cargado');
            let totalSeats = 0;
            let availableSeats = 0;
            let soldSeats = 0;
            let reservedSeats = 0;
            
            // Si el contenido es un array, procesarlo directamente
            // Si es un objeto, buscar la propiedad 'elementos'
            const elementos = Array.isArray(mapData.contenido) 
              ? mapData.contenido 
              : mapData.contenido.elementos || [];
            
            if (Array.isArray(elementos)) {
              elementos.forEach(elemento => {
              // Validar que elemento no sea null/undefined
              if (!elemento || typeof elemento !== 'object') {
                console.warn('⚠️ [useBoleteria] Elemento inválido en mapa:', elemento);
                return;
              }
              
              if (elemento.sillas && Array.isArray(elemento.sillas)) {
                totalSeats += elemento.sillas.length;
                
                elemento.sillas.forEach(silla => {
                  // Validar que silla no sea null/undefined
                  if (!silla || typeof silla !== 'object') {
                    console.warn('⚠️ [useBoleteria] Silla inválida en elemento:', silla);
                    return;
                  }
                  
                  switch (silla.estado) {
                    case 'pagado':
                    case 'vendido':
                      soldSeats++;
                      break;
                    case 'reservado':
                      reservedSeats++;
                      break;
                    case 'disponible':
                    default:
                      availableSeats++;
                      break;
                  }
                });
              }
              
              // También contar asientos individuales (type: 'silla')
              if (elemento.type === 'silla') {
                totalSeats++;
                switch (elemento.estado) {
                  case 'pagado':
                  case 'vendido':
                    soldSeats++;
                    break;
                  case 'reservado':
                    reservedSeats++;
                    break;
                  case 'disponible':
                  default:
                    availableSeats++;
                    break;
                }
              }
            });
            } else {
              console.warn('⚠️ [useBoleteria] Mapa cargado pero sin contenido válido o no es array', {
                mapData: mapData,
                contenido: mapData.contenido,
                esArray: Array.isArray(mapData.contenido),
                elementos: elementos,
                esElementosArray: Array.isArray(elementos)
              });
            }
            
            // Si no hay asientos en el formato esperado, intentar con el formato de zonas
            if (totalSeats === 0 && mapData.contenido.zonas && Array.isArray(mapData.contenido.zonas)) {
              console.log('🔍 [useBoleteria] Intentando calcular estadísticas desde zonas');
              mapData.contenido.zonas.forEach(zona => {
                if (zona.asientos && Array.isArray(zona.asientos)) {
                  totalSeats += zona.asientos.length;
                  
                  zona.asientos.forEach(silla => {
                    switch (silla.estado) {
                      case 'pagado':
                      case 'vendido':
                        soldSeats++;
                        break;
                      case 'reservado':
                        reservedSeats++;
                        break;
                      case 'disponible':
                      default:
                        availableSeats++;
                        break;
                    }
                  });
                }
              });
            }
            
            console.log('✅ [useBoleteria] Estadísticas calculadas:', {
              totalSeats,
              availableSeats,
              soldSeats,
              reservedSeats
            });
            
            // Solo mostrar mensajes si realmente hay asientos y hay problemas de disponibilidad
            if (totalSeats > 0) {
              if (availableSeats <= 5 && availableSeats > 0) {
                message.warning(`⚠️ Solo quedan ${availableSeats} asientos disponibles`);
              } else if (availableSeats === 0) {
                message.error('❌ No hay asientos disponibles');
              } else if (availableSeats <= 10) {
                message.info(`ℹ️ Quedan ${availableSeats} asientos disponibles`);
              }
            } else {
              console.log('⚠️ [useBoleteria] No se encontraron asientos en el mapa');
            }
          } else {
            console.log('⚠️ [useBoleteria] Mapa cargado pero sin contenido válido o no es array');
            console.log('⚠️ [useBoleteria] mapData:', mapData);
            console.log('⚠️ [useBoleteria] mapData.contenido:', mapData?.contenido);
            console.log('⚠️ [useBoleteria] Es array:', Array.isArray(mapData?.contenido));
          }
        } catch (error) {
          console.error('❌ [useBoleteria] Error cargando mapa o zonas:', error);
          setMapa(null);
          setZonas([]);
        }
      } else {
        console.warn('⚠️ [useBoleteria] No hay salaId disponible para cargar mapa y zonas');
        console.warn('⚠️ [useBoleteria] mappedSala:', mappedSala);
        console.warn('⚠️ [useBoleteria] salaField:', salaField);
        console.warn('⚠️ [useBoleteria] salaField tipo:', typeof salaField);
        console.warn('⚠️ [useBoleteria] mappedSala tipo:', typeof mappedSala);
        setMapa(null);
        setZonas([]);
      }
  
      return true;
  
    } catch (err) {
      console.error("Error al seleccionar función:", err);
      message.error(`Error al seleccionar función: ${err.message}`);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedFuncion?.id, setCarritoMemo]);

  // Manejar la selección de un evento
  const handleEventSelect = useCallback(async (eventoId) => {
    console.log('🔄 [useBoleteria] handleEventSelect called with event ID:', eventoId);
    setLoading(true);
    setError(null);
    setDebugInfo({ step: 'handleEventSelect', eventoId });
    
    setSelectedEvent(null);
    setSelectedFuncion(null);
    setSelectedPlantilla(null);
    setMapa(null);
    setZonas([]);
    setCarritoMemo([]);

    try {
      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .eq('activo', true)
        .single();

      if (eventoError) throw eventoError;
      if (!eventoData || !eventoData.id) {
        message.warning('Evento no encontrado o datos inválidos.');
        return { success: false };
      }

      setSelectedEvent(eventoData);
      localStorage.setItem(EVENT_KEY, eventoId);

      // Cargar funciones del evento (sin embeds)
      const { data: funcionesData, error: funcionesError } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento_id', eventoId)
        .order('fecha_celebracion', { ascending: true });

      if (funcionesError) throw funcionesError;

      const funcionesMapeadas = (funcionesData || []).filter(funcion => funcion && funcion.id).map(funcion => ({
        ...funcion,
        sala: (typeof funcion.sala === 'object' && funcion.sala !== null) ? funcion.sala : (funcion.sala ? { id: funcion.sala } : null),
        fechaCelebracion: funcion.fecha_celebracion,
        inicioVenta: funcion.inicio_venta,
        finVenta: funcion.fin_venta,
        pagoAPlazos: funcion.pago_a_plazos,
        permitirReservasWeb: funcion.permitir_reservas_web
      }));

      setFunciones(funcionesMapeadas);

      return { success: true, funciones: funcionesMapeadas };

    } catch (err) {
      console.error("Error al seleccionar evento:", err);
      message.error(`Error al seleccionar evento: ${err.message}`);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [setCarritoMemo]);

  // Memoizar el valor de retorno para evitar re-renderizados
  const returnValue = useMemo(() => {
    try {
      return {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    zonas,
    carrito,
    loading,
    error,
    debugInfo,
    setDebugInfo,
    setCarrito: setCarritoMemo,
    addToCarrito,
    removeFromCarrito,
    clearCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent: setSelectedEventMemo,
    setSelectedFuncion,
    // Variables del store unificado
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected,
    syncWithSeatLocks
      };
    } catch (error) {
      console.error('Error en useMemo de useBoleteria:', error);
      return {
        eventos: [],
        funciones: [],
        selectedFuncion: null,
        selectedEvent: null,
        selectedPlantilla: null,
        setSelectedPlantilla: () => {},
        mapa: null,
        zonas: [],
        carrito: [],
        loading: false,
        error: 'Error de inicialización',
        debugInfo: {},
        setDebugInfo: () => {},
        setCarrito: () => {},
        addToCarrito: () => {},
        removeFromCarrito: () => {},
        clearCarrito: () => {},
        handleEventSelect: () => {},
        handleFunctionSelect: () => {},
        setSelectedEvent: () => {},
        setSelectedFuncion: () => {},
        selectedClient: null,
        setSelectedClient: () => {},
        selectedAffiliate: null,
        setSelectedAffiliate: () => {},
        selectedSeats: [],
        setSelectedSeats: () => {},
        addSeat: () => {},
        removeSeat: () => {},
        clearSeats: () => {},
        getSeatCount: () => 0,
        getTotalPrice: () => 0,
        isSeatSelected: () => false,
        syncWithSeatLocks: () => {}
      };
    }
  }, [
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    zonas,
    carrito,
    loading,
    error,
    debugInfo,
    setDebugInfo,
    setCarritoMemo,
    addToCarrito,
    removeFromCarrito,
    clearCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEventMemo,
    setSelectedFuncion,
    // Variables del store unificado
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected,
    syncWithSeatLocks
  ]);

  // Cargar eventos al inicio
  useEffect(() => {
    console.log('🔄 [useBoleteria] useEffect for initial data loading triggered');
    
    const fetchEventos = async () => {
      console.log('🔄 [useBoleteria] Starting to fetch eventos');
      setLoading(true);
      setError(null);
      try {
        // Verificar autenticación primero
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('❌ [useBoleteria] Error de autenticación:', authError);
          setError('Usuario no autenticado');
          setLoading(false);
          return;
        }
        
        console.log('✅ [useBoleteria] Usuario autenticado:', user.id);
        
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        console.log('✅ [useBoleteria] Eventos fetched:', data?.length || 0);
        setEventos(data || []);

        const storedEventId = localStorage.getItem(EVENT_KEY);
        console.log('🔍 [useBoleteria] Stored event ID:', storedEventId);

        if (storedEventId && data && Array.isArray(data)) {
          const initialEvent = data.find(e => e && e.id === storedEventId);
          console.log('🔍 [useBoleteria] Initial event found:', initialEvent);
          if (initialEvent && initialEvent.id) {
            console.log('🔄 [useBoleteria] Calling handleEventSelect for initial event');
            await handleEventSelect(storedEventId);
          }
        } else if (data && Array.isArray(data) && data.length > 0 && data[0] && data[0].id) {
          // Si no hay evento guardado pero hay eventos disponibles, seleccionar el primero
          console.log('🔄 [useBoleteria] No hay evento guardado, seleccionando el primero disponible');
          await handleEventSelect(data[0].id);
        }
        
        // Si hay un evento guardado en localStorage, también verificar si hay función guardada
        const storedFunctionId = localStorage.getItem(FUNC_KEY);
        if (storedFunctionId && !selectedFuncion) {
          console.log('🔄 [useBoleteria] Función guardada encontrada, cargando mapa...');
          await handleFunctionSelect(storedFunctionId);
        }

      } catch (err) {
        console.error("Error al cargar eventos:", err);
        setError(err.message);
        message.error(`Error al cargar eventos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [handleEventSelect]);

  return returnValue;
};
