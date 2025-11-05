import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import logger from '../../utils/logger';
import { useParams } from 'react-router-dom';
import { getCmsPage } from '../services/apistore';
import NotFoundPage from '../../components/NotFoundPage';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import FeaturedEventsWidget from '../components/FeaturedEventsWidget';
import VenueInfoWidget from '../components/VenueInfoWidget';
import FunctionInfoWidget from '../components/FunctionInfoWidget';
import { useEventsList } from '../hooks/useEventsList';

const CmsPage = ({ slug }) => {
  const params = useParams();
  const pageSlug = slug || params.pageSlug;
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { events } = useEventsList();

  useEffect(() => {
    async function fetchPage() {
      try {
        const data = await getCmsPage(pageSlug);
        setPageData(data);
      } catch (error) {
        console.error('Error loading CMS page:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [pageSlug]);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!pageData || !pageData.original_data) {
    return <NotFoundPage />;
  }

  const renderWidget = useCallback((widget, index) => {
    const config = widget.config || {};

    switch (widget.type) {
      case 'page_header':
        return (
          <div key={index} className="mb-6">
            {widget.title && (
              <h1 className="text-2xl font-bold mb-2">{widget.title}</h1>
            )}
            {widget.description && (
              <p className="text-gray-700">{widget.description}</p>
            )}
          </div>
        );
      case 'html':
        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: widget.html }} />
        );
      case 'Listado de eventos':
        return <EventListWidget key={index} events={events} {...config} />;
      case 'Eventos Destacados':
        return <FeaturedEventsWidget key={index} {...config} />;
      case 'Preguntas frecuentes':
        return <FaqWidget key={index} {...config} />;
      case 'Información de Recinto':
        return <VenueInfoWidget key={index} venueId={config.venueId} {...config} />;
      case 'Información de Función':
        return <FunctionInfoWidget key={index} functionId={config.functionId} {...config} />;
      default:
        logger.warn(`[CmsPage] Tipo de widget desconocido: ${widget.type}`);
        return null;
    }
  }, [events]); // Memoizar renderWidget para evitar recreación

  // Memoizar widgets renderizados
  const renderedWidgets = useMemo(() => {
    if (!pageData?.widgets?.content) return null;
    return pageData.widgets.content.map((widget, idx) => renderWidget(widget, idx));
  }, [pageData?.widgets?.content, renderWidget]);

  return (
    <div className="p-6">
      {renderedWidgets}
    </div>
  );
};

export default memo(CmsPage);

