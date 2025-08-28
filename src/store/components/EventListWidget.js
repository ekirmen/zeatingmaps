import React from 'react';
import { useNavigate } from 'react-router-dom';

function EventListWidget({ events }) {
  const navigate = useNavigate();

  const handleViewDetails = (eventSlug) => {
    if (eventSlug) {
      navigate(`/store/eventos/${eventSlug}`);
    } else {
      console.warn('Falta el slug del evento.');
    }
  };

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

  if (!events || events.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-600 font-inter">
        No hay eventos disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="event-list-container p-4 bg-white rounded-lg shadow-lg max-w-full font-inter">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Próximos Eventos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const images = getEventImages(event);
          let displayImageUrl = `https://placehold.co/400x300/E0F2F7/000?text=${(event.name || event.nombre) ? (event.name || event.nombre).charAt(0) : 'E'}`;
          
          if (images) {
            displayImageUrl = images.obraImagen || images.portada || images.banner || displayImageUrl;
          }

          return (
            <div
              key={event.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer overflow-hidden"
              onClick={() => handleViewDetails(event.slug)}
            >
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={displayImageUrl}
                  alt={event.name || event.nombre || 'Evento'}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/400x300/E0F2F7/000?text=${event.name || event.nombre || 'Evento'}`;
                  }}
                />
                {/* Event Status Badge */}
                {event.estadoVenta && (
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
              </div>

              {/* Event Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {event.name || event.nombre}
                </h3>
                
                {/* Event Date */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatEventDate(event.date || event.fecha_evento)}
                </div>

                {/* Venue Information */}
                {event.venue && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </div>
                )}

                {/* Event Description Preview */}
                {event.descripcionHTML && (
                  <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: event.descripcionHTML.replace(/<[^>]*>/g, '').substring(0, 120) + '...' 
                      }} 
                    />
                  </div>
                )}

                {/* Action Button */}
                <button
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(event.slug);
                  }}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventListWidget;
