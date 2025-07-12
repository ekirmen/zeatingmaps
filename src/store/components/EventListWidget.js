// src/store/components/EventListWidget.js

import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

function EventListWidget({ events }) { // This component only receives 'events' as a prop
  const navigate = useNavigate(); // Initialize navigate hook

  // Defensive check: If no events, display a message
  if (!events || events.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-600 font-inter">
        No hay eventos disponibles en este momento.
      </div>
    );
  }

  // Function to handle navigation to the event detail page
  const handleViewDetails = (eventSlug) => {
    if (eventSlug) {
      navigate(`/eventos/${eventSlug}`); // Navigate to /eventos/your-event-slug
    } else {
      console.warn('Cannot navigate: Event slug is missing.');
      // Optionally, show a user-friendly message
    }
  };

  return (
    <div className="event-list-container p-4 bg-white rounded-lg shadow-lg max-w-full font-inter">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Próximos Eventos</h2>
      <ul className="space-y-4">
        {events.map(event => {
          // Parse the 'imagenes' JSON string to get a displayable image URL
          let displayImageUrl = `https://placehold.co/80x80/E0F2F7/000?text=${event.nombre ? event.nombre.charAt(0) : 'E'}`;
          if (event.imagenes) {
            try {
              const imageUrls = JSON.parse(event.imagenes);
              // Prioritize obraImagen, then portada, then banner, etc.
              displayImageUrl = imageUrls.obraImagen || imageUrls.portada || imageUrls.banner || displayImageUrl;
            } catch (e) {
              console.error('Error parsing event images JSON:', e);
            }
          }

          return (
            // Ensure each list item has a unique and stable 'key' prop
            // Using 'event.id' which is a UUID from your 'eventos' table
            <li
              key={event.id}
              className="flex flex-col sm:flex-row items-center bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm
                         hover:bg-gray-100 transition-all duration-200 ease-in-out cursor-pointer"
              // Make the entire list item clickable for navigation
              onClick={() => handleViewDetails(event.slug)}
            >
              {/* Event Image */}
              <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                <img
                  src={displayImageUrl}
                  alt={event.nombre || 'Event Thumbnail'} // Use event.nombre for alt text
                  className="w-20 h-20 rounded-md object-cover border border-gray-300"
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/80x80/E0F2F7/000?text=N/A"; }}
                />
              </div>

              {/* Event Details */}
              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.nombre || 'Nombre del Evento'}</h3> {/* Use event.nombre */}
                <p className="text-sm text-gray-700 mb-1">
                  {event.fecha_evento ? new Date(event.fecha_evento).toLocaleDateString('es-ES', { // Use event.fecha_evento
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'Fecha no disponible'}
                </p>
                {/* Note: event.venue needs to be populated upstream, e.g., by fetching recinto.nombre */}
                {event.venue && (
                  <p className="text-xs text-gray-500">
                    {event.venue}
                  </p>
                )}
              </div>

              {/* Action Button (e.g., View Details) - now primarily for visual emphasis */}
              <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-auto">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             transition-colors duration-200"
                  // The onClick on the <li> handles navigation, this button is for visual consistency
                  onClick={(e) => { e.stopPropagation(); handleViewDetails(event.slug); }} // Stop propagation to prevent double-triggering
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
