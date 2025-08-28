import React from 'react';

const TestComponent = () => {
  // FORZAR EJECUCIÓN INMEDIATA
  console.error('🚨 [TestComponent] COMPONENTE DE PRUEBA FUNCIONANDO');
  console.error('🚨 [TestComponent] Timestamp:', new Date().toISOString());
  console.error('🚨 [TestComponent] Build ID:', Math.random().toString(36).substr(2, 9));
  
  // Alert para forzar visibilidad
  try {
    alert('🚨 COMPONENTE DE PRUEBA DESDE ARCHIVO SEPARADO FUNCIONANDO - ' + new Date().toISOString());
  } catch (e) {
    console.error('Error en alert:', e);
  }
  
  return (
    <div className="min-h-screen bg-yellow-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-900 mb-8">🚨 COMPONENTE DE PRUEBA DESDE ARCHIVO SEPARADO</h1>
        <div className="bg-yellow-200 p-4 rounded-lg border-2 border-yellow-500">
          <p className="text-yellow-800 font-semibold">✅ Este componente se creó en un archivo separado</p>
          <p className="text-yellow-700">✅ Si lo ves, el problema está en la importación de EventsVenue</p>
          <p className="text-yellow-700">✅ Timestamp: {new Date().toISOString()}</p>
          <p className="text-yellow-700">✅ Build ID: {Math.random().toString(36).substr(2, 9)}</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
