import React, { useEffect, useState } from 'react';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import { getCmsPage } from '../services/apistore';

const EventsVenue = () => {
  const [widgets, setWidgets] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCmsPage('home');
        setWidgets(data.widgets);
        localStorage.setItem('cms-page-home', JSON.stringify(data.widgets));
      } catch (e) {
        const saved = localStorage.getItem('cms-page-home');
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
        return <EventListWidget />;
      case 'Preguntas frecuentes':
        return <FaqWidget />;
      default:
        return null;
    }
  };

  const content = widgets?.content?.length
    ? widgets.content.map((w, idx) => (
        <React.Fragment key={idx}>{renderWidget(w)}</React.Fragment>
      ))
    : null;
  return (
    <>
      <div className="event-container">{content}</div>
    </>
  );
};

export default EventsVenue;
