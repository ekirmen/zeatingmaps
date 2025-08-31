import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTenant } from '../../contexts/TenantContext';
import { upsertTenantThemeSettings } from '../services/themeSettingsService';

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
  const { theme, updateTheme } = useTheme();
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('basic');
  const [colors, setColors] = useState({
    headerBg: theme.headerBg || '#ffffff',
    headerText: theme.headerText || '#000000',
    subHeaderBg: '#ffffff',
    subHeaderText: '#000000',
    primary: theme.primary || '#e94243',
    bodyBg: '#f5f5f5',
    pieBg: '#212121',
    pieText: '#5d6264',
    pieLink: '#ffffff',
    textoTitulo: '#383838',
    bodyFont: '#5d6264',
    linkColor: '#e94243',
    btnPrimary: theme.primary || '#e94243',
    btnPrimaryText: theme.btnPrimaryText || '#ffffff',
    btnSecondary: '#e7e7e7',
    btnSecondaryText: '#333333',
    contHeader: '#edefed',
    headerTextColor: '#5d6264',
    contBody: '#ffffff',
    headerLink: '#5d6264',
    borderColor: '#dce0e0',
    notifications: '#e94243',
    spinner: '#e94243',
    thumb: '#9dc51e',
    // Seat status colors
    seatAvailable: theme.seatAvailable || '#4CAF50',
    seatSelectedMe: theme.seatSelectedMe || '#1890ff',
    seatSelectedOther: theme.seatSelectedOther || '#faad14',
    seatBlocked: theme.seatBlocked || '#ff4d4f',
    seatSoldReserved: theme.seatSoldReserved || '#8c8c8c'
  });

  const handleColorChange = (key, value) => {
    setColors(prev => ({ ...prev, [key]: value }));
    updateTheme({ [key]: value });
  };

  const basicFields = [
    { key: 'headerBg', label: 'Color cabecera' },
    { key: 'headerText', label: 'Color textos cabecera' },
    { key: 'subHeaderBg', label: 'Color sub-cabecera' },
    { key: 'subHeaderText', label: 'Color textos sub-cabecera' },
    { key: 'primary', label: 'Color principal (botón, enlaces, notificaciones, spinner)' }
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
        { key: 'textoTitulo', label: 'Color textos título' },
        { key: 'bodyFont', label: 'Color textos contenidos' },
        { key: 'linkColor', label: 'Color enlaces' }
      ]
    },
    {
      title: 'Botones',
      fields: [
        { key: 'btnPrimary', label: 'Color botón primario' },
        { key: 'btnPrimaryText', label: 'Color texto botón primario' },
        { key: 'btnSecondary', label: 'Color botón secundario' },
        { key: 'btnSecondaryText', label: 'Color texto botón secundario' }
      ]
    },
    {
      title: 'Componentes',
      fields: [
        { key: 'contHeader', label: 'Color cabecera contenedor' },
        { key: 'headerTextColor', label: 'Color texto cabecera' },
        { key: 'contBody', label: 'Color cuerpo contenedor' },
        { key: 'headerLink', label: 'Color enlace cabecera' },
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
    },
    {
      title: 'Mapa de asientos',
      fields: [
        { key: 'seatAvailable', label: 'Disponible' },
        { key: 'seatSelectedMe', label: 'Seleccionado por mí' },
        { key: 'seatSelectedOther', label: 'Seleccionado por otro' },
        { key: 'seatBlocked', label: 'Bloqueado' },
        { key: 'seatSoldReserved', label: 'Vendido/Reservado' }
      ]
    }
  ];

  // Mini preview del mapa
  const SeatDot = ({ color }) => (
    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color }} />
  );

  const Preview = () => (
    <div className="mt-6 p-4 border rounded">
      <h3 className="font-semibold mb-2">Previsualización rápida</h3>
      <div className="grid grid-cols-5 gap-4">
        <div className="flex items-center gap-2"><SeatDot color={colors.seatAvailable} /> <span>Disponible</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSelectedMe} /> <span>Seleccionado por mí</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSelectedOther} /> <span>Seleccionado por otro</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatBlocked} /> <span>Bloqueado</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSoldReserved} /> <span>Vendido/Reservado</span></div>
      </div>
    </div>
  );

  const handleSave = async () => {
    updateTheme(colors);
    try {
      if (currentTenant?.id) {
        await upsertTenantThemeSettings(currentTenant.id, colors);
      }
      alert('Colores guardados');
    } catch (e) {
      alert('Guardado local OK. Error al guardar en servidor');
    }
  };

  const handleReset = () => {
    const reset = {
      seatAvailable: '#4CAF50',
      seatSelectedMe: '#1890ff',
      seatSelectedOther: '#faad14',
      seatBlocked: '#ff4d4f',
      seatSoldReserved: '#8c8c8c',
    };
    Object.keys(reset).forEach(k => updateTheme({ [k]: reset[k] }));
    setColors(prev => ({ ...prev, ...reset }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Colores Web</h2>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-1 rounded ${activeTab === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Estilos básicos
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-3 py-1 rounded ${activeTab === 'advanced' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Personalización avanzada
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

      <Preview />

      <div className="mt-4 flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>
          Guardar
        </button>
        <button className="bg-gray-100 px-4 py-2 rounded" onClick={handleReset}>
          Resetear por defecto
        </button>
      </div>
    </div>
  );
};

export default WebColors;
