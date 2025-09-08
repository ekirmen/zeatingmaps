import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { Button, Card, Select, message, Spin, Alert, Tabs, Row, Col } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined, ArrowLeftOutlined, ShoppingCartOutlined, BugOutlined } from '@ant-design/icons';
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
import { diagnoseMapaAccess, testMapaQuery, generateDiagnosticReport } from '../../utils/databaseDiagnostics';
import { getZonaColor } from '../../utils/getZonaColor';
import DiagnosticReport from '../../components/DiagnosticReport';
import EventImage from '../components/EventImage';

const { Option } = Select;
const { TabPane } = Tabs;

const EventosPage = ({ forceShowMap = false }) => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [plantillaPrecios, setPlantillaPrecios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showMap, setShowMap] = useState(forceShowMap);
  const [activeTab, setActiveTab] = useState('seats');

  const [venueInfo, setVenueInfo] = useState(null);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const cartItems = useCartStore((state) => state.items);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const {
    subscribeToFunction,
    unsubscribe,
    lockSeat,
    unlockSeat,
    lockTable,
    unlockTable,
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe
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
        
        // Buscar evento por slug (sin embeds para evitar ambigüedad de FK)
        const { data: eventData, error: eventError } = await supabase
          .from('eventos')
          .select('*')
          .ilike('slug', eventSlug)
          .maybeSingle();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Evento no encontrado');
        
        setEvento(eventData);

        // Cargar recinto de forma explícita usando recinto_id o recinto
        const recintoId = eventData.recinto_id || eventData.recinto || null;
        if (recintoId) {
          const { data: recData, error: recErr } = await supabase
            .from('recintos')
            .select('id, nombre, direccion, capacidad')
            .eq('id', recintoId)
            .maybeSingle();
          if (!recErr) setVenueInfo(recData || null);
        }

        // Obtener funciones del evento (ya filtra es_principal si existe)
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);

        // Si hay una función en los parámetros de URL, seleccionarla
        const funcionParam = searchParams.get('funcion');
        if (funcionParam && funcionesData) {
          const funcion = funcionesData.find(
            f => String(f.id) === funcionParam || String(f._id) === funcionParam
          );
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
      setMapLoading(true);
      try {
        console.log('[MAPA] Iniciando carga de mapa para función:', selectedFunctionId);

        if (!selectedFunctionId) {
          console.warn('[MAPA] No hay función seleccionada');
          setMapa(null);
          setPlantillaPrecios(null);
          setMapLoading(false);
          return;
        }

        const funcion = funciones.find(f => f.id === selectedFunctionId);
        if (!funcion) {
          console.warn('[MAPA] No se encontró la función:', selectedFunctionId);
          setMapa(null);
          setPlantillaPrecios(null);
          setMapLoading(false);
          return;
        }

        console.log('[MAPA] Función encontrada:', funcion);
        console.log('[MAPA] Estructura completa de la función:', JSON.stringify(funcion, null, 2));

        // CARGAR PLANTILLA DE PRECIOS
        console.log('[PRECIOS] Cargando plantilla de precios...');
        let plantillaData = null;

        if (funcion.plantilla) {
          // Si la función ya tiene plantilla embebida
          plantillaData = funcion.plantilla;
          console.log('[PRECIOS] Plantilla encontrada en función:', plantillaData);
        } else if (funcion.plantilla_id) {
          // Si la función tiene plantilla_id, cargarla por separado
          try {
            const { data: plantilla, error: plantillaError } = await supabase
              .from('plantillas')
              .select('*')
              .eq('id', funcion.plantilla_id)
              .maybeSingle();

            if (plantillaError) throw plantillaError;
            if (plantilla) {
              plantillaData = plantilla;
              console.log('[PRECIOS] Plantilla cargada por ID:', plantillaData);
            }
          } catch (plantillaErr) {
            console.warn('[PRECIOS] Error cargando plantilla:', plantillaErr);
          }
        }

        setPlantillaPrecios(plantillaData);

        // MEJORAR LÓGICA PARA OBTENER SALA ID
        let salaId = null;

        // Opción 1: Buscar en sala directa
        if (funcion.sala) {
          if (typeof funcion.sala === 'object') {
            salaId = funcion.sala.id || funcion.sala._id;
            console.log('[MAPA] Sala encontrada en funcion.sala (objeto):', salaId);
          } else {
            salaId = funcion.sala;
            console.log('[MAPA] Sala encontrada en funcion.sala (directo):', salaId);
          }
        }

        // Opción 2: Buscar en sala_id
        if (!salaId && funcion.sala_id) {
          salaId = funcion.sala_id;
          console.log('[MAPA] Sala encontrada en funcion.sala_id:', salaId);
        }

        // Opción 3: Buscar en recinto.sala
        if (!salaId && funcion.recinto && typeof funcion.recinto === 'object') {
          salaId = funcion.recinto.sala?.id || funcion.recinto.sala?._id || funcion.recinto.sala;
          console.log('[MAPA] Sala encontrada en funcion.recinto.sala:', salaId);
        }

        if (!salaId) {
          console.error('[MAPA] ❌ NO SE PUDO ENCONTRAR SALA ID');
          console.error('[MAPA] Estructura de la función:', {
            sala: funcion.sala,
            sala_id: funcion.sala_id,
            recinto: funcion.recinto,
            keys: Object.keys(funcion)
          });
          setMapa(null);
          setMapLoading(false);
          return;
        }

        console.log('[MAPA] ✅ Sala ID encontrado:', salaId);

        const mapData = await fetchMapa(salaId);
        if (!mapData) {
          console.warn('[MAPA] No se encontró mapa para salaId=', salaId);
          console.warn('[MAPA] Esto puede indicar:');
          console.warn('1. La sala no tiene un mapa configurado');
          console.warn('2. Problemas de permisos o RLS');
          console.warn('3. La tabla mapas no existe o no es accesible');

          setMapa(null);
          setMapLoading(false);
          return;
        }

        console.log('[MAPA] Mapa cargado exitosamente:', mapData);

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
              setMapLoading(false);
              return;
            }
          }

          // Transform the data structure to match SeatingMapUnified expectations
          const allSeats = [];
          const mesas = [];
          const zonas = [];

          // Procesar contenido del mapa
          (Array.isArray(contenido) ? contenido : [contenido]).forEach(item => {
            if (item.type === 'mesa' && Array.isArray(item.sillas) && item.sillas.length > 0) {
              mesas.push(item);
              item.sillas.forEach(silla => {
                allSeats.push({
                  ...silla,
                  x: silla.posicion?.x || silla.x || 0,
                  y: silla.posicion?.y || silla.y || 0,
                  ancho: silla.width || silla.ancho || 30,
                  alto: silla.height || silla.alto || 30,
                  nombre: silla.nombre || silla.numero || silla._id || 'Asiento',
                  zonaId: item.zona_id || 'zona_principal'
                });
              });
            } else if (item.type === 'zona') {
              zonas.push({
                id: item._id || item.id || `zona_${zonas.length + 1}`,
                nombre: item.nombre || `Zona ${zonas.length + 1}`,
                color: item.color || getZonaColor(zonas.length),
                asientos: []
              });
            }
          });

          // Si no hay zonas definidas, crear zona por defecto
          if (zonas.length === 0) {
            zonas.push({
              id: 'zona_principal',
              nombre: 'Zona Principal',
              color: '#4CAF50', // Verde por defecto
              asientos: allSeats
            });
          } else {
            // Asignar asientos a sus zonas correspondientes
            zonas.forEach(zona => {
              zona.asientos = allSeats.filter(silla => silla.zonaId === zona.id);
            });
          }

          const transformedMap = {
            ...mapData,
            zonas: zonas,
            // NO transformar contenido, mantener el array original
            contenido: mapData.contenido
          };

          console.log('Original map data:', mapData);
          console.log('Parsed contenido:', contenido);
          console.log('Extracted seats:', allSeats);
          console.log('Transformed map data:', transformedMap);
          setMapa(transformedMap);
        } else {
          console.log('[MAPA] Usando mapa sin transformar:', mapData);
          setMapa(mapData);
        }
      } catch (err) {
        console.error('[MAPA] Error loading map:', err);
        console.error('[MAPA] Stack trace:', err.stack);
        setError(err);
        setMapa(null);
      } finally {
        setMapLoading(false);
      }
    };
    if (selectedFunctionId) fetchMap();
  }, [selectedFunctionId, funciones]); // Added funciones to dependency array

  const handleSeatToggle = useCallback(
    async (silla) => {
      const sillaId = silla._id || silla.id;

      const zona =
        mapa?.zonas?.find(z => z.asientos?.some(a => a._id === sillaId)) ||
        mapa?.contenido?.find(el =>
          el.sillas?.some(a => a._id === sillaId) && (el.zona || el.zonaId)
        ) ||
        silla.zona || {};

      const zonaId = zona?.id || zona?.zonaId || silla.zonaId;
      if (!sillaId || !selectedFunctionId) return;

      const nombreZona = zona?.nombre || 'Zona';

      // OBTENER PRECIO DE LA PLANTILLA
      let precio = 10; // Precio por defecto

      if (plantillaPrecios && plantillaPrecios.detalles) {
        try {
          const detalles = typeof plantillaPrecios.detalles === 'string'
            ? JSON.parse(plantillaPrecios.detalles)
            : plantillaPrecios.detalles;

          // Buscar precio por zona
          const precioZona = detalles.find(d =>
            d.zona_id === zonaId ||
            d.zonaId === zonaId ||
            d.zona_nombre === nombreZona ||
            d.zonaNombre === nombreZona
          );

          if (precioZona) {
            precio = precioZona.precio || precio;
            console.log('[PRECIOS] Precio encontrado para zona:', precioZona);
          }
        } catch (e) {
          console.warn('[PRECIOS] Error parsing detalles:', e);
        }
      }

      console.log('[PRECIOS] Precio final para asiento:', precio);

      // Si está bloqueado por otro usuario, no permitir acción
      if (isSeatLocked(sillaId) && !isSeatLockedByMe(sillaId)) return;

      // Verificar si el asiento ya está en el carrito
      const cartItemsState = useCartStore.getState().items;
      const exists = cartItemsState.some(item => item.sillaId === sillaId);

      if (exists) {
        // Deselección: desbloquear en DB y quitar del carrito
        await unlockSeat(sillaId, selectedFunctionId);
        removeFromCart(sillaId);
      } else {
        // Selección: bloquear en DB con status 'seleccionado' y añadir al carrito
        const ok = await lockSeat(sillaId, 'seleccionado', selectedFunctionId);
        if (!ok) return;
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
    [selectedFunctionId, mapa, toggleSeat, removeFromCart, plantillaPrecios, isSeatLocked, isSeatLockedByMe, lockSeat, unlockSeat]
  );

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
    setShowMap(true);
  };

  const handleBackToSelection = () => {
    setSelectedFunctionId(null);
    setMapa(null);
    setError(null);
    setDiagnosticReport(null);
    setShowMap(false);
  };

  const runManualDiagnostic = async () => {
    if (!selectedFunctionId) {
      message.warning('Selecciona una función primero');
      return;
    }

    const funcion = funciones.find(f => f.id === selectedFunctionId);
    if (!funcion) {
      message.error('No se encontró la función seleccionada');
      return;
    }

    const salaId = (funcion?.sala && typeof funcion.sala === 'object')
      ? (funcion.sala.id || funcion.sala._id)
      : funcion?.sala;

    if (!salaId) {
      message.error('No se pudo obtener el ID de la sala');
      return;
    }


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
  
  // Función para obtener URL de imagen con fallback
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    try {
      const resolvedUrl = resolveImageUrl(imagePath, 'eventos');
      console.log('🖼️ [EVENT_IMAGE] Resolved URL:', resolvedUrl);
      return resolvedUrl;
    } catch (error) {
      console.error('Error resolving image URL:', error);
      return null;
    }
  };

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
                   >
                    {mapLoading ? (
                      <div className="flex items-center justify-center h-96 text-gray-500">
                        Cargando mapa...
                      </div>
                    ) : mapa ? (
                      <div className="h-96 overflow-auto relative">
                        <SeatingMapUnified
                          mapa={mapa}
                          funcionId={selectedFunctionId}
                          lockSeat={lockSeat}
                          unlockSeat={unlockSeat}
                          lockTable={lockTable}
                          unlockTable={unlockTable}
                          isSeatLocked={isSeatLocked}
                          isSeatLockedByMe={isSeatLockedByMe}
                          isTableLocked={isTableLocked}
                          isTableLockedByMe={isTableLockedByMe}
                          isAnySeatInTableLocked={isAnySeatInTableLocked}
                          areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
                          onSeatToggle={handleSeatToggle}
                          onTableToggle={(table) => {
                            console.log('Mesa seleccionada:', table);
                          }}
                          foundSeats={[]}
                          selectedSeats={cartItems.map(item => item.sillaId || item.id || item._id)}
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
        {selectedFunctionId && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBackToSelection}
                >
                  Volver a selección
                </Button>
              </Col>
              

              

            </Row>
          </div>
        )}


      </div>
    );
  }

  // Página principal del evento
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner del evento */}
      <div className="relative h-64 md:h-96">
        <EventImage
          event={evento}
          imageType="banner"
          className="w-full h-full"
          showDebug={true}
        />
        
        {/* Overlay con contenido */}
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
              {/* Mostrar mensaje si el evento está desactivado */}
              {evento && (!evento.activo || evento.desactivado) && (
                <Alert
                  message="Evento Desactivado"
                  description="Este evento está actualmente desactivado. Las funciones no están disponibles para la venta."
                  type="error"
                  showIcon
                  className="mb-4"
                />
              )}
              
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
                    disabled={evento && (!evento.activo || evento.desactivado)}
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
                    <div className="mt-4 space-y-2">
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={() => setShowMap(true)}
                        className="w-full"
                      >
                        Ver Mapa de Asientos
                      </Button>
                      <Button 
                        type="default" 
                        size="large"
                        onClick={() => navigate(`/store/eventos/${eventSlug}/mapa?funcion=${selectedFunctionId}`)}
                        className="w-full"
                      >
                        Ver Mapa Completo
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
                  disabled={evento && (!evento.activo || evento.desactivado)}
                >
                  {evento && (!evento.activo || evento.desactivado) ? 'Evento Desactivado' : 'Comprar Entradas'}
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