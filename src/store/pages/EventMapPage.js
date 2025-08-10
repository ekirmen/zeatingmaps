import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Select, Spin, message } from 'antd';
import { LeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { fetchEventoBySlug, getFunciones, fetchMapa, getMapaPorEvento } from '../services/apistore';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';

const { Option } = Select;

const EventMapPage = () => {
  const { eventSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const {
    isSeatLocked,
    isSeatLockedByMe,
    lockSeat,
    unlockSeat,
    subscribeToFunction,
    unsubscribe
  } = useSeatLockStore();

  // Cargar evento y funciones
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventData = await fetchEventoBySlug(eventSlug);
        if (!eventData) {
          throw new Error('Evento no encontrado');
        }
        
        setEvento(eventData);
        
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);
        
        // Preseleccionar función si hay parámetro en URL
        const funcionParam = searchParams.get('funcion');
        if (funcionParam && funcionesData) {
          const funcion = funcionesData.find(f => f.id === parseInt(funcionParam));
          if (funcion) {
            setSelectedFunctionId(funcion.id);
          }
        }
        
      } catch (err) {
        console.error('Error cargando evento:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) {
      loadEventData();
    }
  }, [eventSlug, searchParams]);

  // Cargar mapa cuando se selecciona función
  useEffect(() => {
    const loadMap = async () => {
      if (!selectedFunctionId || !funciones.length) return;
      
      try {
        console.log('[MAPA DEBUG] Iniciando carga de mapa para función:', selectedFunctionId);
        console.log('[MAPA DEBUG] Funciones disponibles:', funciones);
        
        const funcion = funciones.find(f => f.id === selectedFunctionId);
        console.log('[MAPA DEBUG] Función encontrada:', funcion);
        
        if (!funcion?.sala) {
          console.warn('[MAPA DEBUG] No se encontró sala en la función:', funcion);
          return;
        }
        
        // Obtener el salaId correctamente
        const salaId = typeof funcion.sala === 'object' ? funcion.sala.id : funcion.sala;
        console.log('[MAPA DEBUG] SalaId extraído:', salaId);
        
        if (!salaId) {
          console.warn('[MAPA DEBUG] No se encontró salaId válido en la función', funcion);
          return;
        }
        
        console.log('[MAPA DEBUG] Intentando cargar mapa por salaId:', salaId);
        let mapData = await fetchMapa(salaId);
        console.log('[MAPA DEBUG] Resultado de fetchMapa:', mapData);
        
        if (!mapData) {
          console.warn('[MAPA DEBUG] No se encontró mapa para salaId=', salaId);
          console.log('[MAPA DEBUG] Intentando fallback con getMapaPorEvento para eventoId:', evento.id);
          mapData = await getMapaPorEvento(evento.id); // Fallback
          console.log('[MAPA DEBUG] Resultado de getMapaPorEvento:', mapData);
          
          if (!mapData) {
            console.warn('[MAPA DEBUG] No se encontró mapa por eventoId=', evento.id);
            console.log('[MAPA DEBUG] Creando mapa de ejemplo temporal...');
            
            // Crear un mapa de ejemplo temporal
            mapData = createTemporaryMap(salaId);
            console.log('[MAPA DEBUG] Mapa de ejemplo creado:', mapData);
          }
        }
        
        console.log('[MAPA DEBUG] Mapa encontrado, transformando datos...');
        
        // Transform the map data to match SeatingMapUnified expectations
        if (mapData && mapData.contenido) {
          // If contenido is a string, parse it
          let contenido = mapData.contenido;
          if (typeof contenido === 'string') {
            try {
              contenido = JSON.parse(contenido);
            } catch (e) {
              console.error('[MAPA DEBUG] Error parsing mapa contenido:', e);
              setMapa(null);
              return;
            }
          }
          
          // Transform the data structure to match SeatingMapUnified expectations
          const allSeats = [];
          const mesas = [];
          
          (Array.isArray(contenido) ? contenido : [contenido]).forEach(item => {
            if (item.type === 'mesa' && item.sillas) {
              mesas.push(item);
              item.sillas.forEach(silla => {
                allSeats.push({
                  ...silla,
                  x: silla.posicion?.x || silla.x || 0,
                  y: silla.posicion?.y || silla.y || 0,
                  ancho: silla.width || silla.ancho || 30,
                  alto: silla.height || silla.alto || 30,
                  nombre: silla.nombre || silla.numero || silla._id || 'Asiento'
                });
              });
            }
          });
          
          const transformedZonas = [{
            id: 'zona_principal',
            nombre: 'Zona Principal',
            asientos: allSeats
          }];
          
          const transformedMap = {
            ...mapData,
            zonas: transformedZonas,
            contenido: {
              zonas: transformedZonas,
              mesas: mesas
            }
          };
          
          console.log('[MAPA DEBUG] Original map data:', mapData);
          console.log('[MAPA DEBUG] Parsed contenido:', contenido);
          console.log('[MAPA DEBUG] Extracted seats:', allSeats);
          console.log('[MAPA DEBUG] Transformed map data:', transformedMap);
          setMapa(transformedMap);
        } else {
          console.log('[MAPA DEBUG] Mapa sin contenido, usando datos originales:', mapData);
          setMapa(mapData);
        }
        
        // Actualizar URL con la función seleccionada
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('funcion', selectedFunctionId);
        setSearchParams(newSearchParams);
        
      } catch (err) {
        console.error('[MAPA DEBUG] Error cargando mapa:', err);
        message.error('Error al cargar el mapa');
        setMapa(null);
      }
    };

    loadMap();
  }, [selectedFunctionId, funciones, searchParams, setSearchParams, evento]);

  // Función para crear un mapa temporal cuando no existe uno en la base de datos
  const createTemporaryMap = (salaId) => {
    console.log('[MAPA DEBUG] Creando mapa temporal para salaId:', salaId);
    
    // Crear un mapa básico con 4 mesas y 16 asientos
    const mesas = [];
    const asientos = [];
    
    // Crear 4 mesas en forma de cuadrado
    for (let mesaIndex = 0; mesaIndex < 4; mesaIndex++) {
      const mesaX = (mesaIndex % 2) * 200 + 100;
      const mesaY = Math.floor(mesaIndex / 2) * 200 + 100;
      
      const mesa = {
        id: `mesa_${mesaIndex + 1}`,
        type: 'mesa',
        nombre: `Mesa ${mesaIndex + 1}`,
        posicion: { x: mesaX, y: mesaY },
        sillas: []
      };
      
      // Crear 4 asientos por mesa
      for (let sillaIndex = 0; sillaIndex < 4; sillaIndex++) {
        const sillaX = mesaX + (sillaIndex % 2) * 40 - 20;
        const sillaY = mesaY + Math.floor(sillaIndex / 2) * 40 - 20;
        
        const silla = {
          _id: `silla_${mesaIndex + 1}_${sillaIndex + 1}`,
          nombre: `A${mesaIndex * 4 + sillaIndex + 1}`,
          numero: mesaIndex * 4 + sillaIndex + 1,
          posicion: { x: sillaX, y: sillaY },
          x: sillaX,
          y: sillaY,
          ancho: 30,
          alto: 30,
          width: 30,
          height: 30,
          estado: 'disponible',
          tipo: 'asiento'
        };
        
        mesa.sillas.push(silla);
        asientos.push(silla);
      }
      
      mesas.push(mesa);
    }
    
    const mapaTemporal = {
      id: `temp_${salaId}`,
      nombre: 'Mapa Temporal',
      sala_id: salaId,
      contenido: mesas,
      zonas: [{
        id: 'zona_principal',
        nombre: 'Zona Principal',
        asientos: asientos
      }]
    };
    
    console.log('[MAPA DEBUG] Mapa temporal creado:', mapaTemporal);
    return mapaTemporal;
  };

  // Suscribirse a función para bloqueo de asientos
  useEffect(() => {
    if (!selectedFunctionId) return;
    
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  const handleFunctionChange = (funcionId) => {
    setSelectedFunctionId(funcionId);
  };

  const handleSeatToggle = (silla) => {
    if (!selectedFunctionId || !mapa) return;
    
    const sillaId = silla._id || silla.id;
    const zona = mapa?.zonas?.find(z =>
      z.asientos?.some(a => a._id === sillaId)
    );
    
    if (!sillaId || !zona?.id) return;

    toggleSeat({
      sillaId,
      zonaId: zona.id,
      precio: 0, // Se puede obtener de la plantilla de precios
      nombre: silla.nombre || silla.numero || silla._id,
      nombreZona: zona.nombre || 'Zona',
      functionId: selectedFunctionId,
    });
  };

  const handleBackToEvent = () => {
    navigate(`/store/eventos/${eventSlug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBackToEvent} type="primary">
            Volver al evento
          </Button>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Evento no encontrado</h1>
          <Button onClick={() => navigate('/store')} type="primary">
            Volver a eventos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                icon={<LeftOutlined />} 
                onClick={handleBackToEvent}
                className="flex items-center"
              >
                Volver al evento
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{evento.nombre}</h1>
                <p className="text-sm text-gray-500">Mapa de asientos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
                              <EnvironmentOutlined className="text-blue-600 text-xl" />
              <span className="text-sm text-gray-600">Selección de asientos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Selector de función */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una función:
            </label>
            <Select
              value={selectedFunctionId}
              onChange={handleFunctionChange}
              placeholder="Selecciona una función"
              className="w-full max-w-md"
              size="large"
            >
              {funciones.map((funcion) => (
                <Option key={funcion.id} value={funcion.id}>
                  {new Date(funcion.fecha_celebracion).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Mapa de asientos */}
        {selectedFunctionId && mapa ? (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <SeatingMapUnified
              mapa={mapa}
              onSeatToggle={handleSeatToggle}
              isSeatLocked={isSeatLocked}
              isSeatLockedByMe={isSeatLockedByMe}
              onLockSeat={lockSeat}
              onUnlockSeat={unlockSeat}
              showControls={false}
            />
          </div>
        ) : selectedFunctionId ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Cargando mapa...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                          <EnvironmentOutlined className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecciona una función
            </h3>
            <p className="text-gray-600">
              Elige una función del evento para ver el mapa de asientos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventMapPage;
