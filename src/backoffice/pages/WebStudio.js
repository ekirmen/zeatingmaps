import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlineLeft, AiOutlineEdit, AiOutlineDelete, AiOutlineCopy, AiOutlineUp, AiOutlineDown } from 'react-icons/ai';
import { AiOutlineSetting } from 'react-icons/ai';
import EmailWidgetRenderer from '../components/EmailWidgets/EmailWidgetRenderer';
import EmailTestPanel from '../components/EmailTestPanel';
import EmailPageCreator from './EmailPageCreator';
import SiteMap from '../components/SiteMap';
import { fetchCmsPage, saveCmsPage, fetchAllCmsPages } from '../services/apibackoffice';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../hooks/useTenant';

// Las páginas ahora se cargan dinámicamente desde la base de datos
// No necesitamos arrays estáticos

// Eliminar menú de componentes - solo mantener páginas y correos
const headerComponents = [];
const footerComponents = [];

// Correos electrónicos reales (sin correos de prueba)
const emailTemplates = [
  { id: 1, name: 'Promoción 15% Descuento - Amigos Invisibles', url: '/emails/promocion-amigos-invisibles', type: 'email' },
  { id: 2, name: 'Oferta 2x1', url: '/emails/oferta-2x1', type: 'email' },
  { id: 3, name: 'ALL STAR 2023', url: '/emails/all-star-2023', type: 'email' },
  { id: 4, name: 'Campaña AMIGOS', url: '/emails/campana-amigos', type: 'email' },
  { id: 5, name: 'Día de las Madres', url: '/emails/dia-madres', type: 'email' },
  { id: 6, name: 'Día de las Madres con Pimpinela', url: '/emails/dia-madres-pimpinela', type: 'email' },
  { id: 7, name: 'Dimension Latina Houston', url: '/emails/dimension-latina-houston', type: 'email' },
  { id: 8, name: 'Dimension Latina Orlando', url: '/emails/dimension-latina-orlando', type: 'email' },
  { id: 9, name: 'Fasnet Fest', url: '/emails/fasnet-fest', type: 'email' },
  { id: 10, name: 'Gran Amanecer Llanero', url: '/emails/gran-amanecer-llanero', type: 'email' }
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
  // Estado para páginas reales de la base de datos
  const [cmsPages, setCmsPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);

  // Estado para la página seleccionada (usando datos reales)
  const [selectedPage, setSelectedPage] = useState(null);
  const [widgets, setWidgets] = useState(defaultWidgets);

  // Estado para manejar errores de carga
  const [loadError, setLoadError] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [pagesExpanded, setPagesExpanded] = useState(true);
  const [emailsExpanded, setEmailsExpanded] = useState(false);
  const [widgetsExpanded, setWidgetsExpanded] = useState(true);
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
  const [editingPage, setEditingPage] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    item: null,
    type: null
  });

  // Hook optimizado para obtener tenant_id
  const { tenantId, loading: tenantLoading } = useTenant();

  // Cargar páginas desde la base de datos al montar el componente
  useEffect(() => {
    const loadCmsPages = async () => {
      if (!tenantId) return;

      setLoadingPages(true);
      try {
        // Cargar páginas del tenant actual usando el hook optimizado
        const { data: tenantPages, error: tenantError } = await supabase
          .from('cms_pages')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('nombre');

        if (tenantError) {
          console.error('❌ [WebStudio] Error cargando páginas del tenant:', tenantError);
          toast.error('Error cargando páginas del tenant');
          return;
        }

        // Cargar páginas del sistema (sin tenant_id o con tenant_id null)
        const { data: systemPages, error: systemError } = await supabase
          .from('cms_pages')
          .select('*')
          .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
          .in('slug', ['inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq'])
          .order('nombre');

        if (systemError) {
          console.error('❌ [WebStudio] Error cargando páginas del sistema:', systemError);
        }

        // Combinar páginas del sistema y del tenant
        const allPages = [
          ...(systemPages || []),
          ...(tenantPages || [])
        ];

        // Remover duplicados por ID y validar que tengan campos requeridos
        const uniquePages = allPages
          .filter((page, index, self) =>
            index === self.findIndex(p => p.id === page.id)
          )
          .map(page => ({
            ...page,
            nombre: page.nombre || 'Sin nombre',
            slug: page.slug || `page-${page.id}`,
            widgets: page.widgets || { header: [], content: [], footer: [] }
          }));

        setCmsPages(uniquePages);

        // Seleccionar la primera página por defecto
        if (uniquePages.length > 0 && !selectedPage) {
          const firstPage = uniquePages[0];
          // Asegurarse de que la página tenga todos los campos necesarios
          if (firstPage && firstPage.id) {
            setSelectedPage(firstPage);
          }
        }
      } catch (error) {
        console.error('❌ [WebStudio] Error cargando páginas CMS:', error);
        setLoadError(error.message);
        toast.error('Error cargando páginas CMS');
      } finally {
        setLoadingPages(false);
      }
    };

    loadCmsPages();
  }, [tenantId]);

  useEffect(() => {
    if (setSidebarCollapsed) setSidebarCollapsed(true);
    return () => setSidebarCollapsed && setSidebarCollapsed(false);
  }, [setSidebarCollapsed]);

  // Cargar widgets cuando cambie la página seleccionada
  useEffect(() => {
    if (!selectedPage) return;

    const loadPage = async () => {
      setPageLoaded(false);
      try {
        // Usar el ID de la página para cargar desde la base de datos
        const data = await fetchCmsPage(selectedPage.id);

        if (data) {
          // Página encontrada en la base de datos
          console.log(`✅ [WebStudio] Página cargada desde BD: ${data.slug} (ID: ${data.id})`);
          setWidgets(data.widgets || defaultWidgets);
        } else {
          // Página no encontrada, usar localStorage como fallback
          const saved = localStorage.getItem(`cms-page-${selectedPage.id}`);
          if (saved) {
            setWidgets(JSON.parse(saved));
          } else {
            setWidgets(defaultWidgets);
          }
        }
      } catch (e) {
        console.error('❌ [WebStudio] Error cargando página:', e);
        // Fallback a localStorage si existe
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

  // Auto-guardar cuando cambien los widgets
  useEffect(() => {
    if (!pageLoaded || !selectedPage) return;
    const autoSave = async () => {
      try {
        // Usar el slug de la página, no el ID
        const pageSlug = selectedPage.slug || selectedPage.id;
        console.log(`💾 [WebStudio] Auto-save para página: ${pageSlug} (ID: ${selectedPage.id})`);

        await saveCmsPage(pageSlug, widgets);
        localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      } catch (err) {
        console.error('❌ [WebStudio] Auto save failed:', err);
        // No hacer nada más, solo loggear el error
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
      if (!selectedPage) {
        toast.error('No hay página seleccionada');
        return;
      }
      await saveCmsPage(selectedPage.id, widgets);
      localStorage.setItem(`cms-page-${selectedPage.id}`, JSON.stringify(widgets));
      toast.success('Página guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar la página:', error);
      toast.error(`Error al guardar la página: ${error.message}`);
    }
  };

  const handleClearCache = () => {
    if (!selectedPage) {
      toast.error('No hay página seleccionada');
      return;
    }
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
      // Obtener el tenant_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.tenant_id) {
        toast.error('Usuario sin tenant válido');
        return;
      }

      // Crear slug a partir del nombre
      const slug = newPageData.url.replace(/^\//, '').toLowerCase().replace(/\s+/g, '-');

      // Crear la página en la base de datos
      const { data: newPage, error } = await supabase
        .from('cms_pages')
        .insert([{
          slug: slug,
          nombre: newPageData.name,
          widgets: {
            header: [],
            content: [],
            footer: []
          },
          tenant_id: profile.tenant_id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creando página:', error);
        toast.error('Error al crear la página en la base de datos');
        return;
      }

      // Agregar la nueva página al estado local
      setCmsPages(prevPages => [...prevPages, newPage]);

      // Seleccionar la nueva página
      setSelectedPage(newPage);

      toast.success('Página creada exitosamente');
      handleCloseNewPage();
    } catch (error) {
      console.error('Error inesperado al crear página:', error);
      toast.error('Error inesperado al crear la página');
    }
  };

  // Funciones para edición inline
  const startEditing = (page, field) => {
    setEditingPage(page);
    setEditingField(field);
    setEditingValue(page[field] || '');
  };

  const saveEditing = async () => {
    if (editingPage && editingField) {
      try {
        const updatedPage = { ...editingPage, [editingField]: editingValue };

        // Actualizar en la base de datos
        const { error } = await supabase
          .from('cms_pages')
          .update({ [editingField]: editingValue })
          .eq('id', editingPage.id);

        if (error) {
          console.error('Error actualizando página:', error);
          toast.error('Error al actualizar la página');
          return;
        }

        // Actualizar en el estado local
        setCmsPages(prevPages =>
          prevPages.map(page =>
            page.id === editingPage.id ? updatedPage : page
          )
        );

        // Si es la página seleccionada, actualizarla también
        if (selectedPage && selectedPage.id === editingPage.id) {
          setSelectedPage(updatedPage);
        }

        toast.success('Página actualizada exitosamente');
      } catch (error) {
        console.error('Error inesperado al actualizar:', error);
        toast.error('Error inesperado al actualizar la página');
      }
    }

    setEditingPage(null);
    setEditingField(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingPage(null);
    setEditingField(null);
    setEditingValue('');
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

  const handleContextMenuAction = async (action) => {
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
          if (window.confirm(`¿Estás seguro de que quieres eliminar la página "${item.nombre || item.name}"?`)) {
            try {
              // Eliminar de la base de datos
              const { error } = await supabase
                .from('cms_pages')
                .delete()
                .eq('id', item.id);

              if (error) {
                console.error('Error eliminando página:', error);
                toast.error('Error al eliminar la página');
                return;
              }

              // Eliminar del estado local
              setCmsPages(prevPages => prevPages.filter(page => page.id !== item.id));

              // Si es la página seleccionada, seleccionar otra
              if (selectedPage && selectedPage.id === item.id) {
                const remainingPages = cmsPages.filter(page => page.id !== item.id);
                if (remainingPages.length > 0) {
                  setSelectedPage(remainingPages[0]);
                } else {
                  setSelectedPage(null);
                }
              }

              toast.success('Página eliminada exitosamente');
            } catch (error) {
              console.error('Error inesperado al eliminar:', error);
              toast.error('Error inesperado al eliminar la página');
            }
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
                {loadingPages ? (
                  <div className="text-center py-4 text-gray-500">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Cargando páginas...
                  </div>
                ) : loadError ? (
                  <div className="text-center py-4 text-red-500">
                    <p className="text-sm mb-2">Error al cargar páginas:</p>
                    <p className="text-xs">{loadError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Páginas del sistema */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                        <i className="fas fa-folder"></i>
                        Páginas del sistema
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {cmsPages
                          .filter(page => page && page.id && ['inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq'].includes(page.slug))
                          .map(page => (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer ${
                                selectedPage?.id === page.id ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => setSelectedPage(page)}
                            >
                              <div className="flex-1">
                                {editingPage?.id === page.id && editingField === 'nombre' ? (
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditing();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm">{page.nombre || 'Sin nombre'}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {editingPage?.id === page.id && editingField === 'nombre' ? (
                                  <>
                                    <button
                                      onClick={saveEditing}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      ✗
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(page, 'nombre');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
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
                        {cmsPages
                          .filter(page => page && page.id && !['inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq'].includes(page.slug))
                          .map(page => (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer ${
                                selectedPage?.id === page.id ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                              onClick={() => setSelectedPage(page)}
                            >
                              <div className="flex-1">
                                {editingPage?.id === page.id && editingField === 'nombre' ? (
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditing();
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm">{page.nombre || 'Sin nombre'}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {editingPage?.id === page.id && editingField === 'nombre' ? (
                                  <>
                                    <button
                                      onClick={saveEditing}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      ✗
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(page, 'nombre');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
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
                      onClick={() => setSelectedPage(template)}
                    >
                      <div className="flex items-center gap-2">
                        <i className="fas fa-envelope text-gray-400"></i>
                        <span className="text-sm">{template.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingPage?.id === template.id && editingField === 'name' ? (
                          <>
                            <button
                              onClick={saveEditing}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✗
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(template, 'name');
                            }}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
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
        {selectedPage && (
          <div className="mt-6 space-y-2 text-sm">
            <div>
              <label className="block text-gray-600">Nombre</label>
              <input className="border w-full px-2 py-1 rounded" value={selectedPage.nombre || selectedPage.name || ''} readOnly />
            </div>
            <div>
              <label className="block text-gray-600">URL</label>
              <input className="border w-full px-2 py-1 rounded" value={selectedPage.slug || selectedPage.url || ''} readOnly />
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <button
            onClick={handleSave}
            disabled={!selectedPage}
            className={`w-full py-2 rounded transition-colors ${
              selectedPage
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Guardar página
          </button>
          <button
            onClick={handleClearCache}
            disabled={!selectedPage}
            className={`w-full py-2 rounded transition-colors ${
              selectedPage
                ? 'bg-gray-400 hover:bg-gray-500 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Limpiar cache
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {/* Header con nombre de página seleccionada */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {selectedPage ? (selectedPage.nombre || selectedPage.name) : 'Selecciona una página'}
          </h1>
          {selectedPage && (
            <p className="text-gray-600">
              URL: /{selectedPage.slug || selectedPage.url} • Tipo: {
                ['inicio', 'eventos', 'recintos', 'contacto', 'acerca-de', 'terminos', 'privacidad', 'faq'].includes(selectedPage.slug)
                  ? 'Página del sistema'
                  : 'Página personalizada'
              }
            </p>
          )}
        </div>

        {selectedPage ? (
          ['header', 'content', 'footer'].map((area) => (
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
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Selecciona una página para comenzar a editar</p>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && renderSettingsPanel()}
      </main>
    </div>
  );
};

export default WebStudio;
