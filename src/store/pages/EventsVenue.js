// src/store/pages/EventsVenue.js

import React, { useEffect, useState } from 'react';
import EventListWidget from '../components/EventListWidget'; // Your EventListWidget component
import FaqWidget from '../components/FaqWidget'; // Your FaqWidget component
import VenueInfoWidget from '../components/VenueInfoWidget'; // New venue info widget
import FunctionInfoWidget from '../components/FunctionInfoWidget'; // New function info widget
import FeaturedEventsWidget from '../components/FeaturedEventsWidget'; // New featured events widget
import { getCmsPage, debugWebstudioTable } from '../services/apistore'; // Service to fetch CMS page data
import { useEventsList } from '../hooks/useEventsList'; // <-- Corrected import path for useEventsList

const EventsVenue = () => {
  console.log('🚀 [EventsVenue] COMPONENTE DEFINIDO - ANTES DEL TRY');
  try {
    console.log('🚀 [EventsVenue] Componente iniciando...');
    
    const [groupByTags, setGroupByTags] = useState(true);
    const [widgets, setWidgets] = useState(null);
    const [loadingCms, setLoadingCms] = useState(true);
    const [errorCms, setErrorCms] = useState(null);
    
    console.log('🚀 [EventsVenue] Props recibidas:', { groupByTags });
    console.log('🔍 [EventsVenue] Hook useEventsList disponible:', typeof useEventsList);

  console.log('🚀 [EventsVenue] Componente montado');
  console.log('🚀 [EventsVenue] Hooks useState ejecutados correctamente');
  console.log('🚀 [EventsVenue] Estado inicial:', { widgets, loadingCms, errorCms });

  // Use the new hook to fetch the list of events
  console.log('🔍 [EventsVenue] ANTES de llamar useEventsList...');
  
  let events, loadingEvents, errorEvents;
  try {
    const hookResult = useEventsList();
    events = hookResult.events;
    loadingEvents = hookResult.loading;
    errorEvents = hookResult.error;
    console.log('🔍 [EventsVenue] Hook useEventsList ejecutado exitosamente');
  } catch (error) {
    console.error('❌ [EventsVenue] Error al ejecutar useEventsList:', error);
    events = [];
    loadingEvents = false;
    errorEvents = error;
  }
  
  console.log('🔍 [EventsVenue] Hook useEventsList resultado:', { 
    events: events?.length || 0, 
    loading: loadingEvents, 
    error: errorEvents,
    eventsArray: events,
    eventsType: typeof events,
    eventsIsArray: Array.isArray(events)
  });
  
  console.log('🚀 [EventsVenue] Hook useEventsList completado, continuando con el componente...');

    // Monitor events changes
  useEffect(() => {
    console.log('🔄 [EventsVenue] useEffect - eventos cambiaron:', { 
      events: events?.length || 0, 
      loading: loadingEvents, 
      error: errorEvents 
    });
  }, [events, loadingEvents, errorEvents]);

  useEffect(() => {
    const loadCmsWidgets = async () => {
      setLoadingCms(true);
      setErrorCms(null);
      try {
        console.log('🔍 [EventsVenue] Intentando cargar página CMS: home');
        
        // Debug: verificar estructura de la tabla webstudio_pages
        await debugWebstudioTable();
        
        const data = await getCmsPage('home');
        console.log('🔍 [EventsVenue] Página CMS cargada:', data);
        
        if (data && data.widgets && data.widgets.content && data.widgets.content.length > 0) {
          setWidgets(data.widgets);
          localStorage.setItem('cms-page-home', JSON.stringify(data.widgets));
          console.log('🔍 [EventsVenue] Widgets CMS cargados exitosamente');
        } else {
          console.log('🔍 [EventsVenue] No hay widgets CMS, usando eventos como fallback');
          setWidgets({ content: [] });
        }
      } catch (e) {
        console.error('❌ [EventsVenue] Error fetching CMS page:', e);
        console.error('❌ [EventsVenue] Error details:', {
          message: e.message,
          code: e.code,
          details: e.details,
          hint: e.hint
        });
        setErrorCms(e);
        const saved = localStorage.getItem('cms-page-home');
        if (saved) {
          try {
            setWidgets(JSON.parse(saved));
            console.log('🔍 [EventsVenue] Usando widgets cacheados del localStorage');
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen text-xl text-gray-700 font-inter">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando contenido...</p>
            <div className="mt-4 text-sm text-gray-500">
              <p>CMS: {loadingCms ? 'Cargando...' : 'Completado'}</p>
              <p>Eventos: {loadingEvents ? 'Cargando...' : 'Completado'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay widgets CMS, mostrar eventos directamente
  if (!widgets || !widgets.content || widgets.content.length === 0) {
    console.log('🔍 [EventsVenue] No hay widgets CMS, mostrando eventos directamente');
    
    if (errorEvents) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar eventos</h2>
            <p className="text-red-600 mb-2">{errorEvents.message}</p>
            <p className="text-sm text-gray-500">Por favor, intenta recargar la página.</p>
          </div>
        </div>
      );
    }

    if (events && events.length > 0) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Eventos Disponibles ({events.length})</h1>
            
            {/* Debug Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Información de Debug:</h3>
              <p className="text-sm text-blue-700">Total de eventos: {events?.length || 0}</p>
              <p className="text-sm text-blue-700">Tipo de events: {typeof events}</p>
              <p className="text-sm text-blue-700">Es array: {Array.isArray(events) ? 'Sí' : 'No'}</p>
              <p className="text-sm text-blue-700">Primer evento: {events?.[0]?.name || events?.[0]?.nombre || 'Sin nombre'}</p>
              <p className="text-sm text-blue-700">Estado de carga: {loadingEvents ? 'Cargando...' : 'Completado'}</p>
              <p className="text-sm text-blue-700">Error: {errorEvents ? errorEvents.message : 'Ninguno'}</p>
              <p className="text-sm text-blue-700">Hook ejecutado: Sí</p>
            </div>
            
            <EventListWidget events={events} groupByTags={groupByTags} />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No hay eventos disponibles</h2>
          <p className="text-gray-500">No se encontraron eventos activos en este momento.</p>
        </div>
      </div>
    );
  }

  if (errorCms || errorEvents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar la página</h2>
          {errorCms && <p className="text-red-600 mb-2">{errorCms.message}</p>}
          {errorEvents && <p className="text-red-600 mb-2">{errorEvents.message}</p>}
          <p className="text-sm text-gray-500">Por favor, intenta recargar la página.</p>
        </div>
      </div>
    );
  }

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Listado de eventos':
        // Pass the fetched 'events' to EventListWidget
        return <EventListWidget events={events} groupByTags={groupByTags} />;
      
      case 'Eventos Destacados':
        return <FeaturedEventsWidget 
          maxEvents={widget.config?.maxEvents || 6}
          showStatus={true}
          showVenue={true}
        />;
      
      case 'Información de Recinto':
        return <VenueInfoWidget 
          venueId={widget.config?.venueId}
          showEvents={true}
          maxEvents={6}
        />;
      
      case 'Información de Función':
        return <FunctionInfoWidget 
          functionId={widget.config?.functionId}
          showPricing={true}
          showVenueInfo={true}
        />;
      
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

  console.log('🚀 [EventsVenue] Iniciando render del JSX...');
  console.log('🚀 [EventsVenue] Variables para render:', { events, loadingEvents, errorEvents, widgets });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Próximos Eventos
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Descubre los mejores espectáculos y eventos en tu ciudad
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl font-bold">{events ? events.length : 0}</div>
                <div className="text-sm opacity-90">Eventos Disponibles</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {events ? events.filter(e => e.estadoVenta === 'a-la-venta').length : 0}
                </div>
                <div className="text-sm opacity-90">A la Venta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">🔍 Debug Panel</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Componente montado:</strong> {mounted ? '✅ Sí' : '❌ No'}</p>
            <p><strong>Hook useEventsList disponible:</strong> {typeof useEventsList === 'function' ? '✅ Sí' : '❌ No'}</p>
            <p><strong>Estado de eventos:</strong> {loadingEvents ? '🔄 Cargando...' : events.length > 0 ? `✅ ${events.length} eventos` : '❌ Sin eventos'}</p>
            <p><strong>Estado de CMS:</strong> {loadingCms ? '🔄 Cargando...' : errorCms ? `❌ Error: ${errorCms.message}` : '✅ CMS cargado'}</p>
            <p><strong>Widgets CMS:</strong> {widgets && widgets.content ? `${widgets.content.length} widgets` : '❌ Sin widgets'}</p>
            <p><strong>Error CMS:</strong> {errorCms ? errorCms.message : '✅ Sin errores'}</p>
            <p><strong>URL actual:</strong> {window.location.pathname}</p>
            <p><strong>Cliente Supabase:</strong> {typeof window !== 'undefined' && window.supabase ? '✅ Disponible' : '❌ No disponible'}</p>
          </div>
          
          {/* Botón para probar CMS manualmente */}
          <button 
            onClick={async () => {
              try {
                console.log('🔍 [Debug] Probando CMS manualmente...');
                const { debugWebstudioTable } = await import('../services/apistore');
                await debugWebstudioTable();
              } catch (err) {
                console.error('Error en debug manual:', err);
              }
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔍 Probar CMS Manualmente
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* CMS Content */}
        {content && (
          <div className="mb-8">
            {content}
          </div>
        )}

        {/* Fallback Events Section */}
        {!content && events && events.length > 0 && (
          <div className="mb-8">
            <EventListWidget events={events} groupByTags={groupByTags} />
          </div>
        )}

        {/* No Content Message */}
        {!content && (!events || events.length === 0) && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-600">
                No hay contenido CMS configurado y no se encontraron eventos en este momento.
              </p>
            </div>
          </div>
        )}

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* How to Buy */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-blue-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cómo Comprar</h3>
            <p className="text-gray-600 text-sm">
              Selecciona tu evento, elige tus asientos y completa tu compra de forma segura.
            </p>
          </div>

          {/* Secure Payment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-green-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pago Seguro</h3>
            <p className="text-gray-600 text-sm">
              Tus datos están protegidos con la más alta seguridad en todas las transacciones.
            </p>
          </div>

          {/* Customer Support */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Soporte 24/7</h3>
            <p className="text-gray-600 text-sm">
              Nuestro equipo está disponible para ayudarte con cualquier consulta.
            </p>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 mt-12 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">¡No te pierdas ningún evento!</h3>
          <p className="text-lg opacity-90 mb-6">
            Suscríbete para recibir notificaciones de nuevos eventos y ofertas especiales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Suscribirse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  console.log('🚀 [EventsVenue] Componente completado, retornando JSX');
  
  } catch (error) {
    console.error('❌ [EventsVenue] ERROR CRÍTICO en el componente:', error);
    console.error('❌ [EventsVenue] Stack trace:', error.stack);
    
    // Fallback UI en caso de error
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error en el Componente</h2>
          <p className="text-red-600 mb-2">{error.message}</p>
          <p className="text-sm text-gray-500">Por favor, recarga la página o contacta soporte.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    );
  }
};

export default EventsVenue;
