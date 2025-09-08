import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Card, message, Spin, Alert, Badge, Tag, Descriptions, Statistic } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  ShoppingCartOutlined,
  ShareAltOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  UserOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  TagsOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { getFunciones } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useCartRestore from '../../store/hooks/useCartRestore';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import Cart from './Cart';
import EventImage from '../components/EventImage';


const ModernEventPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Detectar si estamos en la vista del mapa
  const isMapView = location.pathname.includes('/map');

  // Flag de depuración global (desactivado por defecto)
  const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  
  // Debug logs (controlados por flag)
  if (DEBUG) {
    console.log('🔍 [ModernEventPage] Debug info:', {
      isMapView,
      selectedFunctionId,
      eventSlug,
      pathname: location.pathname,
      searchParams: searchParams.toString()
    });
  }
  const [mapa, setMapa] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe
  } = useSeatLockStore();

  // Cargar evento y funciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from('eventos')
          .select('*')
          .ilike('slug', eventSlug)
          .maybeSingle();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Evento no encontrado');
        
        setEvento(eventData);

        // Cargar recinto
        const recintoId = eventData.recinto_id || eventData.recinto || null;
        if (recintoId) {
          const { data: recData, error: recErr } = await supabase
            .from('recintos')
            .select('id, nombre, direccion, capacidad')
            .eq('id', recintoId)
            .maybeSingle();
          if (!recErr) setVenueInfo(recData || null);
        }

        // Obtener funciones
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);

        // Seleccionar función automáticamente
        const funcionParam = searchParams.get('funcion');
        if (funcionParam && funcionesData) {
          const funcion = funcionesData.find(
            f => String(f.id) === funcionParam || String(f._id) === funcionParam
          );
          if (funcion) {
            const fid = funcion.id || funcion._id;
            setSelectedFunctionId(fid);
          }
        } else if (funcionesData && funcionesData.length === 1) {
          const fid = funcionesData[0].id || funcionesData[0]._id;
          setSelectedFunctionId(fid);
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

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  // Cargar mapa cuando estemos en la vista del mapa
  useEffect(() => {
    if (DEBUG) console.log('🔍 [ModernEventPage] useEffect mapa - isMapView:', isMapView, 'selectedFunctionId:', selectedFunctionId);
    
    if (!isMapView || !selectedFunctionId) {
      if (DEBUG) console.log('⚠️ [ModernEventPage] No cargando mapa - condiciones no cumplidas');
      return;
    }
    
    const fetchMapa = async () => {
      try {
        setMapLoading(true);
        if (DEBUG) console.log('🗺️ [ModernEventPage] Cargando mapa para función:', selectedFunctionId);

        // Obtener sala_id de la función seleccionada (soporta esquemas nuevo y antiguo)
        const selectedFuncion = funciones.find(f => (f.id || f._id) === selectedFunctionId);
        const salaId = selectedFuncion?.sala_id ?? selectedFuncion?.sala;

        if (!salaId) {
          console.warn('⚠️ [ModernEventPage] No se pudo determinar sala_id para la función:', selectedFunctionId);
          setMapa(null);
          setMapLoading(false);
          return;
        }

        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', salaId)
          .maybeSingle();

        if (DEBUG) console.log('🔍 [ModernEventPage] Respuesta de mapas:', { mapaData, mapaError });

        if (mapaError) throw mapaError;
        
        if (mapaData) {
          setMapa(mapaData);
          if (DEBUG) console.log('✅ [ModernEventPage] Mapa cargado:', mapaData.id);
        } else {
          if (DEBUG) console.log('⚠️ [ModernEventPage] No se encontró mapa para la función:', selectedFunctionId);
        }
      } catch (err) {
        console.error('❌ [ModernEventPage] Error cargando mapa:', err);
        message.error('Error al cargar el mapa de asientos');
      } finally {
        setMapLoading(false);
      }
    };

    fetchMapa();
  }, [isMapView, selectedFunctionId]);

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
  };

  const handleSeatToggle = async (sillaId) => {
    if (!selectedFunctionId) return;

    if (isSeatLocked(sillaId) && !isSeatLockedByMe(sillaId)) return;

    const cartItemsState = useCartStore.getState().items;
    const exists = cartItemsState.some(item => item.sillaId === sillaId);

    if (exists) {
      await unlockSeat(sillaId, selectedFunctionId);
      removeFromCart(sillaId);
    } else {
      const ok = await lockSeat(sillaId, 'seleccionado', selectedFunctionId);
      if (!ok) return;
      toggleSeat({
        sillaId,
        nombre: `Asiento ${sillaId}`,
        precio: 50, // Precio por defecto
        nombreZona: 'General',
        functionId: selectedFunctionId,
      });
    }
  };

  const handleTableToggle = (table) => {
    console.log('Mesa seleccionada:', table);
    // Por ahora solo mostrar información de la mesa
    // En el futuro se puede implementar lógica para seleccionar toda la mesa
  };


  // Funciones para parsear campos JSON
  const parseJsonField = (field) => {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      return null;
    }
  };

  const getEventTags = () => {
    const tags = parseJsonField(evento.tags);
    return Array.isArray(tags) ? tags : [];
  };

  const getAnalytics = () => {
    return parseJsonField(evento.analytics) || {};
  };

  const getDatosBoleto = () => {
    return parseJsonField(evento.datosBoleto) || {};
  };

  const getDatosComprador = () => {
    return parseJsonField(evento.datosComprador) || {};
  };

  const getOtrasOpciones = () => {
    return parseJsonField(evento.otrasOpciones) || {};
  };


  // Función para obtener el estado visual del evento
  const getEventStatus = () => {
    if (evento.desactivado) return { status: 'error', text: 'Desactivado', icon: <CloseCircleOutlined /> };
    if (!evento.activo) return { status: 'warning', text: 'Inactivo', icon: <ExclamationCircleOutlined /> };
    if (evento.estadoVenta === 'a-la-venta') return { status: 'success', text: 'A la Venta', icon: <CheckCircleOutlined /> };
    if (evento.estadoVenta === 'agotado') return { status: 'error', text: 'Agotado', icon: <CloseCircleOutlined /> };
    if (evento.estadoVenta === 'pronto') return { status: 'processing', text: 'Pronto', icon: <ClockCircleOutlined /> };
    return { status: 'default', text: 'Disponible', icon: <InfoCircleOutlined /> };
  };

  // Función para obtener el modo de venta
  const getModoVenta = () => {
    const modos = {
      'normal': { text: 'Venta Normal', color: 'blue' },
      'preventa': { text: 'Preventa', color: 'orange' },
      'especial': { text: 'Venta Especial', color: 'purple' },
      'gratis': { text: 'Evento Gratuito', color: 'green' }
    };
    return modos[evento.modoVenta] || { text: evento.modoVenta || 'Normal', color: 'default' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert
          message="Error"
          description="No se pudo cargar el evento"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const modoVenta = getModoVenta();
  const tags = getEventTags();
  const analytics = getAnalytics();

  // Si estamos en la vista del mapa, mostrar el mapa y el carrito
  if (isMapView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header con información básica del evento */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate(`/store/eventos/${eventSlug}`)}
                >
                  Volver a Evento
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">{evento.nombre}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Badge status={eventStatus.status} text={eventStatus.text} />
                <Tag color={modoVenta.color}>{modoVenta.text}</Tag>
              </div>
            </div>
            
            {/* Información de la función */}
            {selectedFunctionId && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <CalendarOutlined className="text-blue-500" />
                    <span className="font-medium">
                      {funciones.find(f => f.id === selectedFunctionId)?.fecha || 'Fecha no disponible'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockCircleOutlined className="text-green-500" />
                    <span className="font-medium">
                      {funciones.find(f => f.id === selectedFunctionId)?.hora || 'Hora no disponible'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EnvironmentOutlined className="text-red-500" />
                    <span className="font-medium">
                      {evento.recinto || 'Recinto no disponible'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layout del mapa y carrito */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', minHeight: '600px' }}>
            {/* Mapa de asientos - 2/3 del ancho */}
            <div style={{ flex: '2', minWidth: '0' }}>
              <Card 
                title={
                  <div className="flex items-center">
                    <ShoppingCartOutlined className="text-blue-500 mr-2" />
                    <span className="font-semibold">Selección de Asientos</span>
                  </div>
                }
                className="shadow-lg border-0"
                style={{ height: '100%' }}
              >
                {mapLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Spin size="large" />
                    <span className="ml-3">Cargando mapa de asientos...</span>
                  </div>
                ) : mapa ? (
                  <SeatingMapUnified
                    mapa={mapa}
                    funcionId={selectedFunctionId}
                    onSeatToggle={handleSeatToggle}
                    isSeatLocked={isSeatLocked}
                    isSeatLockedByMe={isSeatLockedByMe}
                    isTableLocked={isTableLocked}
                    isTableLockedByMe={isTableLockedByMe}
                    isAnySeatInTableLocked={isAnySeatInTableLocked}
                    areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
                    onTableToggle={handleTableToggle}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <Alert
                      message="No hay mapa disponible"
                      description="Este evento no tiene un mapa de asientos configurado."
                      type="warning"
                      showIcon
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Carrito - 1/3 del ancho */}
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <Cart
                items={cartItems}
                removeFromCart={removeFromCart}
                getItemCount={getItemCount}
                selectedFunctionId={selectedFunctionId}
                evento={evento}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  const datosBoleto = getDatosBoleto();
  const datosComprador = getDatosComprador();
  const otrasOpciones = getOtrasOpciones();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <EventImage
          event={evento}
          imageType="logoHorizontal"
          className="w-full h-full object-cover"
          showDebug={DEBUG}
        />
        
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Contenido del hero */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-white">
                <div className="flex items-center gap-4 mb-4">
                  <Badge 
                    status={eventStatus.status} 
                    text={eventStatus.text}
                    className="text-white"
                  />
                  <Tag color={modoVenta.color} className="text-sm">
                    {modoVenta.text}
                  </Tag>
                  {evento.oculto && (
                    <Tag color="red" icon={<EyeInvisibleOutlined />}>
                      Oculto
                    </Tag>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  {evento.nombre}
                </h1>
                
                {evento.descripcion && (
                  <p className="text-xl md:text-2xl max-w-3xl opacity-90 leading-relaxed mb-6">
                    {evento.descripcion}
                  </p>
                )}

                {evento.resumenDescripcion && (
                  <p className="text-lg max-w-3xl opacity-80 leading-relaxed">
                    {evento.resumenDescripcion}
                  </p>
                )}
                
                {/* Información rápida */}
                <div className="flex flex-wrap gap-6 mt-6">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <CalendarOutlined className="text-white mr-2" />
                    <span className="font-medium">{formatDateString(evento.fecha_evento)}</span>
                  </div>
                  {venueInfo && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <EnvironmentOutlined className="text-white mr-2" />
                      <span className="font-medium">{venueInfo.nombre}</span>
                    </div>
                  )}
                  {evento.sector && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <TeamOutlined className="text-white mr-2" />
                      <span className="font-medium">{evento.sector}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {/* Información básica del evento */}
            <Card 
              title={
                <div className="flex items-center">
                  <InfoCircleOutlined className="text-blue-500 mr-2" />
                  <span className="text-xl font-semibold">Información del Evento</span>
                </div>
              }
              className="mb-8 shadow-lg border-0"
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Nombre" span={2}>
                  <strong>{evento.nombre}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Fecha del Evento">
                  {formatDateString(evento.fecha_evento)}
                </Descriptions.Item>
                <Descriptions.Item label="Recinto">
                  {venueInfo ? venueInfo.nombre : `ID: ${evento.recinto}`}
                </Descriptions.Item>
                <Descriptions.Item label="Sala">
                  {evento.sala ? `ID: ${evento.sala}` : 'No especificada'}
                </Descriptions.Item>
                <Descriptions.Item label="Sector">
                  {evento.sector || 'No especificado'}
                </Descriptions.Item>
                <Descriptions.Item label="Estado de Venta">
                  <Badge status={eventStatus.status} text={eventStatus.text} />
                </Descriptions.Item>
                <Descriptions.Item label="Modo de Venta">
                  <Tag color={modoVenta.color}>{modoVenta.text}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Activo">
                  <Badge 
                    status={evento.activo ? 'success' : 'error'} 
                    text={evento.activo ? 'Sí' : 'No'} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Oculto">
                  <Badge 
                    status={evento.oculto ? 'error' : 'success'} 
                    text={evento.oculto ? 'Sí' : 'No'} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Desactivado">
                  <Badge 
                    status={evento.desactivado ? 'error' : 'success'} 
                    text={evento.desactivado ? 'Sí' : 'No'} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="Creado">
                  {formatDateString(evento.created_at)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Descripción HTML */}
            {evento.descripcionHTML && (
              <Card 
                title={
                  <div className="flex items-center">
                    <FileTextOutlined className="text-green-500 mr-2" />
                    <span className="text-xl font-semibold">Descripción del Evento</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
                />
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <TagsOutlined className="text-purple-500 mr-2" />
                    <span className="text-xl font-semibold">Etiquetas</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Tag key={index} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            {/* Funciones disponibles */}
            <Card 
              title={
                <div className="flex items-center">
                  <CalendarOutlined className="text-blue-500 mr-2" />
                  <span className="text-xl font-semibold">Funciones Disponibles</span>
                </div>
              }
              className="mb-8 shadow-lg border-0"
            >
              {funciones.length === 0 ? (
                <Alert
                  message="No hay funciones disponibles"
                  description="Este evento no tiene funciones programadas."
                  type="warning"
                  showIcon
                />
              ) : (
                <div className="space-y-4">
                  {funciones.map((funcion) => (
                    <div 
                      key={funcion.id || funcion._id}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedFunctionId === (funcion.id || funcion._id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleFunctionSelect(funcion.id || funcion._id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {new Date(funcion.fecha).getDate()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {formatDateString(funcion.fecha)}
                            </h3>
                            <p className="text-gray-600 flex items-center">
                              <ClockCircleOutlined className="mr-1" />
                              {funcion.hora}
                            </p>
                            {venueInfo && (
                              <p className="text-gray-500 text-sm flex items-center">
                                <EnvironmentOutlined className="mr-1" />
                                {venueInfo.nombre}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          type={selectedFunctionId === (funcion.id || funcion._id) ? 'primary' : 'default'}
                          size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFunctionSelect(funcion.id || funcion._id);
                          }}
                          className="px-8"
                        >
                          {selectedFunctionId === (funcion.id || funcion._id) ? 'Seleccionado' : 'Seleccionar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Configuración de datos del boleto */}
            {Object.keys(datosBoleto).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <SettingOutlined className="text-orange-500 mr-2" />
                    <span className="text-xl font-semibold">Configuración del Boleto</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <Descriptions column={2} bordered>
                  {Object.entries(datosBoleto).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {/* Configuración de datos del comprador */}
            {Object.keys(datosComprador).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <UserOutlined className="text-cyan-500 mr-2" />
                    <span className="text-xl font-semibold">Configuración del Comprador</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <Descriptions column={2} bordered>
                  {Object.entries(datosComprador).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {/* Otras opciones */}
            {Object.keys(otrasOpciones).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <SettingOutlined className="text-gray-500 mr-2" />
                    <span className="text-xl font-semibold">Otras Opciones</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <Descriptions column={2} bordered>
                  {Object.entries(otrasOpciones).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : typeof value === 'object' ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {/* Analytics */}
            {Object.keys(analytics).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <BarChartOutlined className="text-green-500 mr-2" />
                    <span className="text-xl font-semibold">Analytics</span>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                <Descriptions column={2} bordered>
                  {Object.entries(analytics).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Estadísticas del evento */}
              <Card 
                title={
                  <div className="flex items-center">
                    <TrophyOutlined className="text-yellow-500 mr-2" />
                    <span className="font-semibold">Estadísticas</span>
                  </div>
                }
                className="shadow-lg border-0"
              >
                <div className="space-y-4">
                  <Statistic 
                    title="Funciones" 
                    value={funciones.length} 
                    prefix={<CalendarOutlined />}
                  />
                  <Statistic 
                    title="Estado" 
                    value={eventStatus.text}
                    prefix={eventStatus.icon}
                  />
                  {venueInfo && (
                    <Statistic 
                      title="Recinto" 
                      value={venueInfo.nombre}
                      prefix={<EnvironmentOutlined />}
                    />
                  )}
                </div>
              </Card>

              {/* Acciones */}
              <Card 
                title={
                  <div className="flex items-center">
                    <SettingOutlined className="text-blue-500 mr-2" />
                    <span className="font-semibold">Acciones</span>
                  </div>
                }
                className="shadow-lg border-0"
              >
                <div className="space-y-3">
                  <Button 
                    type="primary" 
                    block 
                    icon={<CalendarOutlined />}
                    onClick={() => {
                      // Si hay una función seleccionada, incluirla en la URL
                      const url = selectedFunctionId 
                        ? `/store/eventos/${eventSlug}/map?funcion=${selectedFunctionId}`
                        : `/store/eventos/${eventSlug}/map`;
                      navigate(url);
                    }}
                  >
                    Ver Mapa de Asientos
                  </Button>
                  
                  <Button 
                    block 
                    icon={<ShareAltOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      message.success('Enlace copiado al portapapeles');
                    }}
                  >
                    Compartir Evento
                  </Button>
                  
                  <Button 
                    block 
                    icon={<HeartOutlined />}
                    onClick={() => message.info('Función de favoritos próximamente')}
                  >
                    Agregar a Favoritos
                  </Button>
                </div>
              </Card>

              {/* Información técnica */}
              <Card 
                title={
                  <div className="flex items-center">
                    <InfoCircleOutlined className="text-gray-500 mr-2" />
                    <span className="font-semibold">Información Técnica</span>
                  </div>
                }
                className="shadow-lg border-0"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID del Evento:</span>
                    <code className="text-xs">{evento.id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slug:</span>
                    <code className="text-xs">{evento.slug}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant ID:</span>
                    <code className="text-xs">{evento.tenant_id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usuario ID:</span>
                    <code className="text-xs">{evento.usuario_id}</code>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernEventPage;
