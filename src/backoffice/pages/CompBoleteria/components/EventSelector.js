import React from 'react';
import resolveImageUrl from '../../../../utils/resolveImageUrl';

const EventSelector = ({ 
  eventos = [], 
  selectedEvent, 
  onEventSelect, 
  funciones = [], 
  onShowFunctions, 
  selectedFuncion 
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            className="border p-2 rounded text-sm pr-8"
            value={selectedEvent?.id || selectedEvent?._id || ''}
            onChange={(e) => onEventSelect(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar evento
            </option>
            {eventos.map((ev) => (
              <option key={ev.id || ev._id} value={ev.id || ev._id}>
                {ev.nombre}
              </option>
            ))}
          </select>
          {selectedEvent?.imagenes?.logoCuadrado && (
            <img
              src={resolveImageUrl(selectedEvent.imagenes.logoCuadrado)}
              alt="Evento"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 object-cover rounded"
            />
          )}
        </div>
        {funciones.length >= 2 && !selectedFuncion && (
          <button
            onClick={onShowFunctions}
            className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Mostrar Funciones
          </button>
        )}
      </div>
    </>
  );
};

export default EventSelector; 
