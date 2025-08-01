import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlineLeft } from 'react-icons/ai';
import { AiOutlineSetting, AiOutlineArrowUp, AiOutlineArrowDown, AiOutlineCopy } from 'react-icons/ai';
import EmailWidgetRenderer from '../components/EmailWidgets/EmailWidgetRenderer';
import EmailTestPanel from '../components/EmailTestPanel';
import { fetchCmsPage, saveCmsPage } from '../services/apibackoffice';

const pagesData = [
  { id: 'home', name: 'Home', url: '/store' },
  { id: 'events', name: 'Eventos', url: '/store/event' },
  { id: 'about', name: 'Acerca de', url: '/store/about' },
  { id: 'contact', name: 'Contacto', url: '/store/contact' },
  { id: 'faq', name: 'Preguntas Frecuentes', url: '/store/faq' },
  { id: 'terms', name: 'Términos y Condiciones', url: '/store/terms' },
  { id: 'privacy', name: 'Política de Privacidad', url: '/store/privacy' },
  { id: 'help', name: 'Ayuda', url: '/store/help' },
  { id: 'venue-info', name: 'Información de Recintos', url: '/store/venue-info' },
  { id: 'function-info', name: 'Información de Funciones', url: '/store/function-info' },
  { id: 'search', name: 'Búsqueda', url: '/store/search' },
  { id: 'calendar', name: 'Calendario', url: '/store/calendar' },
  { id: 'newsletter', name: 'Newsletter', url: '/store/newsletter' },
  { id: 'blog', name: 'Blog', url: '/store/blog' },
  { id: 'gallery', name: 'Galería', url: '/store/gallery' },
  { id: 'testimonials', name: 'Testimonios', url: '/store/testimonials' },
  { id: 'partners', name: 'Socios', url: '/store/partners' },
  { id: 'careers', name: 'Carreras', url: '/store/careers' },
  { id: 'press', name: 'Prensa', url: '/store/press' },
  { id: 'sitemap', name: 'Mapa del Sitio', url: '/store/sitemap' }
];

const defaultWidgets = { header: [], content: [], footer: [] };

// Widget definitions with preview images
const availableWidgets = [
  {
    id: 'listado-eventos',
    name: 'Listado de eventos',
    type: 'Listado de eventos',
    preview: 'https://placehold.co/300x200/E0F2F7/000?text=Listado+de+eventos',
    description: 'Muestra una lista de todos los eventos disponibles'
  },
  {
    id: 'eventos-destacados',
    name: 'Eventos Destacados',
    type: 'Eventos Destacados',
    preview: 'https://placehold.co/300x200/E0F2F7/000?text=Eventos+Destacados',
    description: 'Muestra los eventos más importantes en un diseño atractivo'
  },
  {
    id: 'informacion-recinto',
    name: 'Información de Recinto',
    type: 'Información de Recinto',
    preview: 'https://placehold.co/300x200/E0F2F7/000?text=Info+Recinto',
    description: 'Muestra información detallada de un recinto específico'
  },
  {
    id: 'informacion-funcion',
    name: 'Información de Función',
    type: 'Información de Función',
    preview: 'https://placehold.co/300x200/E0F2F7/000?text=Info+Función',
    description: 'Muestra detalles de una función específica con precios'
  },
  {
    id: 'preguntas-frecuentes',
    name: 'Preguntas frecuentes',
    type: 'Preguntas frecuentes',
    preview: 'https://placehold.co/300x200/E0F2F7/000?text=FAQ',
    description: 'Sección de preguntas frecuentes'
  },
  // Email Widgets
  {
    id: 'email-banner',
    name: 'Banner',
    type: 'Banner',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_banner/preview.gif',
    description: 'Banner para emails'
  },
  {
    id: 'email-html',
    name: 'Código HTML',
    type: 'Código HTML',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_html/preview.gif',
    description: 'Código HTML personalizado para emails'
  },
  {
    id: 'email-title',
    name: 'Título',
    type: 'Título',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_title/preview.gif',
    description: 'Título para emails'
  },
  {
    id: 'email-separator',
    name: 'Separador',
    type: 'Separador',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_separator/preview.gif',
    description: 'Separador visual para emails'
  },
  {
    id: 'email-subtitle',
    name: 'Subtítulo',
    type: 'Subtítulo',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_subtitle/preview.gif',
    description: 'Subtítulo para emails'
  },
  {
    id: 'email-paragraph',
    name: 'Paragraph',
    type: 'Paragraph',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_paragraph/preview.gif',
    description: 'Párrafo de texto para emails'
  },
  {
    id: 'email-event-big-banner-dynamic',
    name: 'Evento dinámico banner grande',
    type: 'Evento dinámico banner grande',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_event_big_banner_dynamic/preview.gif',
    description: 'Banner grande dinámico para eventos en emails'
  },
  {
    id: 'email-event-medium-banner-dynamic',
    name: 'Evento dinámico banner mediano',
    type: 'Evento dinámico banner mediano',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_event_medium_banner_dynamic/preview.gif',
    description: 'Banner mediano dinámico para eventos en emails'
  },
  {
    id: 'email-header',
    name: 'Cabecera email',
    type: 'Cabecera email',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_header/preview.gif',
    description: 'Cabecera para emails'
  },
  {
    id: 'email-footer',
    name: 'Pie email',
    type: 'Pie email',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_footer/preview.gif',
    description: 'Pie de página para emails'
  },
  {
    id: 'email-event-button',
    name: 'Botón',
    type: 'Botón',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_event_button/preview.gif',
    description: 'Botón para emails'
  },
  {
    id: 'email-event-information',
    name: 'Información del evento',
    type: 'Información del evento',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_event_information/preview.gif',
    description: 'Información detallada del evento para emails'
  },
  {
    id: 'email-footer-notification',
    name: 'Pie email notificación',
    type: 'Pie email notificación',
    preview: 'https://palco4static.s3.us-east-2.amazonaws.com/23.02/backoffice/cms/previews/email_footer_notification/preview.gif',
    description: 'Pie de página con notificaciones para emails'
  }
];

