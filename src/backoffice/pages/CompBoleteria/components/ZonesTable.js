import React from 'react';

const ZonesTable = ({ 
  detallesPlantilla, 
  zoneQuantities, 
  handleQuantityChange, 
  handleAddZoneToCart, 
  handleSelectZoneForMap,
  getPrecioConDescuento 
}) => {
  if (!detallesPlantilla.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <p className="text-gray-500 text-lg">No hay plantilla de precios configurada</p>
        <p className="text-gray-400 text-sm">Configura los precios por zona para continuar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Zonas y Precios</h3>
        <p className="text-sm text-gray-600">Selecciona la cantidad de asientos por zona</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Zona</th>
            <th className="px-4 py-3 text-right font-medium text-gray-700">Precio</th>
            <th className="px-4 py-3 text-center font-medium text-gray-700">Cantidad</th>
            <th className="px-4 py-3 text-center font-medium text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {detallesPlantilla.map((d) => {
            const zonaId = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
            const zonaNombre = d.zona?.nombre || d.zonaId || d.zona;
            const precio = getPrecioConDescuento(d);
            return (
              <tr key={zonaId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{zonaNombre}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">${precio.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="1"
                    className="border border-gray-300 rounded px-3 py-2 w-20 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={zoneQuantities[zonaId] || ''}
                    onChange={(e) => handleQuantityChange(zonaId, e.target.value)}
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAddZoneToCart(d)}
                    disabled={!zoneQuantities[zonaId] || zoneQuantities[zonaId] <= 0}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectZoneForMap(zonaId)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Seleccionar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ZonesTable; 
