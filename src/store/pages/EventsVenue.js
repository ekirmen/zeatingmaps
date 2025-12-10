// src/store/pages/EventsVenue.js

import React, { useEffect, useState } from 'react';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import { getCmsPage } from '../services/apistore';
import { useEventsList } from '../hooks/useEventsList';
import { PageSkeleton } from '../../components/SkeletonLoaders';

const EventsVenue = ({ groupByTags = true }) => {
  const [widgets, setWidgets] = useState(null);
  const { events, loading } = useEventsList();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCmsPage('store');
        setWidgets(data.widgets);
        localStorage.setItem('cms-page-store', JSON.stringify(data.widgets));
      } catch (e) {
        const saved = localStorage.getItem('cms-page-store');
        if (saved) {
          try {
            setWidgets(JSON.parse(saved));
          } catch (err) {
            console.error('Error parsing widgets', err);
          }
        }
      }
    };

    load();
  }, []);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Listado de eventos':
        return <EventListWidget events={events} loading={loading} />;
      case 'Preguntas frecuentes':
        return <FaqWidget />;
      default:
        return null;
    }
  };
  
  if (loading && !widgets) {
    return <PageSkeleton rows={4} />;
  }

  const content = widgets?.content?.length
    ? widgets.content.map((w, idx) => (
        <React.Fragment key={idx}>{renderWidget(w)}</React.Fragment>
      ))
    : null;

  return <div className="event-container">{content}</div>;
};

export default EventsVenue;

