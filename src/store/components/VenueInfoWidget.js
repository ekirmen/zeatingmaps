import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import resolveImageUrl from '../../utils/resolveImageUrl';

const VenueInfoWidget = ({ venueId, showEvents = true, maxEvents = 6 }) => {
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        setLoading(true);
        
        // Fetch venue information
        const { data: venueData, error: venueError } = await supabase
          .from('recintos')
          .select('*')
          .eq('id', venueId)
          .single();

        if (venueError) throw venueError;
        setVenue(venueData);

        // Fetch events for this venue if showEvents is true
        if (showEvents) {
          const { data: eventsData, error: eventsError } = await supabase
            .from('eventos')
            .select(`
              id,
              nombre,
              slug,
              fecha_evento,
              imagenes,
              estadoVenta,
              descripcionHTML,
              salas (
                id,
                nombre
              )
            `)
            .eq('recinto', venueId)
            .eq('activo', true)
            .eq('oculto', false)
            .order('fecha_evento', { ascending: true })
            .limit(maxEvents);

          if (eventsError) throw eventsError;
          setEvents(eventsData || []);
        }

      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchVenueData();
    }
  }, [venueId, showEvents, maxEvents]);

  const getEventImages = (event) => {
    if (!event.imagenes) return {};
    
    try {
      if (typeof event.imagenes === 'string') {
        return JSON.parse(event.imagenes);
      }
      return event.imagenes;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return {};
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Fecha no disponible';
    }
  };

  const handleEventClick = (eventSlug) => {
    navigate(`/store/eventos/${eventSlug}`);
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

  if (!venue) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-600">Recinto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Venue Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0">
            <img
              src={`https://placehold.co/200x200/E0F2F7/000?text=${venue.nombre?.charAt(0) || 'R'}`}
              alt={venue.nombre}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{venue.nombre}</h2>
            {venue.direccion && (
              <p className="text-sm opacity-90">{venue.direccion}</p>
            )}
            {venue.capacidad && (
              <p className="text-sm opacity-90">Capacidad: {venue.capacidad} personas</p>
            )}
          </div>
        </div>
      </div>

      {/* Venue Details */}
      <div className="p-6">
        {venue.descripcion && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sobre el Recinto</h3>
            <p className="text-gray-600 text-sm">{venue.descripcion}</p>
          </div>
        )}

        {/* Events Section */}
        {showEvents && events.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Eventos en {venue.nombre}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => {
                const images = getEventImages(event);
                let displayImageUrl = `https://placehold.co/300x200/E0F2F7/000?text=${event.nombre?.charAt(0) || 'E'}`;
                
                if (images) {
                  displayImageUrl = images.obraImagen || images.portada || images.banner || displayImageUrl;
                }

                return (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEventClick(event.slug)}
                  >
                    {/* Event Image */}
                    <div className="relative h-32">
                      <img
                        src={displayImageUrl}
                        alt={event.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/300x200/E0F2F7/000?text=${event.nombre || 'Evento'}`;
                        }}
                      />
                      {/* Event Status Badge */}
                      {event.estadoVenta && (
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.estadoVenta === 'a-la-venta' 
                              ? 'bg-green-100 text-green-800' 
                              : event.estadoVenta === 'agotado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.estadoVenta.replace(/-/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Content */}
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                        {event.nombre}
                      </h4>
                      
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatEventDate(event.fecha_evento)}
                      </div>

                      {event.salas && event.salas.length > 0 && (
                        <div className="flex items-center text-xs text-gray-600">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {event.salas.map(sala => sala.nombre).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showEvents && events.length === 0 && (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No hay eventos programados en este recinto.</p>
          </div>
        )}

        {/* Venue Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Recinto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {venue.direccion && (
              <div>
                <span className="font-medium text-gray-700">Dirección:</span>
                <p className="text-gray-600">{venue.direccion}</p>
              </div>
            )}
            
            {venue.capacidad && (
              <div>
                <span className="font-medium text-gray-700">Capacidad:</span>
                <p className="text-gray-600">{venue.capacidad} personas</p>
              </div>
            )}

            {venue.telefono && (
              <div>
                <span className="font-medium text-gray-700">Teléfono:</span>
                <p className="text-gray-600">{venue.telefono}</p>
              </div>
            )}

            {venue.email && (
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-600">{venue.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueInfoWidget; 