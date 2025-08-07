import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, message, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { getFuncion, fetchMapa, getFunciones } from '../services/apistore';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useCartRestore from '../../store/hooks/useCartRestore';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import Cart from './Cart';

const EventosMapPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const funcionParam = searchParams.get('funcion');

  const [evento, setEvento] = useState(null);
  const [funcion, setFuncion] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [priceTemplate, setPriceTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const cartItems = useCartStore((state) => state.items);
  const cartProducts = useCartStore((state) => state.products);
  const clearCart = useCartStore((state) => state.clearCart);
  const getItemCount = useCartStore((state) => state.getItemCount);
  
  const {
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe,
    lockSeat,
    unlockSeat,
    lockTable,
    unlockTable,
    subscribeToFunction,
    unsubscribe
  } = useSeatLockStore();

  // Suscribirse a función
  useEffect(() => {
    if (!funcionParam) return;
    subscribeToFunction(funcionParam);
    return () => unsubscribe();
  }, [funcionParam]);

  // Cargar datos del evento y función
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[EventosMapPage] Cargando datos para:', { eventSlug, funcionParam });
        
        if (!funcionParam) {
          throw new Error('No se especificó una función');
        }

        // Obtener evento por slug - intentar múltiples métodos
        let eventData = null;
        let eventError = null;

        // Método 1: Búsqueda exacta por slug
        const { data: exactMatch, error: exactError } = await supabase
          .from('eventos')
          .select('*')
          .eq('slug', eventSlug)
          .maybeSingle();

        if (exactMatch && !exactError) {
          eventData = exactMatch;
          console.log('[EventosMapPage] Evento encontrado por slug exacto:', eventData);
        } else {
          // Método 2: Búsqueda por nombre similar
          const { data: similarMatch, error: similarError } = await supabase
            .from('eventos')
            .select('*')
            .ilike('nombre', `%${eventSlug}%`)
            .maybeSingle();

          if (similarMatch && !similarError) {
            eventData = similarMatch;
            console.log('[EventosMapPage] Evento encontrado por nombre similar:', eventData);
          } else {
            // Método 3: Búsqueda por ID si es numérico
            if (!isNaN(eventSlug)) {
              const { data: idMatch, error: idError } = await supabase
                .from('eventos')
                .select('*')
                .eq('id', parseInt(eventSlug))
                .maybeSingle();

              if (idMatch && !idError) {
                eventData = idMatch;
                console.log('[EventosMapPage] Evento encontrado por ID:', eventData);
              } else {
                eventError = idError;
              }
            } else {
              eventError = new Error('Evento no encontrado');
            }
          }
        }

        if (eventError) throw eventError;
        if (!eventData) throw new Error(`Evento no encontrado para slug: ${eventSlug}`);
        
        setEvento(eventData);

        // Obtener función específica
        console.log('[EventosMapPage] Obteniendo función:', funcionParam);
        const funcionData = await getFuncion(funcionParam);
        if (!funcionData) throw new Error(`Función no encontrada para ID: ${funcionParam}`);
        
        console.log('[EventosMapPage] Función encontrada:', funcionData);
        setFuncion(funcionData);

        // Cargar mapa si la función tiene sala
        if (funcionData?.sala?.id) {
          console.log('[EventosMapPage] Cargando mapa para sala:', funcionData.sala.id);
          const mapData = await fetchMapa(funcionData.sala.id);
          console.log('[EventosMapPage] Datos del mapa:', mapData);
          setMapa(mapData);
        } else {
          console.warn('[EventosMapPage] Función no tiene sala asociada');
        }

        // Cargar plantilla de precios
        if (funcionData?.plantilla) {
          setPriceTemplate(funcionData.plantilla);
        }

      } catch (err) {
        console.error('[EventosMapPage] Error loading data:', err);
        setError(err);
        message.error(`Error al cargar los datos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug && funcionParam) {
      fetchData();
    }
  }, [eventSlug, funcionParam]);

  const handleSeatToggle = useCallback(
    (silla) => {
      const sillaId = silla._id || silla.id;
      const zona = mapa?.zonas?.find(z =>
        z.asientos?.some(a => a._id === sillaId)
      );
      const zonaId = zona?.id;
      if (!sillaId || !zonaId || !funcionParam) return;

      const nombreZona = zona?.nombre || 'Zona';
      const detalle = priceTemplate?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 0;

      toggleSeat({
        sillaId,
        zonaId,
        precio,
        nombre: silla.nombre || silla.numero || silla._id,
        nombreZona,
        functionId: funcionParam,
      });
    },
    [funcionParam, mapa, priceTemplate, toggleSeat]
  );

  const handleBackToEvent = () => {
    navigate(`/store/eventos/${eventSlug}`);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Alert
            message="Error"
            description={error.message}
            type="error"
            showIcon
            className="mb-4"
          />
          <Button 
            type="primary" 
            onClick={handleBackToEvent}
            icon={<ArrowLeftOutlined />}
          >
            Volver al Evento
          </Button>
        </div>
      </div>
    );
  }

  if (!evento || !funcion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Datos no encontrados</h2>
          <p className="text-gray-500 mb-4">
            No se pudo encontrar el evento "{eventSlug}" o la función "{funcionParam}"
          </p>
          <Button 
            type="primary" 
            onClick={handleBackToEvent}
            icon={<ArrowLeftOutlined />}
          >
            Volver al Evento
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
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToEvent}
                className="flex items-center"
              >
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{evento.nombre}</h1>
                <p className="text-sm text-gray-600">
                  {funcion.nombre || 'Función'} - {new Date(funcion.fecha_celebracion).toLocaleString('es-ES')}
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
                  icon={<ShoppingCartOutlined />}
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
          {/* Mapa de asientos */}
          <div className="lg:col-span-3">
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
                    onSeatClick={handleSeatToggle}
                    onTableToggle={(table) => {
                      // Manejar selección de mesa completa
                      console.log('Mesa seleccionada:', table);
                      // Aquí puedes implementar la lógica para seleccionar todos los asientos de la mesa
                    }}
                    selectedSeats={cartItems ? cartItems.map(item => item.sillaId) : []}
                    isSeatLocked={isSeatLocked}
                    isSeatLockedByMe={isSeatLockedByMe}
                    isTableLocked={isTableLocked}
                    isTableLockedByMe={isTableLockedByMe}
                    isAnySeatInTableLocked={isAnySeatInTableLocked}
                    areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
                    lockSeat={lockSeat}
                    unlockSeat={unlockSeat}
                    lockTable={lockTable}
                    unlockTable={unlockTable}
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
          </div>

          {/* Panel lateral - Carrito */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Cart />
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8">
          <Card title="Información de la función">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Detalles del evento</h4>
                <p className="text-gray-600">{evento.descripcion || 'Sin descripción'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Información de la función</h4>
                <p className="text-gray-600">
                  <strong>Fecha:</strong> {new Date(funcion.fecha_celebracion).toLocaleDateString('es-ES')}<br />
                  <strong>Hora:</strong> {new Date(funcion.fecha_celebracion).toLocaleTimeString('es-ES')}<br />
                  {funcion.sala && (
                    <>
                      <strong>Sala:</strong> {funcion.sala.nombre}<br />
                    </>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventosMapPage; 