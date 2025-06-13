import React, { useState } from 'react';

const ColorInput = ({ label, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="w-10 h-10 p-0 border"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <input
        type="text"
        className="border p-1 w-24"
        maxLength={7}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

const WebColors = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [colors, setColors] = useState({
    headerBg: '#ffffff',
    headerText: '#000000',
    subHeaderBg: '#ffffff',
    subHeaderText: '#000000',
    primary: '#e94243',
    bodyBg: '#f5f5f5',
    pieBg: '#212121',
    pieText: '#5d6264',
    pieLink: '#ffffff',
    textoTitulo: '#383838',
    bodyFont: '#5d6264',
    linkColor: '#e94243',
    btnPrimary: '#e94243',
    btnPrimaryText: '#ffffff',
    btnSecondary: '#e7e7e7',
    btnSecondaryText: '#333333',
    contHeader: '#edefed',
    headerTextColor: '#5d6264',
    contBody: '#ffffff',
    headerLink: '#5d6264',
    borderColor: '#dce0e0',
    notifications: '#e94243',
    spinner: '#e94243',
    thumb: '#9dc51e'
  });

  const handleColorChange = (key, value) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const basicFields = [
    { key: 'headerBg', label: 'Color cabecera' },
    { key: 'headerText', label: 'Color textos cabecera' },
    { key: 'subHeaderBg', label: 'Color sub-cabecera' },
    { key: 'subHeaderText', label: 'Color textos sub-cabecera' },
    { key: 'primary', label: 'Color principal (bot\u00f3n, enlaces, notificaciones, spinner)' }
  ];

  const advancedGroups = [
    {
      title: 'Estructura',
      fields: [
        { key: 'bodyBg', label: 'Color de fondo' },
        { key: 'pieBg', label: 'Color pie' },
        { key: 'pieText', label: 'Color texto pie' },
        { key: 'pieLink', label: 'Color enlace pie' }
      ]
    },
    {
      title: 'Textos',
      fields: [
        { key: 'textoTitulo', label: 'Color textos titulo' },
        { key: 'bodyFont', label: 'Color textos contenidos' },
        { key: 'linkColor', label: 'Color enlaces' }
      ]
    },
    {
      title: 'Botones',
      fields: [
        { key: 'btnPrimary', label: 'Color bot\u00f3n primario' },
        { key: 'btnPrimaryText', label: 'Color texto bot\u00f3n primario' },
        { key: 'btnSecondary', label: 'Color bot\u00f3n secundario' },
        { key: 'btnSecondaryText', label: 'Color texto bot\u00f3n secundario' }
      ]
    },
    {
      title: 'Componentes',
      fields: [
        { key: 'contHeader', label: 'Color cabecera contenedor' },
        { key: 'headerTextColor', label: 'Color de texto de cabecera' },
        { key: 'contBody', label: 'Color cuerpo contenedor' },
        { key: 'headerLink', label: 'Color de link en cabecera' },
        { key: 'borderColor', label: 'Color borde contenedor' }
      ]
    },
    {
      title: 'Varios',
      fields: [
        { key: 'notifications', label: 'Color notificaciones' },
        { key: 'spinner', label: 'Color spinner' },
        { key: 'thumb', label: 'Color pulgar arriba' }
      ]
    }
  ];

  const handleSave = () => {
    console.log('Colors saved', colors);
    alert('Colores guardados');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Colores Web</h2>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-1 rounded ${activeTab === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Estilos b\u00e1sicos
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-3 py-1 rounded ${activeTab === 'advanced' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Personalizaci\u00f3n avanzada
        </button>
      </div>

      {activeTab === 'basic' && (
        <div>
          {basicFields.map(f => (
            <ColorInput
              key={f.key}
              label={f.label}
              value={colors[f.key]}
              onChange={val => handleColorChange(f.key, val)}
            />
          ))}
        </div>
      )}

      {activeTab === 'advanced' && (
        <div>
          {advancedGroups.map(group => (
            <details key={group.title} className="mb-4 border rounded">
              <summary className="cursor-pointer font-semibold p-2 bg-gray-100">{group.title}</summary>
              <div className="p-2 grid md:grid-cols-3 gap-4">
                {group.fields.map(f => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key]}
                    onChange={val => handleColorChange(f.key, val)}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>
        Guardar
      </button>
    </div>
  );
};

export default WebColors;

