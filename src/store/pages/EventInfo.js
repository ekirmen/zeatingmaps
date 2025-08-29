import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../supabaseClient';
import { isUuid, isNumericId } from '../../utils/isUuid';
import { getFunciones } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';

const EventInfo = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        setLoading(true);
        const query = supabase
          .from('eventos')
          .select(`
            *,
            recintos!recinto_id (
              id,
              nombre,
              direccion,
              capacidad
            )
          `);
        
        const { data, error } = await (
          isUuid(eventId)
            ? query.eq('id', eventId)
            : isNumericId(eventId)
              ? query.eq('id', parseInt(eventId, 10))
              : query.ilike('slug', eventId)
        ).maybeSingle();
        
        if (error) throw error;
        setEvento(data);
        setVenueInfo(data?.recintos);
      } catch (err) {
        console.error('Error fetching evento:', err);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const fetchFuncionesData = async () => {
      const id = evento?.id || (isUuid(eventId) ? eventId : parseInt(eventId));
      if (!id) return;
      try {
        const data = await getFunciones(id);
        setFunciones(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          const fid = data[0].id || data[0]._id;
          // Auto-select the only available function but stay on this page
          setSelectedFunctionId(fid);
        }
      } catch (err) {
        console.error('Error fetching funciones:', err);
      }
    };
    if (evento) fetchFuncionesData();
  }, [evento, eventId, navigate]);

  const handleSelect = () => {
    if (selectedFunctionId) {
      const eventPath = (evento && evento.slug) ? evento.slug : eventId;
      navigate(`/store/event/${eventPath}/map?funcion=${selectedFunctionId}`);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Evento no encontrado</h1>
          <p className="text-gray-600">El evento que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      {bannerImage && (
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={resolveImageUrl(bannerImage)}
            alt={evento.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/1200x400/E0F2F7/000?text=${evento.nombre}`;
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{evento.nombre}</h1>
            {venueInfo && (
              <p className="text-lg opacity-90">{venueInfo.nombre}</p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6">
        {/* Event Header (when no banner) */}
        {!bannerImage && (
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{evento.nombre}</h1>
            {venueInfo && (
              <p className="text-xl text-gray-600">{venueInfo.nombre}</p>
            )}
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Thumbnail Image */}
            {thumbnailImage && !bannerImage && (
              <div className="mb-6">
                <img
                  src={resolveImageUrl(thumbnailImage)}
                  alt={evento.nombre}
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/600x400/E0F2F7/000?text=${evento.nombre}`;
                  }}
                />
              </div>
            )}

            {/* Event Description */}
            {evento.descripcionHTML && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Descripción del Evento</h2>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
                />
              </div>
            )}

            {/* Functions Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Funciones Disponibles</h2>
              
              {/* Mostrar mensaje si el evento está desactivado */}
              {evento && (!evento.activo || evento.desactivado) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Evento Desactivado</h3>
                      <p className="text-sm text-red-700">Este evento está actualmente desactivado. Las funciones no están disponibles para la venta.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {funciones.length > 0 ? (
                <div className="space-y-3">
                  {funciones.map((f) => (
                    <label key={f.id || f._id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="funcion"
                        value={f.id || f._id}
                        checked={selectedFunctionId === (f.id || f._id)}
                        onChange={() => setSelectedFunctionId(f.id || f._id)}
                        className="mr-3"
                        disabled={evento && (!evento.activo || evento.desactivado)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {formatDateString(f.fechaCelebracion)}
                        </div>
                        {f.sala && (
                          <div className="text-sm text-gray-600">
                            Sala: {f.sala.nombre}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No hay funciones disponibles para este evento.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Venue Information */}
            {venueInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Recinto</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{venueInfo.nombre}</h4>
                    {venueInfo.direccion && (
                      <p className="text-sm text-gray-600">{venueInfo.direccion}</p>
                    )}
                  </div>
                  {venueInfo.capacidad && (
                    <div className="text-sm text-gray-600">
                      Capacidad: {venueInfo.capacidad} personas
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Evento</h3>
              <div className="space-y-3 text-sm">
                {evento.fecha_evento && (
                  <div>
                    <span className="font-medium text-gray-700">Fecha:</span>
                    <div className="text-gray-600">
                      {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
                {evento.estadoVenta && (
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <div className="text-gray-600 capitalize">
                      {evento.estadoVenta.replace(/-/g, ' ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handleSelect}
                disabled={!selectedFunctionId || (evento && (!evento.activo || evento.desactivado))}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {evento && (!evento.activo || evento.desactivado) 
                  ? 'Evento Desactivado' 
                  : (selectedFunctionId ? 'Seleccionar Asientos' : 'Selecciona una función')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInfo;
