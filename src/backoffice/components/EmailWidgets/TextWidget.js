import React, { useState } from 'react';

const TextWidget = ({ config = {}, onConfigChange, type = 'text' }) => {
  const [localConfig, setLocalConfig] = useState({
    texto: '',
    ...config
  });

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const getTitle = () => {
    switch (type) {

        return 'Título';
      case 'subtitulo':
        return 'Subtítulo';
      case 'paragraph':
        return 'Párrafo';
      default:
        return 'Texto';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'titulo':
        return 'Título principal del email';
      case 'subtitulo':
        return 'Subtítulo o encabezado secundario';
      case 'paragraph':
        return 'Contenido del párrafo...';
      default:
        return 'Texto del elemento';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'titulo':
        return 'Título principal que aparecerá en el email';
      case 'subtitulo':
        return 'Subtítulo o encabezado secundario del email';
      case 'paragraph':
        return 'Contenido de texto principal del email';
      default:
        return 'Texto que se mostrará en el widget';
    }
  };

  return (
    <div className="space-y-4">
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getTitle()}
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={type === 'paragraph' ? 4 : 2}
          placeholder={getPlaceholder()}
          value={localConfig.texto}
          onChange={(e) => handleConfigChange('texto', e.target.value)}
        />
        <div className="text-xs text-gray-500 mt-1">
          {getDescription()}
        </div>
      </div>
    </div>
  );
};

export default TextWidget; 
