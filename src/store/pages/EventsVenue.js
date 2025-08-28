// src/store/pages/EventsVenue.js

import React from 'react';

const EventsVenue = ({ groupByTags = true }) => {
  // FORZAR VISIBILIDAD DEL PROBLEMA
  console.error('🚨 [EventsVenue] ERROR FORZADO - Componente se está ejecutando');
  console.error('🚨 [EventsVenue] Props recibidas:', { groupByTags });
  console.error('🚨 [EventsVenue] Timestamp:', new Date().toISOString());
  
  // Alert para forzar visibilidad
  if (typeof window !== 'undefined') {
    try {
      alert('🚨 COMPONENTE EventsVenue SE ESTÁ EJECUTANDO - groupByTags: ' + groupByTags);
    } catch (e) {
      console.error('Error en alert:', e);
    }
  }
  
  try {
    console.log('🚀 [EventsVenue] Componente iniciando...');
    
    console.log('🚀 [EventsVenue] Componente completado, retornando JSX');
    
    return (
      <div className="min-h-screen bg-red-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-red-900 mb-8">🚨 COMPONENTE DE PRUEBA CRÍTICO</h1>
          
          {/* Debug Panel */}
          <div className="bg-red-200 p-4 rounded-lg mb-6 border-2 border-red-500">
            <h3 className="text-lg font-semibold mb-2 text-red-800">🚨 Debug Panel CRÍTICO</h3>
            <div className="space-y-2 text-sm text-red-700">
              <p><strong>Prop groupByTags:</strong> {groupByTags ? '✅ true' : '❌ false'}</p>
              <p><strong>URL actual:</strong> {window.location.pathname}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>Componente funcionando:</strong> 🚨 SÍ - CON ALERT</p>
              <p><strong>Build ID:</strong> {Math.random().toString(36).substr(2, 9)}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center border-2 border-red-500">
            <h2 className="text-2xl font-semibold text-red-800 mb-4">🚨 COMPONENTE CRÍTICO FUNCIONANDO</h2>
            <p className="text-red-600 mb-4">
              Si puedes ver este mensaje, el componente EventsVenue está funcionando correctamente.
            </p>
            <p className="text-sm text-red-500">
              Revisa la consola para ver los logs del componente.
            </p>
            <div className="mt-4 p-4 bg-red-100 rounded border border-red-300">
              <p className="text-red-800 font-semibold">🎯 DIAGNÓSTICO CRÍTICO:</p>
              <p className="text-red-700">groupByTags = {groupByTags ? 'true' : 'false'}</p>
              <p className="text-red-700">URL = {window.location.pathname}</p>
              <p className="text-red-700">Build ID = {Math.random().toString(36).substr(2, 9)}</p>
            </div>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('❌ [EventsVenue] ERROR CRÍTICO en el componente:', error);
    console.error('❌ [EventsVenue] Stack trace:', error.stack);
    
    // Fallback UI en caso de error
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error en el Componente</h2>
          <p className="text-red-600 mb-2">{error.message}</p>
          <p className="text-sm text-red-500">Por favor, recarga la página o contacta soporte.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    );
  }
};

export default EventsVenue;
