import React from "react";

const RecintoSelector = ({ recintos, recintoSeleccionado, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Seleccionar Recinto</h3>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona un recinto para gestionar sus entradas y plantillas de precios
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 min-w-[80px]">
              Recinto:
            </label>
            <select
              value={recintoSeleccionado}
              onChange={e => onChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Selecciona un recinto</option>
              {recintos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {recintoSeleccionado && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Recinto seleccionado
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {recintos.find(r => r.id === recintoSeleccionado)?.nombre}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecintoSelector;
