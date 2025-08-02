import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Select, message, Spin } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../supabaseClient';
import { isUuid, isNumericId } from '../../utils/isUuid';
import { getFunciones, getFuncion, fetchMapa } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useCartRestore from '../../store/hooks/useCartRestore';

const { Option } = Select;

const EventosPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [priceTemplate, setPriceTemplate] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);
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
          const funcion = funcionesData.find(f => f.id == funcionParam || f._id == funcionParam);
          if (funcion) {
            setSelectedFunctionId(funcion.id || funcion._id);
          }
        } else if (funcionesData && funcionesData.length === 1) {
          // Si solo hay una función, seleccionarla automáticamente
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

  // Cargar mapa y plantilla de precios
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const funcion = await getFuncion(selectedFunctionId);
        if (funcion?.sala?.id) {
          const mapData = await fetchMapa(funcion.sala.id);
          setMapa(mapData);
        }
        if (funcion?.plantilla) {
          setPriceTemplate(funcion.plantilla);
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
      const detalle = priceTemplate?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 0;

      toggleSeat({
        sillaId,
        zonaId,
        precio,
        nombre: silla.nombre || silla.numero || silla._id,
        nombreZona,
        functionId: selectedFunctionId,
      });
    },
    [selectedFunctionId, mapa, priceTemplate, toggleSeat]
  );

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
    // Navegar a la página del mapa con la función seleccionada
    navigate(`/store/eventos/${eventSlug}/map?funcion=${functionId}`);
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
              {evento.fecha_inicio && (
                <div className="flex items-center text-gray-600 mb-4">
                  <CalendarOutlined className="mr-2" />
                  <span>
                    {formatDateString(evento.fecha_inicio)}
                    {evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio && (
                      <span> - {formatDateString(evento.fecha_fin)}</span>
                    )}
                  </span>
                </div>
              )}
            </Card>

            {/* Selección de función */}
            <Card title="Seleccionar Función" className="mb-6">
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
                      onClick={() => navigate(`/store/eventos/${eventSlug}/map?funcion=${selectedFunctionId}`)}
                      className="w-full"
                    >
                      Ver Mapa de Asientos
                    </Button>
                  </div>
                )}
              </div>
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

                {funciones.length > 0 && (
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
                  onClick={() => navigate(`/store/eventos/${eventSlug}/map?funcion=${selectedFunctionId}`)}
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