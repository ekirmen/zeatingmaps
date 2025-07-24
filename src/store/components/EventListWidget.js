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
      <ul className="space-y-4">
        {events.map((event) => {
          let displayImageUrl = `https://placehold.co/80x80/E0F2F7/000?text=${event.nombre ? event.nombre.charAt(0) : 'E'}`;
          
          if (event.imagenes) {
            try {
              const parsed = JSON.parse(event.imagenes);
              displayImageUrl =
                parsed.obraImagen || parsed.portada || parsed.banner || displayImageUrl;
            } catch (e) {
              console.warn('Error al parsear imagenes del evento', e);
            }
          }

          return (
            <li
              key={event.id}
              className="flex flex-col sm:flex-row items-center bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:bg-gray-100 transition-all duration-200 ease-in-out cursor-pointer"
              onClick={() => handleViewDetails(event.slug)}
            >
              <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                <img
                  src={displayImageUrl}
                  alt={event.nombre || 'Evento'}
                  className="w-20 h-20 rounded-md object-cover border border-gray-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/80x80/E0F2F7/000?text=N/A';
                  }}
                />
              </div>

              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.nombre}</h3>
                <p className="text-sm text-gray-700 mb-1">
                  {event.fecha_evento
                    ? new Date(event.fecha_evento).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Fecha no disponible'}
                </p>
                {event.venue && (
                  <p className="text-xs text-gray-500">{event.venue}</p>
                )}
              </div>

              <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-auto">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(event.slug);
                  }}
                >
                  Ver Detalles
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default EventListWidget;
