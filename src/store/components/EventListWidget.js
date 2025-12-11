import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import resolveImageUrl from '../../utils/resolveImageUrl';
import EventImage from './EventImage';
import VirtualizedEventList from '../../components/VirtualizedEventList';
import { EventListSkeleton } from '../../components/SkeletonLoaders';

function EventListWidget({ events, loading = false }) {
  const navigate = useNavigate();

  const handleViewDetails = (eventSlug) => {
    if (eventSlug) {
      navigate(`/store/eventos/${eventSlug}`);
    } else {
    }
  };


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

  // Función para obtener URL de imagen con fallback
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    try {
      const resolvedUrl = resolveImageUrl(imagePath, 'eventos');
      return resolvedUrl;
    } catch (error) {
      console.error('Error resolving image URL:', error);
      return null;
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

  // Usar lista virtualizada si hay muchos eventos (más de 20) - mover antes de early returns
  const shouldUseVirtualized = useMemo(() => {
    return events && events.length > 20;
  }, [events?.length]);

  // Preparar eventos para la lista virtualizada (mover antes de early returns)
  const formattedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return events.map(event => {
      const images = getEventImages(event);
      
      const eventName = event.name || event.nombre || 'E';
      const displayImageUrl = rawImage ? getImageUrl(rawImage) : null;

      return {
        id: event.id || event._id,
        nombre: event.name || event.nombre || 'Evento sin nombre',
        descripcion: event.descripcion || event.description || '',
        fecha_inicio: event.fechaInicio || event.fecha_inicio || event.startDate,
        hora_inicio: event.horaInicio || event.hora_inicio || event.startTime,
        precio_minimo: event.precioMinimo || event.precio_minimo || event.minPrice,
        imagen: displayImageUrl,
        slug: event.slug
      };
    });
  }, [events]);

  if (loading) {
    return <EventListSkeleton />;
  }

  if (!events || events.length === 0) {
    return (
      <div className="store-card store-text-center store-text-gray-600">
        No hay eventos disponibles en este momento.
      </div>
    );
  }

  // Usar lista virtualizada para muchos eventos
  if (shouldUseVirtualized) {
    return (
      <div className="event-list-container store-container">
        <h2 className="store-text-2xl store-font-bold store-text-gray-800 mb-6 store-text-center">
          Próximos Eventos ({events.length})
        </h2>
        <VirtualizedEventList
          eventos={formattedEvents}
          loading={loading}
          onEventClick={(evento) => handleViewDetails(evento.slug)}
          height={600}
        />
      </div>
    );
  }

  return (
    <div className="event-list-container store-container">
      <h2 className="store-text-2xl store-font-bold store-text-gray-800 mb-6 store-text-center">Próximos Eventos</h2>
      <div className="store-grid store-grid-auto">
        {events.map((event) => {
          const images = getEventImages(event);
          const rawImage = images.obraImagen || images.portada || images.banner;
          const eventName = event.name || event.nombre || 'E';
          

          // Debug info para desarrollo
          if (process.env.NODE_ENV === 'development') {
          }

          return (
            <div
              key={event.id}
              className="store-event-card cursor-pointer"
              onClick={() => handleViewDetails(event.slug)}
            >
              {/* Event Image */}
              <div className="relative overflow-hidden">
                <EventImage
                  event={event}
                  imageType="portada"
                  className="store-event-card-image"
                  showDebug={false}
                />

                {/* Event Status Badge */}
                {event.estadoVenta && (
                  <div className="absolute top-3 right-3">
                    <span className={`store-badge ${
                      event.estadoVenta === 'a-la-venta'
                        ? 'store-badge-success'
                        : event.estadoVenta === 'agotado'
                        ? 'store-badge-error'
                        : 'store-badge-warning'
                    }`}>
                      {event.estadoVenta.replace(/-/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className="store-event-card-content">
                <h3 className="store-event-card-title">
                  {event.name || event.nombre}
                </h3>

                {/* Event Date */}
                <div className="store-event-card-meta">
                  <div className="store-event-card-meta-item">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatEventDate(event.date || event.fecha_evento)}
                  </div>

                  {/* Venue Information */}
                  {event.venue && (
                    <div className="store-event-card-meta-item">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.venue}
                    </div>
                  )}
                </div>

                {/* Event Description Preview */}
                {event.descripcionHTML && (
                  <div className="store-event-card-description">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: event.descripcionHTML.replace(/<[^>]*>/g, '').substring(0, 120) + '...'
                      }}
                    />
                  </div>
                )}

                {/* Action Button */}
                <div className="store-event-card-footer">
                  <button
                    className="store-button store-button-primary store-button-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(event.slug);
                    }}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventListWidget;
