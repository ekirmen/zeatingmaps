import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCmsPage } from '../services/apistore';
import NotFoundPage from '../../components/NotFoundPage';

const CmsPage = () => {
  const { pageSlug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const renderWidget = (widget, index) => {
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
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: widget.html }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {pageData.widgets?.content?.map((widget, idx) => renderWidget(widget, idx))}
    </div>
  );
};

export default CmsPage;

