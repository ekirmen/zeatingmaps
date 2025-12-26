import React from 'react';
import { EnvironmentOutlined, TagOutlined } from '@ant-design/icons';

const ViewModeSelector = ({ showSeatingMap, viewMode, setViewMode }) => {
  if (!showSeatingMap) return null;

  return (
    <div className="bg-gray-100 p-3 rounded-lg">
      <div className="text-sm font-medium mb-2">Tipo de vista:</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'map'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          <EnvironmentOutlined /> Mapa
        </button>
        <button
          type="button"
          onClick={() => setViewMode('zonas')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'zonas'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          <TagOutlined /> Zonas
        </button>
      </div>
      <div className="text-xs text-gray-600 mt-2">
        {viewMode === 'map'
          ? 'Selecciona asientos individuales o usa "Mesa completa" para seleccionar toda la mesa'
          : 'Selecciona zonas y cantidades para agregar al carrito'
        }
      </div>
    </div>
  );
};

export default ViewModeSelector; 
