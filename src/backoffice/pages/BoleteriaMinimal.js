import React from 'react';

const BoleteriaMinimal = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">🎫 Boletería</h2>
        <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Boletería Minimal</h3>
          <p className="text-gray-500 mb-4">
            Esta es una versión completamente simplificada para identificar problemas de dependencias circulares.
          </p>
          
          {/* Información básica */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-medium text-gray-700 mb-2">Estado:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Versión minimal funcionando</p>
              <p>• Sin dependencias circulares</p>
              <p>• Listo para agregar funcionalidades paso a paso</p>
            </div>
          </div>

          {/* Botones de prueba */}
          <div className="mt-4 space-x-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                console.log('Botón de prueba funcionando');
              }}
            >
              Probar Funcionalidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoleteriaMinimal;
