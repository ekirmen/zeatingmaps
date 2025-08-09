import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlineLeft, AiOutlineEdit, AiOutlineDelete, AiOutlineCopy, AiOutlineUp, AiOutlineDown } from 'react-icons/ai';
import { AiOutlineSetting } from 'react-icons/ai';
import EmailWidgetRenderer from '../components/EmailWidgets/EmailWidgetRenderer';
import EmailTestPanel from '../components/EmailTestPanel';
import EmailPageCreator from './EmailPageCreator';
import SiteMap from '../components/SiteMap';
import { fetchCmsPage, saveCmsPage } from '../services/apibackoffice';

// Datos de ejemplo para las nuevas secciones
const systemPages = [
  { id: 1, name: 'Booking confirmation', url: '/booking-confirmation' },
  { id: 2, name: "Ticket's purchase flow", url: '/purchase-flow' },
  { id: 3, name: "Product's checkout", url: '/checkout' },
  { id: 4, name: 'User control panel', url: '/user-panel' },
  { id: 5, name: 'Edit profile', url: '/edit-profile' },
  { id: 6, name: 'Error page', url: '/error' },
  { id: 7, name: 'Event landing', url: '/event-landing' },
  { id: 8, name: "Company's event list", url: '/company-events' },
  { id: 9, name: 'Events venue grid', url: '/venue-events' },
  { id: 10, name: 'Contact us', url: '/contact' },
  { id: 11, name: 'Legal terms', url: '/legal' },
  { id: 12, name: 'Checkout page', url: '/checkout-page' },
  { id: 13, name: 'Search', url: '/search' },
  { id: 14, name: 'Events venue date schedule', url: '/schedule' },
  { id: 15, name: 'Sign up', url: '/signup' },
  { id: 16, name: 'Thank you page', url: '/thank-you' },
  { id: 17, name: 'Tour event landing', url: '/tour-landing' },
  { id: 18, name: 'Your tickets', url: '/your-tickets' }
];

const userPages = [
  { id: 101, name: 'Astrid_Carolina_Herrera_,_LO_QUE_NO_TE_DIJERON_DEL_SEXO (Copiar)' },
  { id: 102, name: 'DÍA DE LAS MADRES PIMPINELA' },
  { id: 103, name: 'Felipe_Pelaez' },
  { id: 104, name: 'Karina' },
  { id: 105, name: 'Oktober_beer_fest_2024' },
  { id: 106, name: 'PROMOCIÓN -20% POR EL DIA DEL PADRE - MERENGAZO VALENCIA' },
  { id: 107, name: 'PROMOCIÓN 20% POR EL DIA DEL PADRE - MERENGAZO VALENCIA' },
  { id: 108, name: 'Proximos_Eventos (Copiar)' },
  { id: 109, name: 'Sin_Bandera_30_de_Abril (Copiar)' },
  { id: 110, name: 'Teatro_Negro_de_Praga_' },
  { id: 111, name: 'oasis' },
  { id: 112, name: 'Republica Dominicana' },
  { id: 113, name: 'usa' },
  { id: 114, name: 'Venezuela' }
];

const headerComponents = [
  { id: 1, name: 'Classic con buscador', selected: false },
  { id: 2, name: 'Classic', selected: true },
  { id: 3, name: 'ON search', selected: true },
  { id: 4, name: 'Default', selected: false },
  { id: 5, name: 'Search minimalist', selected: true },
  { id: 6, name: 'Default search', selected: false }
];

const footerComponents = [
  { id: 1, name: 'compact', selected: false },
  { id: 2, name: 'Default', selected: false },
  { id: 3, name: 'Default centered company logo', selected: false },
  { id: 4, name: 'Default company logo', selected: true },
  { id: 5, name: 'Default no logo', selected: false }
];

