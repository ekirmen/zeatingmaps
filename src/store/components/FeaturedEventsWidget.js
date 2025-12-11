import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventsList } from '../hooks/useEventsList';

const FeaturedEventsWidget = ({ maxEvents = 6, showStatus = true, showVenue = true }) => {
  const navigate = useNavigate();
  const { events, loading, error } = useEventsList();


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
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(maxEvents)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600">Error al cargar los eventos</p>
      </div>
    );
  }

  const featuredEvents = events.slice(0, maxEvents);

  if (featuredEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600">No hay eventos destacados disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Eventos Destacados</h2>
        <p className="text-sm opacity-90">Descubre los mejores espectáculos</p>
      </div>

      {/* Events Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event) => {
            const images = getEventImages(event);
            let displayImageUrl = `https://placehold.co/400x300/E0F2F7/000?text=${event.nombre?.charAt(0) || 'E'}`;
            
            if (images) {
              displayImageUrl = images.obraImagen || images.portada || images.banner || displayImageUrl;
            }

            return (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleEventClick(event.slug)}
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={displayImageUrl}
                    alt={event.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/400x300/E0F2F7/000?text=${event.nombre || 'Evento'}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Event Status Badge */}
                  {showStatus && event.estadoVenta && (
                    <div className="absolute top-3 right-3">
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

                  {/* Event Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {event.nombre}
                    </h3>
                    {showVenue && event.venue && (
                      <p className="text-sm opacity-90">{event.venue}</p>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-4">
                  {/* Event Date */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatEventDate(event.fecha_evento)}
                  </div>

                  {/* Event Description Preview */}
                  {event.descripcionHTML && (
                    <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: event.descripcionHTML.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                        }} 
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event.slug);
                    }}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        {events.length > maxEvents && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/store')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Ver Todos los Eventos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedEventsWidget; 
