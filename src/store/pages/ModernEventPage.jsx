import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Select, message, Spin, Alert, Row, Col, Badge, Divider } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  ShoppingCartOutlined,
  StarOutlined,
  ShareAltOutlined,
  HeartOutlined,
  InfoCircleOutlined
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

const { Option } = Select;

const ModernEventPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
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
            setShowMap(true);
          }
        } else if (funcionesData && funcionesData.length === 1) {
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

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
    setShowMap(true);
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

  const handleProceedToCart = () => {
    if (getItemCount() === 0) {
      message.warning('No hay items en el carrito');
      return;
    }
    navigate('/store/cart');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <EventImage
          event={evento}
          imageType="banner"
          className="w-full h-full object-cover"
          showDebug={true}
        />
        
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Contenido del hero */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  {evento.nombre}
                </h1>
                {evento.descripcion && (
                  <p className="text-xl md:text-2xl max-w-3xl opacity-90 leading-relaxed">
                    {evento.descripcion}
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
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="font-medium">Estado: {evento.estadoVenta || 'Disponible'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-3">
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
            </Card>

            {/* Mapa de asientos */}
            {showMap && selectedFunctionId && (
              <Card 
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarOutlined className="text-green-500 mr-2" />
                      <span className="text-xl font-semibold">Selección de Asientos</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {getItemCount()} asientos seleccionados
                      </div>
                      <Button 
                        type="primary" 
                        icon={<ShoppingCartOutlined />}
                        onClick={handleProceedToCart}
                        disabled={getItemCount() === 0}
                        size="large"
                      >
                        Ver Carrito
                      </Button>
                    </div>
                  </div>
                }
                className="mb-8 shadow-lg border-0"
              >
                {mapLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Spin size="large" />
                    <span className="ml-4 text-gray-600">Cargando mapa de asientos...</span>
                  </div>
                ) : mapa ? (
                  <div className="h-96 overflow-auto relative bg-gray-50 rounded-lg">
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
                      <CalendarOutlined className="text-6xl mb-4 opacity-50" />
                      <p className="text-lg font-semibold mb-2">No hay mapa disponible</p>
                      <p className="text-sm">No se encontró un mapa de asientos para esta función</p>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Panel lateral - Carrito */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Cart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernEventPage;
