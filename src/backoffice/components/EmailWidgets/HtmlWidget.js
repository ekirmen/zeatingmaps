import React, { useState } from 'react';

const HtmlWidget = ({ config = {}, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState({
    html: '',
    css: '',
    js: '',
    ...config
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <div className="space-y-4">
      {/* Código HTML */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código HTML
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={8}
          placeholder="<div>Tu código HTML aquí</div>"
          value={localConfig.html}
          onChange={(e) => handleConfigChange('html', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          Introduce aquí el código HTML que quieres mostrar.
        </div>
      </div>

      {/* Código CSS */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código CSS
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={6}
          placeholder="/* Tu código CSS aquí */"
          value={localConfig.css}
          onChange={(e) => handleConfigChange('css', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          Introduce aquí el código CSS para estilos personalizados.
        </div>
      </div>

      {/* Código JavaScript */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código JavaScript
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={6}
          placeholder="// Tu código JavaScript aquí"
          value={localConfig.js}
          onChange={(e) => handleConfigChange('js', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          Introduce aquí el código JavaScript que quieras que se ejecute junto al widget.
        </div>
      </div>

      {/* Vista previa */}
      {(localConfig.html || localConfig.css || localConfig.js) && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vista previa
          </label>
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">Vista previa del código:</div>
            {localConfig.html && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">HTML:</div>
                <div className="bg-white p-2 rounded border text-xs font-mono overflow-x-auto">
                  {localConfig.html}
                </div>
              </div>
            )}
            {localConfig.css && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">CSS:</div>
                <div className="bg-white p-2 rounded border text-xs font-mono overflow-x-auto">
                  {localConfig.css}
                </div>
              </div>
            )}
            {localConfig.js && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">JavaScript:</div>
                <div className="bg-white p-2 rounded border text-xs font-mono overflow-x-auto">
                  {localConfig.js}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HtmlWidget; 