const emailTemplates = [
  { id: 1, name: '15$_DESCUENTO__en_tus_entradas_solo_por_7_dias_Amigos_Invisibles' },
  { id: 2, name: '2x1' },
  { id: 3, name: 'ALL_STAR_2023' },
  { id: 4, name: 'AMIGOS' },
  { id: 5, name: 'CAMPAÑA OMAR COURTZ' },
  { id: 6, name: 'DIA_DE_LAS_MADRES' },
  { id: 7, name: 'DIA_DE_LAS_MADRES_CON_PIMPINELA' },
  { id: 8, name: 'DIMENSION_LATINA_HOUSTON' },
  { id: 9, name: 'DIMENSION_LATINA_ORLANDO' },
  { id: 10, name: 'FASNET_FEST' },
  { id: 11, name: 'Finaliza_etapa_de_Preventa_Sin_Bandera_el_28_de_Febrero_' },
  { id: 12, name: 'Gran_amanecer_llanero' },
  { id: 13, name: 'Ismael_Cala' },
  { id: 14, name: 'Karina' },
  { id: 15, name: 'Katie_Angel_' },
  { id: 16, name: 'LA_COMEDIA_DEL_AnO' },
  { id: 17, name: 'La_Casita_de_Dios_en_Valencia' },
  { id: 18, name: 'MAGIC_KIDS_$EL_MUSICAL_DE_TUS_SUEnOS$_21_DE_JULIO' },
  { id: 19, name: 'MARKO_DIRECCION' },
  { id: 20, name: 'MENSAJE_PARA_GENTE_DE_MELENDI' },
  { id: 21, name: 'MORA' },
  { id: 22, name: 'MOTO' },
  { id: 23, name: 'MOTOFEST' },
  { id: 24, name: 'MOTO_DESCUENTO_40' },
  { id: 25, name: 'Marko_Dallas_2023' },
  { id: 26, name: 'NELSON_VELASQUEZ_CHICHIRIVICHE_' },
  { id: 27, name: 'OKTOBER_BEER_FEST_' },
  { id: 28, name: 'OKTOBER_BEER_FEST_.' },
  { id: 29, name: 'OKTOBER_BEER_FEST_2024' },
  { id: 30, name: 'OMAR_COURTZ_22_DE_NOVIEMBRE' },
  { id: 31, name: 'OMAR_COURTZ_22_DE_NOVIEMBRE_2024.' },
  { id: 32, name: 'OMAR_COURTZ_22_DE_NOVIEMBRE_DEL_2024...' },
  { id: 33, name: 'PLANO_Y_CONTRAPLANO_VALENCIA' },
  { id: 34, name: 'PROFESOR_BROCEnO_PRECIOS_NUEVOS' },
  { id: 35, name: 'PROMOCION_-20$_AMANECER_VALLENATO_' },
  { id: 36, name: 'PROMOCION_-20$_POR_EL_DIA_DEL_PADRE_-_MERENGAZO_VALENCIA' },
  { id: 37, name: 'PROMO_-20$_POR_EL_DIA_DEL_PADRE_-_MERENGAZO_VALENCIA' },
  { id: 38, name: 'Preventa_MORA_$Estela__TOUR$' },
  { id: 39, name: 'Promo_Cuotas_Sin_Bandera' },
  { id: 40, name: 'Promo_Sin_Bandera' },
  { id: 41, name: 'Promocion_Ismael_Cala' },
  { id: 42, name: 'Promocion_Karina' },
  { id: 43, name: 'Proximos_Eventos' },
  { id: 44, name: 'Proximos_eventos' },
  { id: 45, name: 'Proximos_eventos_' },
  { id: 46, name: 'Proximos_eventos_2023' },
  { id: 47, name: 'Recomendaciones_Kany_Garcia' },
  { id: 48, name: 'Sin_Bandera_30_de_Abril' },
  { id: 49, name: 'VENEZUELA_ES_MUJER' },
  { id: 50, name: 'VENTAS' },
  { id: 51, name: 'VOZ_VEIS_NUEVO_FLAYER' },
  { id: 52, name: '_DESCUENTO__en_tus_entradas_solo_por_7_dias_Laura_Chimaras' },
  { id: 53, name: 'descuento_todos_los_clentes_de_kreatickets_15$_Laura_Chimaras' },
  { id: 54, name: 'melendi/sin_bandera' },
  { id: 55, name: 'plano_y_contra_plano' },
  { id: 56, name: 'voz_veis' }
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
  const [selectedPage, setSelectedPage] = useState(systemPages[0]);
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [widgetsExpanded, setWidgetsExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(false);
  const [componentsExpanded, setComponentsExpanded] = useState(false);
  const [emailsExpanded, setEmailsExpanded] = useState(false);
  const [showEmailCreator, setShowEmailCreator] = useState(false);
  const [showSiteMap, setShowSiteMap] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageData, setNewPageData] = useState({
    name: '',
    url: '',
    title: '',
    description: '',
    keywords: '',
    css: '',
    hideFromSEO: false
  });
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    item: null,
    type: null
  });

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.show]);

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
      console.log('Guardando página...', selectedPage.id, widgets);
      await saveCmsPage(selectedPage.id, widgets);
      localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      toast.success('Página guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar la página:', error);
      toast.error(`Error al guardar la página: ${error.message}`);
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

  const handleNewEmail = () => {
    setShowEmailCreator(true);
  };

  const handleCloseEmailCreator = () => {
    setShowEmailCreator(false);
  };

  const handleSiteMap = () => {
    setShowSiteMap(true);
  };

  const handleCloseSiteMap = () => {
    setShowSiteMap(false);
  };

  const handleNewPage = () => {
    setShowNewPageModal(true);
  };

  const handleCloseNewPage = () => {
    setShowNewPageModal(false);
    setNewPageData({
      name: '',
      url: '',
      title: '',
      description: '',
      keywords: '',
      css: '',
      hideFromSEO: false
    });
  };

  const handleCreateNewPage = async () => {
    if (!newPageData.name || !newPageData.url) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      // Aquí implementarías la lógica para crear la página en Supabase
      const newPage = {
        id: Date.now(),
        name: newPageData.name,
        url: newPageData.url,
        title: newPageData.title,
        description: newPageData.description,
        keywords: newPageData.keywords,
        css: newPageData.css,
        hideFromSEO: newPageData.hideFromSEO,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Agregar a la lista de páginas de usuario
      userPages.push(newPage);
      
      toast.success('Página creada exitosamente');
      handleCloseNewPage();
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Error al crear la página');
    }
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item,
      type
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      item: null,
      type: null
    });
  };

  const handleContextMenuAction = (action) => {
    const { item, type } = contextMenu;
    
    switch (action) {
      case 'edit':
        if (type === 'page') {
          // Implementar edición de página
          toast.info('Funcionalidad de edición en desarrollo');
        } else if (type === 'component') {
          // Implementar edición de componente
          toast.info('Funcionalidad de edición de componente en desarrollo');
        }
        break;
      case 'duplicate':
        if (type === 'page') {
          // Implementar duplicación de página
          toast.info('Funcionalidad de duplicación en desarrollo');
        } else if (type === 'component') {
          // Implementar duplicación de componente
          toast.info('Funcionalidad de duplicación de componente en desarrollo');
        }
        break;
      case 'delete':
        if (type === 'page') {
          if (window.confirm(`¿Estás seguro de que quieres eliminar la página "${item.name}"?`)) {
            // Implementar eliminación de página
            toast.success('Página eliminada');
          }
        } else if (type === 'component') {
          if (window.confirm(`¿Estás seguro de que quieres eliminar el componente "${item.name}"?`)) {
            // Implementar eliminación de componente
            toast.success('Componente eliminado');
          }
        }
        break;
      default:
        break;
    }
    
    closeContextMenu();
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
            <AiOutlineUp className="w-4 h-4" />
          </button>

          {/* Move Down Button */}
          <button
            className={`text-gray-500 hover:text-gray-700 font-bold ${!canMoveDown ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => canMoveDown && moveWidget(area, idx, idx + 1)}
            title="Mover abajo"
            disabled={!canMoveDown}
          >
            <AiOutlineDown className="w-4 h-4" />
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

      {/* Email Creator Modal */}
      {showEmailCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] mx-4 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Creador de Páginas de Email
                </h3>
                <button
                  onClick={handleCloseEmailCreator}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="h-full overflow-hidden">
              <EmailPageCreator setSidebarCollapsed={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Site Map Modal */}
      {showSiteMap && (
        <SiteMap onClose={handleCloseSiteMap} />
      )}

      {/* New Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Crear Nueva Página
                </h3>
                <button
                  onClick={handleCloseNewPage}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la página *
                  </label>
                  <input
                    type="text"
                    value={newPageData.name}
                    onChange={(e) => setNewPageData({ ...newPageData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la página"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">/</span>
                    <input
                      type="text"
                      value={newPageData.url}
                      onChange={(e) => setNewPageData({ ...newPageData, url: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="my-new-page"
                    />
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la página
                  </label>
                  <input
                    type="text"
                    value={newPageData.title}
                    onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título que aparecerá en el navegador"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de la página
                    <span className="text-xs text-gray-500 ml-1">(aparecerá en los buscadores)</span>
                  </label>
                  <textarea
                    value={newPageData.description}
                    onChange={(e) => setNewPageData({ ...newPageData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descripción de la página"
                  />
                </div>

                {/* Palabras clave */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Palabras clave
                    <span className="text-xs text-gray-500 ml-1">(separadas por comas)</span>
                  </label>
                  <textarea
                    value={newPageData.keywords}
                    onChange={(e) => setNewPageData({ ...newPageData, keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="palabra1, palabra2, palabra3"
                  />
                </div>

                {/* CSS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSS personalizado
                  </label>
                  <textarea
                    value={newPageData.css}
                    onChange={(e) => setNewPageData({ ...newPageData, css: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={4}
                    placeholder="/* Tu CSS personalizado aquí */"
                  />
                </div>

                {/* Ocultar de SEO */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hideFromSEO"
                      checked={newPageData.hideFromSEO}
                      onChange={(e) => setNewPageData({ ...newPageData, hideFromSEO: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="hideFromSEO" className="text-sm font-medium text-gray-700">
                      Ocultar para los robots de búsqueda
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseNewPage}
                  className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateNewPage}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Crear Página
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[150px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            onClick={() => handleContextMenuAction('edit')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <AiOutlineEdit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => handleContextMenuAction('duplicate')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <AiOutlineCopy className="w-4 h-4" />
            Duplicar
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <AiOutlineDelete className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.show && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeContextMenu}
        />
      )}
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

        {/* WEB STUDIO Header */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800">WEB STUDIO</h3>
        </div>

        {/* Mapa del sitio */}
        <div className="mb-6">
          <button 
            className="w-full text-left p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleSiteMap}
          >
            Mapa del sitio
          </button>
        </div>

        {/* Accordion Menu */}
        <div className="space-y-2">
          {/* Páginas */}
          <div className="border border-gray-300 rounded-lg">
            <button
              className="w-full text-left p-3 bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
              onClick={() => setPagesExpanded(!pagesExpanded)}
            >
              Páginas {pagesExpanded ? '▼' : '▶'}
            </button>
            
            {pagesExpanded && (
              <div className="p-3 bg-white border-t border-gray-300">
                {/* Páginas del sistema */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <i className="fas fa-folder"></i>
                    Páginas del sistema
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {systemPages.map(page => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => setSelectedPage(page)}
                      >
                        <span className="text-sm">{page.name}</span>
                        <span className="text-xs text-gray-500">{page.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tus páginas */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <i className="fas fa-folder"></i>
                    Tus páginas
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-blue-600"
                      onClick={handleNewPage}
                    >
                      <i className="fas fa-plus-circle"></i>
                      <span className="text-sm">Nueva página</span>
                    </div>
                                         {userPages.map(page => (
                       <div
                         key={page.id}
                         className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                         onClick={() => setSelectedPage(page)}
                       >
                         <span className="text-sm">{page.name}</span>
                         <button 
                           className="text-gray-400 hover:text-gray-600"
                           onClick={(e) => handleContextMenu(e, page, 'page')}
                         >
                           <i className="fas fa-ellipsis-v text-xs"></i>
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Componentes */}
          <div className="border border-gray-300 rounded-lg">
            <button
              className="w-full text-left p-3 bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
              onClick={() => setComponentsExpanded(!componentsExpanded)}
            >
              Componentes {componentsExpanded ? '▼' : '▶'}
            </button>
            
            {componentsExpanded && (
              <div className="p-3 bg-white border-t border-gray-300">
                {/* Cabeceras */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <i className="fas fa-folder"></i>
                    Cabeceras
                  </div>
                  <div className="space-y-1">
                                         {headerComponents.map(component => (
                       <div
                         key={component.id}
                         className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                       >
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${component.selected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           <span className="text-sm">{component.name}</span>
                         </div>
                         <button 
                           className="text-gray-400 hover:text-gray-600"
                           onClick={(e) => handleContextMenu(e, component, 'component')}
                         >
                           <i className="fas fa-ellipsis-v text-xs"></i>
                         </button>
                       </div>
                     ))}
                  </div>
                </div>

                {/* Pies */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <i className="fas fa-folder"></i>
                    Pies
                  </div>
                  <div className="space-y-1">
                                         {footerComponents.map(component => (
                       <div
                         key={component.id}
                         className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                       >
                         <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full ${component.selected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           <span className="text-sm">{component.name}</span>
                         </div>
                         <button 
                           className="text-gray-400 hover:text-gray-600"
                           onClick={(e) => handleContextMenu(e, component, 'component')}
                         >
                           <i className="fas fa-ellipsis-v text-xs"></i>
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Correos electrónicos */}
          <div className="border border-gray-300 rounded-lg">
            <button
              className="w-full text-left p-3 bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
              onClick={() => setEmailsExpanded(!emailsExpanded)}
            >
              Correos electrónicos {emailsExpanded ? '▼' : '▶'}
            </button>
            
            {emailsExpanded && (
              <div className="p-3 bg-white border-t border-gray-300">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-blue-600"
                    onClick={handleNewEmail}
                  >
                    <i className="fas fa-plus-circle"></i>
                    <span className="text-sm">Nuevo correo electrónico</span>
                  </div>
                  {emailTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <i className="fas fa-envelope text-gray-400"></i>
                        <span className="text-sm">{template.name}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-ellipsis-v text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Widgets disponibles */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Widgets disponibles</h4>
            <button
              onClick={() => setWidgetsExpanded(!widgetsExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {widgetsExpanded ? '▼' : '▶'}
            </button>
          </div>
          
          {widgetsExpanded && (
            <div className="space-y-4">
              {/* Categoría: Widgets de Eventos */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">📅 Widgets de Eventos</h5>
                <div className="space-y-2">
                  {availableWidgets
                    .filter(widget => widget.type.includes('evento') || widget.type.includes('Evento') || widget.type.includes('eventos') || widget.type.includes('Eventos'))
                    .map(widget => (
                      <div
                        key={widget.id}
                        className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                        onClick={() => addWidget('content', widget.type, widget.config)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={widget.preview}
                            alt={widget.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 text-sm">{widget.name}</h6>
                            <p className="text-xs text-gray-600">{widget.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Categoría: Widgets de Email */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">📧 Widgets de Email</h5>
                <div className="space-y-2">
                  {availableWidgets
                    .filter(widget => widget.type.includes('email') || widget.type.includes('Email') || widget.type.includes('Banner') || widget.type.includes('Botón') || widget.type.includes('Título') || widget.type.includes('Subtítulo') || widget.type.includes('Paragraph') || widget.type.includes('HTML'))
                    .map(widget => (
                      <div
                        key={widget.id}
                        className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                        onClick={() => addWidget('content', widget.type, widget.config)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={widget.preview}
                            alt={widget.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 text-sm">{widget.name}</h6>
                            <p className="text-xs text-gray-600">{widget.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Categoría: Widgets de Información */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">ℹ️ Widgets de Información</h5>
                <div className="space-y-2">
                  {availableWidgets
                    .filter(widget => widget.type.includes('Información') || widget.type.includes('Preguntas') || widget.type.includes('FAQ'))
                    .map(widget => (
                      <div
                        key={widget.id}
                        className="bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                        onClick={() => addWidget('content', widget.type, widget.config)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={widget.preview}
                            alt={widget.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 text-sm">{widget.name}</h6>
                            <p className="text-xs text-gray-600">{widget.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page Info */}
        <div className="mt-6 space-y-2 text-sm">
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
