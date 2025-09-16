import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTenant } from '../../contexts/TenantContext';
import { upsertTenantThemeSettings } from '../services/themeSettingsService';
import EventThemePanel from '../components/EventThemePanel';
import { supabase } from '../../supabaseClient';
import { message } from 'antd';

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
  const [loading, setLoading] = useState(false);
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
    seatSelectedMe: theme.seatSelectedMe || '#ffd700',
    seatSelectedOther: theme.seatSelectedOther || '#faad14',
    seatBlocked: theme.seatBlocked || '#ff4d4f',
    seatSold: theme.seatSold || '#8c8c8c',
    seatReserved: theme.seatReserved || '#722ed1',
    seatCancelled: theme.seatCancelled || '#ff6b6b'
  });

  // 🎨 CARGAR COLORES DESDE webstudio_colors
  useEffect(() => {
    loadWebStudioColors();
  }, [currentTenant?.id]);

  const loadWebStudioColors = async () => {
    if (!currentTenant?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webstudio_colors')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error loading webstudio colors:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const webstudioColors = data[0];
        console.log('🎨 Colores WebStudio cargados:', webstudioColors);
        
        // Actualizar colores locales con datos de la base de datos
        const updatedColors = {
          ...colors,
          ...webstudioColors.colors,
          ...webstudioColors.seat_colors
        };
        
        setColors(updatedColors);
        
        // Actualizar tema global
        updateTheme(updatedColors);
        
        message.success('Colores cargados desde la base de datos');
      }
      
    } catch (error) {
      console.error('Error loading webstudio colors:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 GUARDAR COLORES EN webstudio_colors
  const saveWebStudioColors = async () => {
    if (!currentTenant?.id) {
      message.warning('No hay tenant seleccionado');
      return;
    }

    try {
      setLoading(true);
      
      // Separar colores de asientos del resto
      const seatColors = {
        seatAvailable: colors.seatAvailable,
        seatSelectedMe: colors.seatSelectedMe,
        seatSelectedOther: colors.seatSelectedOther,
        seatBlocked: colors.seatBlocked,
        seatSold: colors.seatSold,
        seatReserved: colors.seatReserved
      };
      
      const generalColors = Object.fromEntries(
        Object.entries(colors).filter(([key]) => !key.startsWith('seat'))
      );

      const colorData = {
        tenant_id: currentTenant.id,
        colors: generalColors,
        seat_colors: seatColors,
        updated_at: new Date().toISOString()
      };

      // Upsert en webstudio_colors
      const { error } = await supabase
        .from('webstudio_colors')
        .upsert(colorData, { 
          onConflict: 'tenant_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      console.log('✅ Colores WebStudio guardados:', colorData);
      message.success('Colores guardados exitosamente');
      
    } catch (error) {
      console.error('Error saving webstudio colors:', error);
      message.error('Error al guardar los colores');
    } finally {
      setLoading(false);
    }
  };

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
        { key: 'seatSold', label: 'Vendido' },
        { key: 'seatReserved', label: 'Reservado' },
        { key: 'seatCancelled', label: 'Cancelado' }
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
      <div className="grid grid-cols-6 gap-4">
        <div className="flex items-center gap-2"><SeatDot color={colors.seatAvailable} /> <span>Disponible</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSelectedMe} /> <span>Seleccionado por mí</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSelectedOther} /> <span>Seleccionado por otro</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatBlocked} /> <span>Bloqueado</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatSold} /> <span>Vendido</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatReserved} /> <span>Reservado</span></div>
        <div className="flex items-center gap-2"><SeatDot color={colors.seatCancelled} /> <span>Cancelado</span></div>
      </div>
    </div>
  );

  const handleSave = async () => {
    updateTheme(colors);
    try {
      // 🎨 GUARDAR EN webstudio_colors (nueva funcionalidad)
      await saveWebStudioColors();
      
      // 🎨 GUARDAR EN tenant_theme_settings (funcionalidad existente)
      if (currentTenant?.id) {
        await upsertTenantThemeSettings(currentTenant.id, colors);
      }
      
      message.success('Colores guardados en ambas ubicaciones');
    } catch (e) {
      console.error('Error saving colors:', e);
      message.error('Error al guardar los colores');
    }
  };

  const handleReset = () => {
    const reset = {
      seatAvailable: '#4CAF50',
      seatSelectedMe: '#1890ff',
      seatSelectedOther: '#faad14',
      seatBlocked: '#ff4d4f',
      seatSold: '#8c8c8c',
      seatReserved: '#722ed1',
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
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-1 rounded ${activeTab === 'events' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Colores por Evento
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

      {activeTab === 'events' && (
        <EventThemePanel />
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
