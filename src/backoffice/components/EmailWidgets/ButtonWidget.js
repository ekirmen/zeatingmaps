import React, { useState, useEffect } from 'react';
import { fetchEventos, fetchCanalesVenta } from '../../services/apibackoffice';

const ButtonWidget = ({ config = {}, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState({
    buttonType: '0',
    eventId: '0',
    channelId: '0',
    textButton: '',
    urlButton: '',
    margin_top: 10,
    margin_bottom: 10,
    ...config
  });

  const [eventsData, setEventsData] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [channelsData, setChannelsData] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // Cargar eventos y canales de la base de datos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar eventos
        setLoadingEvents(true);
        const eventos = await fetchEventos();
        const eventosConDefault = [
          { id: '0', nombre: 'Seleccione el evento' },
          ...eventos
        ];
        setEventsData(eventosConDefault);
        setLoadingEvents(false);

        // Cargar canales de venta
        setLoadingChannels(true);
        const canales = await fetchCanalesVenta();
        const canalesConDefault = [
          { id: '0', nombre: 'Seleccione el canal' },
          ...canales
        ];
        setChannelsData(canalesConDefault);
        setLoadingChannels(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // En caso de error, usar datos por defecto
        setEventsData([
          { id: '0', nombre: 'Seleccione el evento' },
          { id: 'error', nombre: 'Error al cargar eventos' }
        ]);
        setChannelsData([
          { id: '0', nombre: 'Seleccione el canal' },
          { id: 'error', nombre: 'Error al cargar canales' }
        ]);
        setLoadingEvents(false);
        setLoadingChannels(false);
      }
    };

    loadData();
  }, []);

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const buttonTypes = [
    { value: '0', label: 'Botón de compra' },
    { value: '1', label: 'Botón de invitación individual' },
    { value: '2', label: 'Renovación de abono de temporada' },
    { value: '3', label: 'Url personalizada' }
  ];

  // Los eventos ahora se cargan dinámicamente desde la base de datos

  // Los canales ahora se cargan dinámicamente desde la base de datos

  return (
    <div className="space-y-4">
      {/* Indicador de estado de carga */}
      {(loadingEvents || loadingChannels) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">
              Cargando datos desde la base de datos...
            </span>
          </div>
        </div>
      )}

      {/* Tipo de botón */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de botón
        </label>
        <div className="space-y-2">
          {buttonTypes.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="radio"
                name="buttonType"
                value={type.value}
                checked={localConfig.buttonType === type.value}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const newConfig = { 
                    ...localConfig, 
                    buttonType: newValue,
                    // Reset event selection for custom URL
                    eventId: newValue === '3' ? '' : localConfig.eventId,
                    channelId: newValue === '3' ? '' : localConfig.channelId
                  };
                  setLocalConfig(newConfig);
                  onConfigChange?.(newConfig);
                }}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Selección de evento (solo para tipos 0, 1, 2) */}
      {(localConfig.buttonType === '0' || localConfig.buttonType === '1' || localConfig.buttonType === '2') && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evento
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localConfig.eventId}
            onChange={(e) => handleConfigChange('eventId', e.target.value)}
            disabled={loadingEvents}
          >
            {loadingEvents ? (
              <option value="">Cargando eventos...</option>
            ) : (
              eventsData.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nombre}
                </option>
              ))
            )}
          </select>
          {loadingEvents && (
            <div className="text-xs text-gray-500 mt-1">
              Cargando eventos desde la base de datos...
            </div>
          )}
        </div>
      )}

      {/* Canal de venta (solo para tipos 0, 1, 2) */}
      {(localConfig.buttonType === '0' || localConfig.buttonType === '1' || localConfig.buttonType === '2') && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal de venta
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localConfig.channelId}
            onChange={(e) => handleConfigChange('channelId', e.target.value)}
            disabled={loadingChannels}
          >
            {loadingChannels ? (
              <option value="">Cargando canales...</option>
            ) : (
              channelsData.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.nombre}
                </option>
              ))
            )}
          </select>
          {loadingChannels && (
            <div className="text-xs text-gray-500 mt-1">
              Cargando canales desde la base de datos...
            </div>
          )}
        </div>
      )}

      {/* Texto del botón */}
      <div className="element-form-input">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto del botón
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Comprar ahora"
          value={localConfig.textButton}
          onChange={(e) => handleConfigChange('textButton', e.target.value)}
        />
      </div>

      {/* URL personalizada (solo para tipo 3) */}
      {localConfig.buttonType === '3' && (
        <div className="element-form-input">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Url
          </label>
          <input
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.website.com"
            value={localConfig.urlButton}
            onChange={(e) => handleConfigChange('urlButton', e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            El formato debe ser <i><b>https://www.website.com</b></i>
          </div>
        </div>
      )}

      {/* Personalización */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Personalización</h4>
        
        {/* Margen superior */}
        <div className="element-form-input mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Margen superior
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            value={localConfig.margin_top}
            onChange={(e) => handleConfigChange('margin_top', e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Unidades en px.
          </div>
        </div>

        {/* Margen inferior */}
        <div className="element-form-input mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Margen inferior
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            value={localConfig.margin_bottom}
            onChange={(e) => handleConfigChange('margin_bottom', e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            Unidades en px.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonWidget; 
