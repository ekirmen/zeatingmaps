import React from 'react';

const ZoneSelector = ({ 
  zonas, 
  selectedZonaId, 
  setSelectedZonaId, 
  handleClearZoneSelection,
  zonePriceRanges,
  detallesPlantilla 
}) => {
  if (zonas.length === 0) return null;

  // Agrupar detalles por zona y tipo de entrada
  const zoneDetails = {};
  detallesPlantilla.forEach(detalle => {
    const zonaId = detalle.zonaId;
    const tipoEntrada = detalle.tipoEntrada || 'regular';
    const precio = detalle.precio || 0;
    const comision = detalle.comision || 0;
    
    if (!zoneDetails[zonaId]) {
      zoneDetails[zonaId] = {};
    }
    zoneDetails[zonaId][tipoEntrada] = {
      precio,
      comision,
      tipoEntrada
    };
  });

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
            const zonaDetalles = zoneDetails[id] || {};
            
            return (
              <div key={id} className="w-full">
                <button
                  type="button"
                  onClick={() => setSelectedZonaId(isSelected ? null : id)}
                  className={`w-full px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {z.nombre}
                </button>
                
                {/* Mostrar tipos de entrada disponibles para esta zona */}
                {Object.keys(zonaDetalles).length > 0 && (
                  <div className="mt-2 ml-2 space-y-1">
                    {Object.entries(zonaDetalles).map(([tipo, detalle]) => (
                      <div key={tipo} className="text-xs bg-gray-50 rounded px-2 py-1 flex justify-between items-center">
                        <span className="capitalize">{tipo}</span>
                        <div className="text-right">
                          <div className="font-medium">${detalle.precio.toFixed(2)}</div>
                          {detalle.comision > 0 && (
                            <div className="text-gray-500">+${detalle.comision.toFixed(2)} comisión</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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