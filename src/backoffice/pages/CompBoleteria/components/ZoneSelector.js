import React from 'react';

const ZoneSelector = ({ 
  zonas, 
  selectedZonaId, 
  setSelectedZonaId, 
  handleClearZoneSelection,
  zonePriceRanges 
}) => {
  if (zonas.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Zonas disponibles:</h3>
          {selectedZonaId && (
            <button
              type="button"
              onClick={handleClearZoneSelection}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Limpiar selección
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {zonas.map(z => {
            const id = z.id || z._id;
            const isSelected = selectedZonaId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedZonaId(isSelected ? null : id)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {z.nombre}
              </button>
            );
          })}
        </div>
        {selectedZonaId && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              ✅ Zona seleccionada: <strong>{zonas.find(z => (z.id || z._id) === selectedZonaId)?.nombre}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Solo los asientos de esta zona estarán disponibles para selección
            </p>
          </div>
        )}
      </div>
      {zonePriceRanges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {zonePriceRanges.map(zr => (
            <div key={zr.nombre} className="text-xs bg-gray-100 rounded px-2 py-1">
              <strong>{zr.nombre}</strong>{' '}
              {zr.min === zr.max ? `$${zr.min.toFixed(2)}` : `$${zr.min.toFixed(2)} - $${zr.max.toFixed(2)}`}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default ZoneSelector; 