import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import resolveImageUrl from '../../utils/resolveImageUrl';

const VenueInfo = () => {
  const { venueId } = useParams();
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

        // Fetch events for this venue
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
          .order('fecha_evento', { ascending: true });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);

      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchVenueData();
    }
  }, [venueId]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Recinto no encontrado</h1>
          <p className="text-gray-600">El recinto que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Venue Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Venue Image */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
              <img
                src={`https://placehold.co/400x400/E0F2F7/000?text=${venue.nombre?.charAt(0) || 'R'}`}
                alt={venue.nombre}
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
            </div>

            {/* Venue Information */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {venue.nombre}
              </h1>
              {venue.direccion && (
                <div className="flex items-center text-gray-600 mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {venue.direccion}
                </div>
              )}
              {venue.capacidad && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Capacidad: {venue.capacidad} personas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Venue Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Venue Description */}
            {venue.descripcion && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Sobre el Recinto</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700">{venue.descripcion}</p>
                </div>
              </div>
            )}

            {/* Events Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Eventos en {venue.nombre}
              </h2>
              
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event) => {
                    const images = getEventImages(event);
                    let displayImageUrl = `https://placehold.co/300x200/E0F2F7/000?text=${event.nombre?.charAt(0) || 'E'}`;
                    
                    if (images) {
                      const raw = images.obraImagen || images.portada || images.banner;
                      if (raw) {
                        displayImageUrl = resolveImageUrl(raw, 'eventos') || raw;
                      }
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
                            loading="lazy"
                            crossOrigin="anonymous"
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
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {event.nombre}
                          </h3>
                          
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatEventDate(event.fecha_evento)}
                          </div>

                          {event.salas && event.salas.length > 0 && (
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {event.salas.map(sala => sala.nombre).join(', ')}
                            </div>
                          )}

                          <button
                            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event.slug);
                            }}
                          >
                            Ver Evento
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No hay eventos programados en este recinto.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Venue Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Recinto</h3>
              <div className="space-y-4">
                {venue.direccion && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Dirección</h4>
                    <p className="text-sm text-gray-600">{venue.direccion}</p>
                  </div>
                )}
                
                {venue.capacidad && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Capacidad</h4>
                    <p className="text-sm text-gray-600">{venue.capacidad} personas</p>
                  </div>
                )}

                {venue.telefono && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Teléfono</h4>
                    <p className="text-sm text-gray-600">{venue.telefono}</p>
                  </div>
                )}

                {venue.email && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Email</h4>
                    <p className="text-sm text-gray-600">{venue.email}</p>
                  </div>
                )}

                {venue.website && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Sitio Web</h4>
                    <a 
                      href={venue.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {venue.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Eventos activos</span>
                  <span className="font-medium text-gray-900">{events.length}</span>
                </div>
                {venue.capacidad && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacidad total</span>
                    <span className="font-medium text-gray-900">{venue.capacidad}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueInfo; 