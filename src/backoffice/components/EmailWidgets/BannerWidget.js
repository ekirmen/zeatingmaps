import React, { useState } from 'react';

const BannerWidget = ({ config = {}, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState({
    texto: '',
    imagen: '',
    ...config
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <div className="space-y-4">
      {/* Texto del banner */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto del banner
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Texto del banner"
          value={localConfig.texto}
          onChange={(e) => handleConfigChange('texto', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          Texto que aparecerá sobre la imagen del banner.
        </div>
      </div>

      {/* URL de la imagen */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL de la imagen
        </label>
        <input
          type="url"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://ejemplo.com/imagen.jpg"
          value={localConfig.imagen}
          onChange={(e) => handleConfigChange('imagen', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          URL de la imagen del banner. Asegúrate de que sea accesible públicamente.
        </div>
      </div>

      {/* Vista previa */}
      {localConfig.imagen && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vista previa
          </label>
          <div className="border border-gray-300 rounded-md p-2">
            <img
              src={localConfig.imagen}
              alt="Vista previa del banner"
              className="w-full h-32 object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden text-center text-gray-500 py-8">
              No se pudo cargar la imagen
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerWidget; 