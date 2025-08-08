import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Card, Select, message, Spin, Alert, Tabs } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined, ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../supabaseClient';

import { getFunciones, getFuncion, fetchMapa } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useCartRestore from '../../store/hooks/useCartRestore';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import Cart from './Cart';
import ProductosWidget from '../components/ProductosWidget';

const { Option } = Select;
const { TabPane } = Tabs;

const EventosPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [priceTemplate, setPriceTemplate] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState('seats');

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const cartItems = useCartStore((state) => state.items);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const {
    subscribeToFunction,
    unsubscribe
  } = useSeatLockStore();

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  // Obtener evento + funciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar evento por slug
        const { data: eventData, error: eventError } = await supabase
          .from('eventos')
          .select(`
            *,
            recintos (
              id,
              nombre,
              direccion,
              capacidad
            )
          `)
          .ilike('slug', eventSlug)
          .maybeSingle();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Evento no encontrado');
        
        setEvento(eventData);
        setVenueInfo(eventData?.recintos);

        // Obtener funciones del evento
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);

        // Si hay una función en los parámetros de URL, seleccionarla
        const funcionParam = searchParams.get('funcion');
                 if (funcionParam && funcionesData) {
           const funcion = funcionesData.find(f => f.id === funcionParam || f._id === funcionParam);
          if (funcion) {
            const fid = funcion.id || funcion._id;
            setSelectedFunctionId(fid);
            setShowMap(true);
          }
        } else if (funcionesData && funcionesData.length === 1) {
          // Si solo hay una función, seleccionarla automáticamente y mostrar el mapa
          const fid = funcionesData[0].id || funcionesData[0]._id;
          setSelectedFunctionId(fid);
          setShowMap(true);
        }
      } catch (err) {
        console.error('Error fetching evento:', err);
        setError(err);
        message.error('Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };
    if (eventSlug) fetchData();
  }, [eventSlug, searchParams]);

  // Cargar mapa y plantilla de precios
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const funcion = await getFuncion(selectedFunctionId);
        if (funcion?.sala?.id) {
          const mapData = await fetchMapa(funcion.sala.id);
          
          // Transform the map data to match SeatingMapUnified expectations
          if (mapData && mapData.contenido) {
            // If contenido is a string, parse it
            let contenido = mapData.contenido;
            if (typeof contenido === 'string') {
              try {
                contenido = JSON.parse(contenido);
              } catch (e) {
                console.error('Error parsing mapa contenido:', e);
                setMapa(null);
                return;
              }
            }
            
            // Transform the data structure to match SeatingMapUnified expectations
            // The map data contains mesas with sillas, we need to extract all seats
            const allSeats = [];
            const mesas = [];
            
            (Array.isArray(contenido) ? contenido : [contenido]).forEach(item => {
              if (item.type === 'mesa' && item.sillas) {
                mesas.push(item);
                // Extract seats from this mesa
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
            
            // Create a single zone with all seats
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
            
            console.log('Original map data:', mapData);
            console.log('Parsed contenido:', contenido);
            console.log('Extracted seats:', allSeats);
            console.log('Transformed map data:', transformedMap);
            setMapa(transformedMap);
          } else {
            setMapa(mapData);
          }
        }
        if (funcion?.plantilla) {
          console.log('Plantilla de precios encontrada:', funcion.plantilla);
          setPriceTemplate(funcion.plantilla);
        } else {
          console.log('No se encontró plantilla de precios para la función:', funcion);
        }
      } catch (err) {
        console.error('Error loading map:', err);
        setError(err);
      }
    };
    if (selectedFunctionId) fetchMap();
  }, [selectedFunctionId]);

  const handleSeatToggle = useCallback(
    (silla) => {
      const sillaId = silla._id || silla.id;
      const zona = mapa?.zonas?.find(z =>
        z.asientos?.some(a => a._id === sillaId)
      );
      const zonaId = zona?.id;
      if (!sillaId || !zonaId || !selectedFunctionId) return;

      const nombreZona = zona?.nombre || 'Zona';
      
      // Debug: mostrar información de precios
      console.log('Price template:', priceTemplate);
      console.log('Zona ID:', zonaId);
      console.log('Detalles:', priceTemplate?.detalles);
      
      const detalle = priceTemplate?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 10; // Precio por defecto de $10

      console.log('Precio encontrado:', precio);

      // Verificar si el asiento ya está en el carrito
      const cartItems = useCartStore.getState().items;
      const exists = cartItems.some(item => item.sillaId === sillaId);
      
      if (exists) {
        // Si está en el carrito, quitarlo
        removeFromCart(sillaId);
      } else {
        // Si no está en el carrito, agregarlo
        toggleSeat({
          sillaId,
          zonaId,
          precio,
          nombre: silla.nombre || silla.numero || silla._id,
          nombreZona,
          functionId: selectedFunctionId,
        });
      }
    },
    [selectedFunctionId, mapa, priceTemplate, toggleSeat, removeFromCart]
  );

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
    setShowMap(true);
  };

  const handleBackToSelection = () => {
    setShowMap(false);
    setSelectedFunctionId(null);
  };

  const handleProceedToCart = () => {
    if (getItemCount() === 0) {
      message.warning('No hay items en el carrito');
      return;
    }
    navigate('/store/cart');
  };

  const getEventImages = () => {
    if (!evento?.imagenes) return {};
    
    try {
      if (typeof evento.imagenes === 'string') {
        return JSON.parse(evento.imagenes);
      }
      return evento.imagenes;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return {};
    }
  };

  const images = getEventImages();
  const bannerImage = images.banner || images.portada || images.obraImagen;
  const thumbnailImage = images.portada || images.obraImagen || images.banner;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button 
            type="primary" 
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Evento no encontrado</h2>
          <Button 
            type="primary" 
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Volver
          </Button>
        </div>
      </div>
    );
  }

  // Si estamos mostrando el mapa de asientos
  if (showMap && selectedFunctionId) {
    const selectedFuncion = funciones.find(f => (f.id || f._id) === selectedFunctionId);
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToSelection}
                  className="flex items-center"
                >
                  Volver
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{evento.nombre}</h1>
                  <p className="text-sm text-gray-600">
                    {selectedFuncion?.nombre || 'Función'} - {selectedFuncion?.fecha_celebracion && formatDateString(selectedFuncion.fecha_celebracion)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Items en carrito</p>
                  <p className="text-lg font-bold text-blue-600">{getItemCount()}</p>
                </div>
                <Button 
                  type="primary" 
                  icon={<ClockCircleOutlined />}
                  onClick={handleProceedToCart}
                  disabled={getItemCount() === 0}
                >
                  Ver Carrito
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                className="mb-6"
              >
                <TabPane 
                  tab={
                    <span>
                      <CalendarOutlined />
                      Asientos
                    </span>
                  } 
                  key="seats"
                >
                  <Card 
                    title="Selecciona tus asientos" 
                    className="h-full"
                    extra={
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-sm">Disponible</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm">Seleccionado</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          <span className="text-sm">Ocupado</span>
                        </div>
                      </div>
                    }
                  >
                    {mapa ? (
                      <div className="h-96 overflow-auto">
                                                 <SeatingMapUnified
                           mapa={mapa}
                           funcionId={selectedFunctionId}
                           onSeatToggle={handleSeatToggle}
                           onTableToggle={(table) => {
                             console.log('Mesa seleccionada:', table);
                           }}
                           isSeatLocked={() => false}
                           isSeatLockedByMe={() => false}
                           lockSeat={() => Promise.resolve(true)}
                           unlockSeat={() => Promise.resolve(true)}
                           isTableLocked={() => false}
                           isTableLockedByMe={() => false}
                           lockTable={() => Promise.resolve(true)}
                           unlockTable={() => Promise.resolve(true)}
                           isAnySeatInTableLocked={() => false}
                           areAllSeatsInTableLockedByMe={() => false}
                           foundSeats={[]}
                           selectedSeats={cartItems.map(item => item.sillaId)}
                         />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-96 text-gray-500">
                        <div className="text-center">
                          <p className="text-lg font-semibold mb-2">No hay mapa disponible</p>
                          <p className="text-sm">No se encontró un mapa de asientos para esta función</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </TabPane>

                <TabPane 
                  tab={
                    <span>
                      <ShoppingCartOutlined />
                      Productos
                    </span>
                  } 
                  key="products"
                >
                  <ProductosWidget eventoId={evento.id} />
                </TabPane>
              </Tabs>
            </div>

            {/* Panel lateral - Carrito */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Cart />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Página principal del evento
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner del evento */}
      {bannerImage && (
        <div className="relative h-64 md:h-96 bg-cover bg-center" 
             style={{ backgroundImage: `url(${resolveImageUrl(bannerImage)})` }}>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{evento.nombre}</h1>
              {evento.descripcion && (
                <p className="text-xl md:text-2xl max-w-2xl mx-auto">{evento.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del evento */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="flex items-center mb-4">
                {thumbnailImage && (
                  <img 
                    src={resolveImageUrl(thumbnailImage)} 
                    alt={evento.nombre}
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{evento.nombre}</h2>
                  {evento.descripcion && (
                    <p className="text-gray-600 mt-2">{evento.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Información del recinto */}
              {venueInfo && (
                <div className="flex items-center text-gray-600 mb-4">
                  <EnvironmentOutlined className="mr-2" />
                  <span>{venueInfo.nombre}</span>
                  {venueInfo.direccion && (
                    <span className="ml-2">- {venueInfo.direccion}</span>
                  )}
                </div>
              )}

              {/* Fechas del evento */}
              {evento.fecha_evento && (
                <div className="flex items-center text-gray-600 mb-4">
                  <CalendarOutlined className="mr-2" />
                  <span>
                    {formatDateString(evento.fecha_evento)}
                  </span>
                </div>
              )}
            </Card>

            {/* Selección de función */}
            <Card title="Seleccionar Función" className="mb-6">
              {funciones.length === 0 ? (
                <Alert
                  message="No hay funciones disponibles"
                  description="Este evento no tiene funciones programadas."
                  type="warning"
                  showIcon
                />
              ) : (
                <div className="space-y-4">
                  <Select
                    placeholder="Selecciona una función"
                    value={selectedFunctionId}
                    onChange={handleFunctionSelect}
                    className="w-full"
                    size="large"
                  >
                    {funciones.map((funcion) => (
                      <Option key={funcion.id || funcion._id} value={funcion.id || funcion._id}>
                        <div className="flex items-center justify-between">
                          <span>{funcion.nombre || 'Función'}</span>
                          <span className="text-gray-500">
                            {formatDateString(funcion.fecha_celebracion)}
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>

                  {selectedFunctionId && (
                    <div className="mt-4">
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={() => setShowMap(true)}
                        className="w-full"
                      >
                        Ver Mapa de Asientos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <Card title="Información del Evento" className="mb-6">
              <div className="space-y-4">
                {evento.estado && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Estado:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      evento.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {evento.estado}
                    </span>
                  </div>
                )}

                {venueInfo?.capacidad && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Capacidad:</span>
                    <span>{venueInfo.capacidad} personas</span>
                  </div>
                )}

                {funciones && funciones.length > 0 && (
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Funciones:</span>
                    <span>{funciones.length}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Botón de compra rápida */}
            {selectedFunctionId && (
              <Card>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => setShowMap(true)}
                  className="w-full"
                  icon={<ClockCircleOutlined />}
                >
                  Comprar Entradas
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventosPage; 