import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import resolveImageUrl from '../../utils/resolveImageUrl';
import formatDateString from '../../utils/formatDateString';

const FunctionInfoWidget = ({ functionId, showPricing = true, showVenueInfo = true }) => {
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunctionData = async () => {
      try {
        setLoading(true);
        
        // Fetch function with related data
        const { data: functionInfo, error: functionError } = await supabase
          .from('funciones')
          .select(`
            *,
            evento:eventos (
              id,
              nombre,
              slug,
              descripcionHTML,
              imagenes,
              estadoVenta,
              fecha_evento
            ),
            sala:salas (
              id,
              nombre,
              recinto:recintos!recinto_id (
                id,
                nombre,
                direccion,
                capacidad
              )
            ),
            plantilla:plantillas (
              id,
              nombre,
              detalles
            )
          `)
          .eq('id', functionId)
          .single();

        if (functionError) throw functionError;
        
        setFunctionData(functionInfo);
        setEventData(functionInfo.evento);
        setVenueData(functionInfo.sala?.recinto);

      } catch (error) {
        console.error('Error fetching function data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (functionId) {
      fetchFunctionData();
    }
  }, [functionId]);

  const getEventImages = () => {
    if (!eventData?.imagenes) return {};
    
    try {
      if (typeof eventData.imagenes === 'string') {
        return JSON.parse(eventData.imagenes);
      }
      return eventData.imagenes;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return {};
    }
  };

  const getPricingDetails = () => {
    if (!functionData?.plantilla?.detalles) return [];
    
    try {
      const detalles = typeof functionData.plantilla.detalles === 'string' 
        ? JSON.parse(functionData.plantilla.detalles)
        : functionData.plantilla.detalles;
      
      return Array.isArray(detalles) ? detalles : [];
    } catch (e) {
      console.error('Error parsing pricing details:', e);
      return [];
    }
  };

  const handleSelectSeats = () => {
    if (eventData?.slug) {
      navigate(`/store/eventos/${eventData.slug}?funcion=${functionId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!functionData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600">Función no encontrada</p>
      </div>
    );
  }

  const images = getEventImages();
  const bannerImage = images.banner || images.portada || images.obraImagen;
  const pricingDetails = getPricingDetails();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Event Banner */}
      {bannerImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={resolveImageUrl(bannerImage)}
            alt={eventData?.nombre || 'Evento'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/600x300/E0F2F7/000?text=${eventData?.nombre || 'Evento'}`;
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-xl font-bold mb-1">{eventData?.nombre}</h2>
            {venueData && (
              <p className="text-sm opacity-90">{venueData.nombre}</p>
            )}
          </div>
        </div>
      )}

      {/* Function Details */}
      <div className="p-6">
        {/* Function Header */}
        {!bannerImage && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{eventData?.nombre}</h2>
            {venueData && (
              <p className="text-gray-600">{venueData.nombre}</p>
            )}
          </div>
        )}

        {/* Function Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalles de la Función</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Fecha y Hora</div>
                <div className="text-sm text-gray-600">{formatDateString(functionData.fechaCelebracion)}</div>
              </div>
            </div>

            {functionData.sala && (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Sala</div>
                  <div className="text-sm text-gray-600">{functionData.sala.nombre}</div>
                </div>
              </div>
            )}

            {functionData.inicioVenta && (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Inicio de Venta</div>
                  <div className="text-sm text-gray-600">{formatDateString(functionData.inicioVenta)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Information */}
        {showPricing && pricingDetails.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Precios y Zonas</h3>
            <div className="space-y-2">
              {pricingDetails.map((detail, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {detail.zona?.nombre || detail.zonaId || `Zona ${index + 1}`}
                    </div>
                    {detail.descripcion && (
                      <div className="text-sm text-gray-600">{detail.descripcion}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ${detail.precio?.toFixed(2) || '0.00'}
                    </div>
                    {detail.capacidad && (
                      <div className="text-xs text-gray-500">
                        {detail.capacidad} asientos
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue Information */}
        {showVenueInfo && venueData && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Recinto</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 flex-shrink-0 mr-3">
                  <img
                    src={`https://placehold.co/200x200/E0F2F7/000?text=${venueData.nombre?.charAt(0) || 'R'}`}
                    alt={venueData.nombre}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{venueData.nombre}</h4>
                  {venueData.direccion && (
                    <p className="text-sm text-gray-600">{venueData.direccion}</p>
                  )}
                </div>
              </div>
              {venueData.capacidad && (
                <p className="text-sm text-gray-600">
                  Capacidad: {venueData.capacidad} personas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Event Status */}
        {eventData?.estadoVenta && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Estado de Venta</h3>
            <div className="flex items-center">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                eventData.estadoVenta === 'a-la-venta' 
                  ? 'bg-green-100 text-green-800' 
                  : eventData.estadoVenta === 'agotado'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {eventData.estadoVenta.replace(/-/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleSelectSeats}
            disabled={eventData?.estadoVenta === 'agotado'}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {eventData?.estadoVenta === 'agotado' ? 'Agotado' : 'Seleccionar Asientos'}
          </button>
        </div>

        {/* Additional Options */}
        <div className="mt-4 space-y-2">
          {functionData.pagoAPlazos && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Pago a plazos disponible
            </div>
          )}

          {functionData.permitirReservasWeb && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Reservas web permitidas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FunctionInfoWidget; 