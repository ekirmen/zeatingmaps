// src/store/pages/EventsVenue.js

import React, { useEffect, useState } from 'react';
import EventListWidget from '../components/EventListWidget'; // Your EventListWidget component
import FaqWidget from '../components/FaqWidget'; // Your FaqWidget component
import { getCmsPage } from '../services/apistore'; // Service to fetch CMS page data
import { useEventsList } from '../hooks/useEventsList'; // <-- Corrected import path for useEventsList

const EventsVenue = ({ groupByTags = true }) => {
  const [widgets, setWidgets] = useState(null);
  const [loadingCms, setLoadingCms] = useState(true);
  const [errorCms, setErrorCms] = useState(null);

  // Use the new hook to fetch the list of events
  const { events, loading: loadingEvents, error: errorEvents } = useEventsList();

  useEffect(() => {
    const loadCmsWidgets = async () => {
      setLoadingCms(true);
      setErrorCms(null);
      try {
        const data = await getCmsPage('home');
        setWidgets(data.widgets);
        localStorage.setItem('cms-page-home', JSON.stringify(data.widgets));
      } catch (e) {
        console.error('Error fetching CMS page:', e);
        setErrorCms(e);
        const saved = localStorage.getItem('cms-page-home');
        if (saved) {
          try {
            setWidgets(JSON.parse(saved));
          } catch (err) {
            console.error('Error parsing cached widgets', err);
          }
        }
      } finally {
        setLoadingCms(false);
      }
    };
    loadCmsWidgets();
  }, []); // Empty dependency array means this runs once on mount

  // Display loading or error states for both CMS widgets and events
  if (loadingCms || loadingEvents) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700 font-inter">
        Cargando contenido...
      </div>
    );
  }

  if (errorCms || errorEvents) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-xl text-red-600 font-inter">
        <p>Error al cargar la página:</p>
        {errorCms && <p>{errorCms.message}</p>}
        {errorEvents && <p>{errorEvents.message}</p>}
        <p className="text-sm text-gray-500 mt-4">Por favor, intenta recargar la página.</p>
      </div>
    );
  }

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Listado de eventos':
        // Pass the fetched 'events' to EventListWidget
        return <EventListWidget events={events} groupByTags={groupByTags} />;
      case 'Preguntas frecuentes':
        return <FaqWidget />;
      default:
        return null;
    }
  };

  const content = widgets?.content?.length
    ? widgets.content.map((w, idx) => (
        // Ensure key is unique and stable. If widget.id exists, use it.
        // Otherwise, idx is a fallback, but consider if widgets can be reordered.
        <React.Fragment key={w.id || idx}>{renderWidget(w)}</React.Fragment>
      ))
    : null; // If no widgets or content, return null

  return (
    <>
      <div className="event-container p-4">
        {content}
        {/* Fallback if CMS content is empty but events are loaded */}
        {!content && events.length > 0 && (
          <EventListWidget events={events} groupByTags={groupByTags} />
        )}
        {!content && events.length === 0 && (
          <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-600 font-inter">
            No hay contenido CMS configurado y no se encontraron eventos.
          </div>
        )}
      </div>
    </>
  );
};

export default EventsVenue;