// Content type options for event list widget
const contentTypeOptions = [
  { value: 'todos', label: 'Todos los eventos' },
  { value: 'tags-categoria', label: 'Tags por categorías' },
  { value: 'tags-descripcion', label: 'Tags por descripción' },
  { value: 'evento', label: 'Evento' },
  { value: 'eventos-recinto', label: 'Eventos por recinto' }
];

// Order options for events
const orderOptions = [
  { value: 'fecha', label: 'Fecha' },
  { value: 'alfabetico', label: 'Alfabético' },
  { value: 'precio', label: 'Precio' },
  { value: 'duracion', label: 'Duración' },
  { value: 'aleatorio', label: 'Aleatorio' },
  { value: 'localizacion', label: 'Localización' }
];

// Mock tag categories (in a real app, these would come from the database)
const tagCategories = [
  { value: 'musica', label: 'Música' },
  { value: 'teatro', label: 'Teatro' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'conferencias', label: 'Conferencias' },
  { value: 'exposiciones', label: 'Exposiciones' },
  { value: 'festivales', label: 'Festivales' },
  { value: 'comedia', label: 'Comedia' },
  { value: 'danza', label: 'Danza' }
];

const WebStudio = ({ setSidebarCollapsed }) => {
  const [selectedPage, setSelectedPage] = useState(pagesData[0]);
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const loadPage = async () => {
      setPageLoaded(false);
      try {
        const data = await fetchCmsPage(selectedPage.id);
        setWidgets(data.widgets || defaultWidgets);
      } catch (e) {
        const saved = localStorage.getItem(`cms-page-${selectedPage.id}`);
        if (saved) {
          setWidgets(JSON.parse(saved));
        } else {
          setWidgets(defaultWidgets);
        }
      }
      setPageLoaded(true);
    };
    loadPage();
  }, [selectedPage]);

  useEffect(() => {
    if (!pageLoaded) return;
    const autoSave = async () => {
      try {
        await saveCmsPage(selectedPage.id, widgets);
        localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      } catch (err) {
        console.error('Auto save failed', err);
      }
    };
    autoSave();
  }, [widgets, selectedPage, pageLoaded]);

  const addWidget = (area, type, config = {}) => {
    setWidgets(prev => ({
      ...prev,
      [area]: [...prev[area], { type, config }]
    }));
  };

  const removeWidget = (area, index) => {
    setWidgets(prev => ({
      ...prev,
      [area]: prev[area].filter((_, i) => i !== index)
    }));
  };

  const updateWidget = (area, index, newConfig) => {
    setWidgets(prev => ({
      ...prev,
      [area]: prev[area].map((widget, i) => 
        i === index ? { ...widget, config: { ...widget.config, ...newConfig } } : widget
      )
    }));
  };

  const moveWidget = (area, fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= widgets[area].length) return;
    
    setWidgets(prev => {
      const updated = [...prev[area]];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, [area]: updated };
    });
  };

  const duplicateWidget = (area, index) => {
    const widgetToDuplicate = widgets[area][index];
    const duplicatedWidget = {
      ...widgetToDuplicate,
      config: { ...widgetToDuplicate.config }
    };
    
    setWidgets(prev => ({
      ...prev,
      [area]: [
        ...prev[area].slice(0, index + 1),
        duplicatedWidget,
        ...prev[area].slice(index + 1)
      ]
    }));
    
    toast.success('Widget duplicado');
  };

  const handleDragStart = idx => setDraggingIdx(idx);
  const handleDragOver = e => e.preventDefault();
  const handleDrop = idx => {
    if (draggingIdx === null || draggingIdx === idx) return;
    setWidgets(prev => {
      const updated = [...prev.content];
      const [moved] = updated.splice(draggingIdx, 1);
      updated.splice(idx, 0, moved);
      return { ...prev, content: updated };
    });
    setDraggingIdx(null);
  };

  const handleSave = async () => {
    try {
      await saveCmsPage(selectedPage.id, widgets);
      localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      toast.success('Página guardada');
    } catch (error) {
      toast.error('Error al guardar la página');
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem(`cms-page-${selectedPage.id}`);
    toast.success('Cache limpia');
  };

  const openSettings = (area, widget, index) => {
    setEditingWidget(widget);
    setEditingArea(area);
    setEditingIndex(index);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setEditingWidget(null);
    setEditingArea(null);
    setEditingIndex(null);
  };

  const applySettings = (newConfig) => {
    if (editingArea && editingIndex !== null) {
      updateWidget(editingArea, editingIndex, newConfig);
      toast.success('Configuración aplicada');
      closeSettings();
    }
  };

  const renderWidget = (area, widget, idx) => {
    const totalWidgets = widgets[area].length;
    const canMoveUp = idx > 0;
    const canMoveDown = idx < totalWidgets - 1;

    return (
      <div
        key={idx}
        className="relative border p-2 mb-2 bg-white rounded shadow-sm"
        draggable={area === 'content'}
        onDragStart={() => area === 'content' && handleDragStart(idx)}
        onDragOver={area === 'content' ? handleDragOver : undefined}
        onDrop={() => area === 'content' && handleDrop(idx)}
      >
        <div className="absolute top-1 right-1 flex gap-1">
          {/* Move Up Button */}
          <button
            className={`text-gray-500 hover:text-gray-700 font-bold ${!canMoveUp ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => canMoveUp && moveWidget(area, idx, idx - 1)}
            title="Mover arriba"
            disabled={!canMoveUp}
          >
            <AiOutlineArrowUp className="w-4 h-4" />
          </button>

          {/* Move Down Button */}
          <button
            className={`text-gray-500 hover:text-gray-700 font-bold ${!canMoveDown ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => canMoveDown && moveWidget(area, idx, idx + 1)}
            title="Mover abajo"
            disabled={!canMoveDown}
          >
            <AiOutlineArrowDown className="w-4 h-4" />
          </button>

          {/* Duplicate Button */}
          <button
            className="text-green-500 hover:text-green-700 font-bold"
            onClick={() => duplicateWidget(area, idx)}
            title="Duplicar widget"
          >
            <AiOutlineCopy className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            className="text-blue-500 hover:text-blue-700 font-bold"
            onClick={() => openSettings(area, widget, idx)}
            title="Ajustes"
          >
            <AiOutlineSetting className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            className="text-red-500 font-bold hover:text-red-700"
            onClick={() => removeWidget(area, idx)}
            title="Eliminar widget"
          >
            ×
          </button>
        </div>
        <div className="text-sm font-medium pr-32">{widget.type}</div>
        {widget.config && Object.keys(widget.config).length > 0 && (
          <div className="text-xs text-gray-500 mt-1 pr-32">
            {Object.entries(widget.config).map(([key, value]) => (
              <div key={key}>{key}: {value}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWidgetPreview = (widget) => (
    <div
      key={widget.id}
      className="element-widget owner-page-widget cursor-pointer"
      draggable="true"
      title={widget.name}
      onClick={() => setSelectedWidget(widget)}
    >
      <div className="preview-widget">
        <div className="layer"></div>
        <div className="preview-over">
          <i className="palco4icon palco4icon-plus-circle-o"></i>
        </div>
        <img 
          src={widget.preview} 
          draggable="false"
          alt={widget.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="label-type-widget full">
        <label>{widget.name}</label>
      </div>
    </div>
  );

  const renderSettingsPanel = () => {
    if (!editingWidget) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajustes - {editingWidget.type}
              </h3>
              <button
                onClick={closeSettings}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="large-12 columns properties-container">
              
              {/* Widget-specific configuration */}
              {editingWidget.type === 'Listado de eventos' && (
                <>
                  {/* Título del listado */}
                  <div className="element-form-input mb-4">
                    <label data-propertyname="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                      Título del listado
                    </label>
                    <input
                      type="text"
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Próximos Eventos"
                      defaultValue={editingWidget.config?.titulo || ''}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, titulo: e.target.value }
                        });
                      }}
                    />
                    <div className="note-property text-xs text-gray-500 mt-1">
                      Título que aparecerá en el encabezado del listado.
                    </div>
                  </div>

                  {/* Tipo de contenido */}
                  <div className="element-form-input mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de contenido
                    </label>
                    <div className="space-y-2">
                      {contentTypeOptions.map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="contentType"
                            value={option.value}
                            checked={editingWidget.config?.contentType === option.value}
                            onChange={(e) => {
                              setEditingWidget({
                                ...editingWidget,
                                config: { 
                                  ...editingWidget.config, 
                                  contentType: e.target.value,
                                  // Reset tag category when changing content type
                                  tagCategory: e.target.value === 'tags-categoria' ? editingWidget.config?.tagCategory : ''
                                }
                              });
                            }}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="note-property text-xs text-gray-500 mt-1">
                      Selecciona el tipo de contenido que quieres mostrar.
                    </div>
                  </div>

                  {/* Tipo de tag de categoría (solo si se selecciona "Tags por categorías") */}
                  {editingWidget.config?.contentType === 'tags-categoria' && (
                    <div className="element-form-input mb-4">
                      <label data-propertyname="tagCategory" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de tag de categoría
                      </label>
                      <select
                        className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingWidget.config?.tagCategory || ''}
                        onChange={(e) => {
                          setEditingWidget({
                            ...editingWidget,
                            config: { ...editingWidget.config, tagCategory: e.target.value }
                          });
                        }}
                      >
                        <option value="">Selecciona una categoría</option>
                        {tagCategories.map((tag) => (
                          <option key={tag.value} value={tag.value}>
                            {tag.label}
                          </option>
                        ))}
                      </select>
                      <div className="note-property text-xs text-gray-500 mt-1">
                        Selecciona la categoría de tags para filtrar los eventos.
                      </div>
                    </div>
                  )}

                  {/* Orden de los eventos */}
                  <div className="element-form-input mb-4">
                    <label data-propertyname="orden" className="block text-sm font-medium text-gray-700 mb-2">
                      Orden de los eventos
                    </label>
                    <select
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editingWidget.config?.orden || 'fecha'}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, orden: e.target.value }
                        });
                      }}
                    >
                      {orderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="note-property text-xs text-gray-500 mt-1">
                      Selecciona cómo quieres ordenar los eventos en el listado.
                    </div>
                  </div>

                  {/* Máximo de eventos */}
                  <div className="element-form-input mb-4">
                    <label data-propertyname="maxEvents" className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de eventos
                    </label>
                    <input
                      type="number"
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="6"
                      defaultValue={editingWidget.config?.maxEvents || 6}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, maxEvents: e.target.value }
                        });
                      }}
                    />
                    <div className="note-property text-xs text-gray-500 mt-1">
                      Número máximo de eventos a mostrar.
                    </div>
                  </div>
                </>
              )}

              {/* Email Widgets Configuration */}
              {(editingWidget.type === 'Banner' || editingWidget.type === 'Título' || editingWidget.type === 'Subtítulo' || editingWidget.type === 'Paragraph') && (
                <div className="element-form-input mb-4">
                  <label data-propertyname="texto" className="block text-sm font-medium text-gray-700 mb-2">
                    Texto
                  </label>
                  <input
                    type="text"
                    className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Introduce el texto"
                    defaultValue={editingWidget.config?.texto || ''}
                    onChange={(e) => {
                      setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, texto: e.target.value }
                      });
                    }}
                  />
                  <div className="note-property text-xs text-gray-500 mt-1">
                    Texto que se mostrará en el widget.
                  </div>
                </div>
              )}

              {editingWidget.type === 'Banner' && (
                <div className="element-form-input mb-4">
                  <label data-propertyname="imagen" className="block text-sm font-medium text-gray-700 mb-2">
                    URL de la imagen
                  </label>
                  <input
                    type="url"
                    className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    defaultValue={editingWidget.config?.imagen || ''}
                    onChange={(e) => {
                      setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, imagen: e.target.value }
                      });
                    }}
                  />
                  <div className="note-property text-xs text-gray-500 mt-1">
                    URL de la imagen para el banner.
                  </div>
                </div>
              )}

              {/* Email Widgets */}
              {(editingWidget.type === 'Botón' || editingWidget.type === 'Título' || editingWidget.type === 'Subtítulo' || editingWidget.type === 'Paragraph' || editingWidget.type === 'Banner' || editingWidget.type === 'Información del evento' || editingWidget.type === 'Evento dinámico banner grande' || editingWidget.type === 'Evento dinámico banner mediano' || editingWidget.type === 'Código HTML') && (
                <EmailWidgetRenderer
                  widgetType={editingWidget.type}
                  config={editingWidget.config}
                  onConfigChange={(newConfig) => {
                    setEditingWidget({
                      ...editingWidget,
                      config: newConfig
                    });
                  }}
                />
              )}

              {editingWidget.type === 'Información del evento' && (
                <>
                  <div className="element-form-input mb-4">
                    <label data-propertyname="eventoId" className="block text-sm font-medium text-gray-700 mb-2">
                      ID del evento
                    </label>
                    <input
                      type="number"
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      defaultValue={editingWidget.config?.eventoId || ''}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, eventoId: e.target.value }
                        });
                      }}
                    />
                    <div className="note-property text-xs text-gray-500 mt-1">
                      ID del evento que se mostrará en el email.
                    </div>
                  </div>
                </>
              )}

              {editingWidget.type === 'Evento dinámico banner grande' || editingWidget.type === 'Evento dinámico banner mediano' && (
                <>
                  <div className="element-form-input mb-4">
                    <label data-propertyname="eventoId" className="block text-sm font-medium text-gray-700 mb-2">
                      ID del evento
                    </label>
                    <input
                      type="number"
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      defaultValue={editingWidget.config?.eventoId || ''}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, eventoId: e.target.value }
                        });
                      }}
                    />
                  </div>
                  <div className="element-form-input mb-4">
                    <label data-propertyname="funcionId" className="block text-sm font-medium text-gray-700 mb-2">
                      ID de la función
                    </label>
                    <input
                      type="number"
                      className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="456"
                      defaultValue={editingWidget.config?.funcionId || ''}
                      onChange={(e) => {
                        setEditingWidget({
                          ...editingWidget,
                          config: { ...editingWidget.config, funcionId: e.target.value }
                        });
                      }}
                    />
                  </div>
                </>
              )}

              {editingWidget.type === 'Información de Recinto' && (
                <div className="element-form-input mb-4">
                  <label data-propertyname="venueId" className="block text-sm font-medium text-gray-700 mb-2">
                    ID del Recinto
                  </label>
                  <input
                    type="number"
                    className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el ID del recinto"
                    defaultValue={editingWidget.config?.venueId || ''}
                    onChange={(e) => {
                      setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, venueId: e.target.value }
                      });
                    }}
                  />
                  <div className="note-property text-xs text-gray-500 mt-1">
                    Introduce el ID del recinto que quieres mostrar.
                  </div>
                </div>
              )}

              {editingWidget.type === 'Información de Función' && (
                <div className="element-form-input mb-4">
                  <label data-propertyname="functionId" className="block text-sm font-medium text-gray-700 mb-2">
                    ID de la Función
                  </label>
                  <input
                    type="number"
                    className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el ID de la función"
                    defaultValue={editingWidget.config?.functionId || ''}
                    onChange={(e) => {
                      setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, functionId: e.target.value }
                      });
                    }}
                  />
                  <div className="note-property text-xs text-gray-500 mt-1">
                    Introduce el ID de la función que quieres mostrar.
                  </div>
                </div>
              )}

              {editingWidget.type === 'Eventos Destacados' && (
                <div className="element-form-input mb-4">
                  <label data-propertyname="maxEvents" className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de eventos
                  </label>
                  <input
                    type="number"
                    className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6"
                    defaultValue={editingWidget.config?.maxEvents || 6}
                    onChange={(e) => {
                      setEditingWidget({
                        ...editingWidget,
                        config: { ...editingWidget.config, maxEvents: e.target.value }
                      });
                    }}
                  />
                  <div className="note-property text-xs text-gray-500 mt-1">
                    Número máximo de eventos a mostrar.
                  </div>
                </div>
              )}

              {/* HTML Code Editor */}
              <div className="element-form-input mb-4">
                <label data-propertyname="html" className="block text-sm font-medium text-gray-700 mb-2">
                  Código HTML
                </label>
                <textarea
                  className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="<div>Tu código HTML aquí</div>"
                  defaultValue={editingWidget.config?.html || ''}
                  onChange={(e) => {
                    setEditingWidget({
                      ...editingWidget,
                      config: { ...editingWidget.config, html: e.target.value }
                    });
                  }}
                />
                <div className="note-property text-xs text-gray-500 mt-1">
                  Introduce aquí el código HTML que quieres mostrar.
                </div>
              </div>

              {/* CSS Code Editor */}
              <div className="element-form-input mb-4">
                <label data-propertyname="css" className="block text-sm font-medium text-gray-700 mb-2">
                  Código CSS
                </label>
                <textarea
                  className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="/* Tu código CSS aquí */"
                  defaultValue={editingWidget.config?.css || ''}
                  onChange={(e) => {
                    setEditingWidget({
                      ...editingWidget,
                      config: { ...editingWidget.config, css: e.target.value }
                    });
                  }}
                />
                <div className="note-property text-xs text-gray-500 mt-1">
                  Introduce aquí el código CSS que quieres aplicar.
                </div>
              </div>

              {/* JavaScript Code Editor */}
              <div className="element-form-input mb-4">
                <label data-propertyname="js" className="block text-sm font-medium text-gray-700 mb-2">
                  Código JavaScript
                </label>
                <textarea
                  className="property-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="// Tu código JavaScript aquí"
                  defaultValue={editingWidget.config?.js || ''}
                  onChange={(e) => {
                    setEditingWidget({
                      ...editingWidget,
                      config: { ...editingWidget.config, js: e.target.value }
                    });
                  }}
                />
                <div className="note-property text-xs text-gray-500 mt-1">
                  Introduce aquí el código JavaScript que quieras que se ejecute junto al widget.
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 border-t">
            <div className="flex justify-end gap-3">
              <button
                onClick={closeSettings}
                className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => applySettings(editingWidget.config)}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
              </div>
      
      {/* Email Test Panel */}
      <EmailTestPanel />
    </div>
  );
};

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-gray-100 p-4 overflow-y-auto">
        <button
          className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900"
          onClick={() => window.history.back()}
        >
          <AiOutlineLeft />
          <span>Volver</span>
        </button>

        <h3 className="font-bold mb-2">Páginas</h3>
        <ul className="space-y-1 mb-6 max-h-60 overflow-y-auto">
          {pagesData.map(p => (
            <li
              key={p.id}
              onClick={() => setSelectedPage(p)}
              className={`cursor-pointer p-2 rounded ${
                selectedPage.id === p.id ? 'bg-blue-200 font-semibold' : 'hover:bg-gray-200'
              }`}
            >
              {p.name}
            </li>
          ))}
        </ul>

        <div className="mb-6">
          <h4 className="font-semibold mb-3">Widgets disponibles</h4>
          <div className="space-y-3">
            {availableWidgets.map(widget => (
              <div
                key={widget.id}
                className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addWidget('content', widget.type, widget.config)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={widget.preview}
                    alt={widget.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{widget.name}</h5>
                    <p className="text-xs text-gray-600">{widget.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-gray-600">Nombre</label>
            <input className="border w-full px-2 py-1 rounded" value={selectedPage.name} readOnly />
          </div>
          <div>
            <label className="block text-gray-600">URL</label>
            <input className="border w-full px-2 py-1 rounded" value={selectedPage.url} readOnly />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
          >
            Guardar página
          </button>
          <button
            onClick={handleClearCache}
            className="bg-gray-400 hover:bg-gray-500 text-white w-full py-2 rounded"
          >
            Limpiar cache
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {['header', 'content', 'footer'].map((area) => (
          <div key={area} className="mb-6">
            <h2 className="font-semibold mb-2 capitalize">{area}</h2>
            <div className="bg-white p-3 border rounded min-h-[80px]">
              {widgets[area]?.length > 0 ? (
                widgets[area].map((w, idx) => renderWidget(area, w, idx))
              ) : (
                <p className="text-sm text-gray-500">Sin widgets</p>
              )}
            </div>
          </div>
        ))}

        {/* Settings Panel */}
        {showSettings && renderSettingsPanel()}
      </main>
    </div>
  );
};

export default WebStudio;
