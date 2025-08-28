// src/store/pages/EventsVenue.js

import React, { useEffect, useState } from 'react';

const EventsVenue = ({ groupByTags = true }) => {
  console.log('🚀 [EventsVenue] COMPONENTE DEFINIDO - ANTES DEL TRY');
  console.log('🚀 [EventsVenue] Props recibidas:', { groupByTags });
  
  try {
    console.log('🚀 [EventsVenue] Componente iniciando...');
    
    const [mounted, setMounted] = useState(false);
    const [testState, setTestState] = useState('test');
    
    console.log('🚀 [EventsVenue] Hooks useState ejecutados correctamente');
    console.log('🚀 [EventsVenue] Estado inicial:', { mounted, testState });
    
    useEffect(() => {
      console.log('🚀 [EventsVenue] useEffect ejecutándose...');
      setMounted(true);
      console.log('🚀 [EventsVenue] Componente montado correctamente');
    }, []);
    
    console.log('🚀 [EventsVenue] Componente completado, retornando JSX');
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Componente de Prueba EventsVenue</h1>
          
                     {/* Debug Panel */}
           <div className="bg-gray-100 p-4 rounded-lg mb-6">
             <h3 className="text-lg font-semibold mb-2">🔍 Debug Panel Simplificado</h3>
             <div className="space-y-2 text-sm">
               <p><strong>Componente montado:</strong> {mounted ? '✅ Sí' : '❌ No'}</p>
               <p><strong>Estado de prueba:</strong> {testState}</p>
               <p><strong>Prop groupByTags:</strong> {groupByTags ? '✅ true' : '❌ false'}</p>
               <p><strong>URL actual:</strong> {window.location.pathname}</p>
               <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
             </div>
           </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">✅ Componente Funcionando</h2>
            <p className="text-gray-600 mb-4">
              Si puedes ver este mensaje, el componente EventsVenue está funcionando correctamente.
            </p>
            <p className="text-sm text-gray-500">
              Revisa la consola para ver los logs del componente.
            </p>
          </div>
        </div>
      </div>
    );
    
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
