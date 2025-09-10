import React from 'react';

const VenueSelectors = ({ 
  recintos, 
  recintoSeleccionado, 
  handleRecintoChange,
  salaSeleccionada,
  setSalaSeleccionada,
  rightContent
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start lg:items-center justify-between gap-6">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selector de Recinto */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seleccionar Recinto *
          </label>
          <select
            id="recintoSelect"
            value={recintoSeleccionado ? recintoSeleccionado.id : ''}
            onChange={handleRecintoChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="" disabled>
              Seleccione un recinto
            </option>
            {recintos && recintos.length > 0 ? (
              recintos.map((recinto) => (
                <option key={recinto.id} value={recinto.id}>
                  {recinto.nombre}
                </option>
              ))
            ) : (
              <option value="" disabled>No hay recintos disponibles</option>
            )}
          </select>
          {recintos && recintos.length === 0 && (
            <p className="text-sm text-red-600 mt-1">
              No hay recintos configurados. Contacta al administrador.
            </p>
          )}
        </div>

        {/* Selector de Sala */}
        {recintoSeleccionado && (
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccionar Sala *
            </label>
            <select
              value={salaSeleccionada ? salaSeleccionada.id : ''}
              onChange={(e) =>
                setSalaSeleccionada(
                  recintoSeleccionado.salas?.find(
                    (sala) => String(sala.id) === e.target.value
                  )
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>
                Seleccione una sala
              </option>
              {recintoSeleccionado.salas && recintoSeleccionado.salas.length > 0 ? (
                recintoSeleccionado.salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </option>
                ))
              ) : (
                <option value="" disabled>No hay salas disponibles</option>
              )}
            </select>
            {recintoSeleccionado.salas && recintoSeleccionado.salas.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Este recinto no tiene salas configuradas.
              </p>
            )}
          </div>
        )}
        </div>

        {/* Contenido derecho (buscador, vista, crear) */}
        {rightContent && (
          <div className="flex items-center gap-3 flex-shrink-0">{rightContent}</div>
        )}
      </div>
      {/* Instrucciones */}
      {(!recintoSeleccionado || !salaSeleccionada) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Selecciona un recinto del primer dropdown</li>
                <li>Luego selecciona una sala del segundo dropdown</li>
                <li>Una vez seleccionados, podrás crear y gestionar eventos</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSelectors;