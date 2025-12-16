import React, { useState } from 'react';

const EventWidget = ({ config = {}, onConfigChange, type = 'evento' }) => {
  const [localConfig, setLocalConfig] = useState({
    eventoId: '',
    funcionId: '',
    ...config
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };



  const getDescription = () => {
    switch (type) {
      case 'informacion-evento':
        return 'ID del evento que se mostrará en el email';
      case 'banner-grande':
        return 'ID del evento para el banner grande';
      case 'banner-mediano':
        return 'ID del evento para el banner mediano';
      default:
        return 'ID del evento';
    }
  };

  return (
    <div className="space-y-4">
      {/* ID del evento */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ID del evento
        </label>
        <input
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123"
          value={localConfig.eventoId}
          onChange={(e) => handleConfigChange('eventoId', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          {getDescription()}
        </div>
      </div>

      {/* ID de la función (solo para banners) */}
      {(type === 'banner-grande' || type === 'banner-mediano') && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID de la función
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="456"
            value={localConfig.funcionId}
            onChange={(e) => handleConfigChange('funcionId', e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            ID de la función específica del evento (opcional)
          </div>
        </div>
      )}
    </div>
  );
};

export default EventWidget; 
