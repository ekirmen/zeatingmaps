import React, { useState, forwardRef } from 'react';
import { message, Select } from 'antd';

// Importar componentes paso a paso
import EventSelector from './components/EventSelector';
import FunctionSelector from './components/FunctionSelector';

const ZonesAndPricesSimple = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  setSelectedEvent,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  onFunctionSelect,
  setSelectedFuncion,
  carrito,
  setCarrito,
  selectedPlantilla,
  setSelectedPlantilla,
  selectedClient,
  setSelectedClient,
  abonos = [],
  selectedAffiliate,
  setSelectedAffiliate,
  showSeatingMap = true,
  plantillas = [],
}, ref) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">🎫 Zonas y Precios</h2>
        <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Zonas y Precios</h3>
          <p className="text-gray-500 mb-4">
            Esta vista está temporalmente simplificada para resolver problemas de dependencias circulares.
          </p>
          
          {/* Selector de Eventos */}
          <div className="mb-4">
            <EventSelector
              eventos={eventos}
              selectedEvent={selectedEvent}
              onEventSelect={onEventSelect}
              funciones={funciones}
              onShowFunctions={onShowFunctions}
              selectedFuncion={selectedFuncion}
            />
          </div>
          
          {/* Selector de Funciones */}
          <div className="mb-4">
            <FunctionSelector
              funciones={funciones}
              selectedFuncion={selectedFuncion}
              onFunctionSelect={onFunctionSelect}
              selectedEvent={selectedEvent}
            />
          </div>
          
          {/* Información básica */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-medium text-gray-700 mb-2">Estado Actual:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Eventos disponibles: {eventos.length}</p>
              <p>• Funciones disponibles: {funciones.length}</p>
              <p>• Evento seleccionado: {selectedEvent ? selectedEvent.nombre || selectedEvent.name : 'Ninguno'}</p>
              <p>• Función seleccionada: {selectedFuncion ? selectedFuncion.nombre || selectedFuncion.name : 'Ninguna'}</p>
              <p>• Plantilla seleccionada: {selectedPlantilla ? selectedPlantilla.nombre || selectedPlantilla.name : 'Ninguna'}</p>
              <p>• Cliente seleccionado: {selectedClient ? selectedClient.nombre || selectedClient.name : 'Ninguno'}</p>
              <p>• Asientos en carrito: {carrito.length}</p>
            </div>
          </div>

          {/* Botones de prueba */}
          <div className="mt-4 space-x-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                message.info('Botón de prueba funcionando');
              }}
            >
              Probar Funcionalidad
            </button>
            
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => {
                if (eventos.length > 0) {
                  onEventSelect(eventos[0].id || eventos[0]._id);
                  message.success('Evento seleccionado');
                } else {
                  message.warning('No hay eventos disponibles');
                }
              }}
            >
              Seleccionar Primer Evento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default forwardRef(ZonesAndPricesSimple);
