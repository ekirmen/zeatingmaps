import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlinePlus, AiOutlineLink, AiOutlineShoppingCart, AiOutlineMail } from 'react-icons/ai';

const CampaignButtonGenerator = ({ campaignId, onButtonGenerated }) => {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [buttonType, setButtonType] = useState('0');
  const [customUrl, setCustomUrl] = useState('');
  const [buttonText, setButtonText] = useState('');

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos de campaña
      setTimeout(() => {
        setCampaign({
          id: campaignId,
          name: 'Campaña de ejemplo',
          type: 'newsletter',
          events: [
            { id: '1403', name: 'TEATRO NEGRO DE PRAGA 06 DE ABRIL' },
            { id: '1586', name: 'ANAKENA 15 DE SEPTIEMBRE 2023' },
            { id: '1640', name: 'PRUEBA 6' }
          ],
          channels: [
            { id: '8', name: 'Marca blanca 1', url: 'https://kreatickets.pagatusboletos.com/tickets/' },
            { id: '2', name: 'Internet', url: 'https://ventas.kreatickets.com/venta/' },
            { id: '999', name: 'Test', url: 'https://ventas.kreatickets.com/test/' }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error('Error al cargar datos de la campaña');
      setLoading(false);
    }
  };

  const generateButton = () => {
    if (!campaign) {
      toast.error('No hay datos de campaña disponibles');
      return;
    }

    const buttonConfig = {
      type: 'Botón',
      config: {
        buttonType: buttonType,
        eventId: selectedEvent,
        channelId: selectedChannel,
        textButton: buttonText || getDefaultButtonText(),
        urlButton: customUrl,
        margin_top: 10,
        margin_bottom: 10
      }
    };

    onButtonGenerated(buttonConfig);
    toast.success('Botón generado automáticamente');
  };

  const getDefaultButtonText = () => {
    switch (buttonType) {
      case '0': return 'Comprar ahora';
      case '1': return 'Invitación';
      case '2': return 'Renovar abono';
      case '3': return 'Visitar sitio';
      default: return 'Hacer clic';
    }
  };

  const getButtonTypeLabel = () => {
    switch (buttonType) {
      case '0': return 'Botón de compra';
      case '1': return 'Botón de invitación individual';
      case '2': return 'Renovación de abono de temporada';
      case '3': return 'Url personalizada';
      default: return 'Botón personalizado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando datos de campaña...</span>
      </div>
    );
  }

  return (
    <div className="campaign-button-generator">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Generador Automático de Botones
        </h3>
        <p className="text-sm text-gray-600">
          Genera botones automáticamente basados en los datos de la campaña
        </p>
      </div>

      {campaign && (
        <div className="space-y-4">
          {/* Información de la campaña */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Campaña: {campaign.name}</h4>
            <p className="text-sm text-blue-600">ID: {campaign.id}</p>
          </div>

          {/* Tipo de botón */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de botón
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setButtonType('0')}
                className={`p-3 rounded-lg border text-left ${
                  buttonType === '0' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AiOutlineShoppingCart className="inline mr-2" />
                Compra
              </button>
              <button
                onClick={() => setButtonType('1')}
                className={`p-3 rounded-lg border text-left ${
                  buttonType === '1' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AiOutlineMail className="inline mr-2" />
                Invitación
              </button>
              <button
                onClick={() => setButtonType('2')}
                className={`p-3 rounded-lg border text-left ${
                  buttonType === '2' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AiOutlinePlus className="inline mr-2" />
                Renovación
              </button>
              <button
                onClick={() => setButtonType('3')}
                className={`p-3 rounded-lg border text-left ${
                  buttonType === '3' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AiOutlineLink className="inline mr-2" />
                URL Personalizada
              </button>
            </div>
          </div>

          {/* Selección de evento (solo para tipos 0, 1, 2) */}
          {(buttonType === '0' || buttonType === '1' || buttonType === '2') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evento asociado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">Selecciona un evento</option>
                {campaign.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Canal de venta (solo para tipos 0, 1, 2) */}
          {(buttonType === '0' || buttonType === '1' || buttonType === '2') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canal de venta
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="">Selecciona un canal</option>
                {campaign.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* URL personalizada (solo para tipo 3) */}
          {buttonType === '3' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL personalizada
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.ejemplo.com"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>
          )}

          {/* Texto del botón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto del botón
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={getDefaultButtonText()}
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
            />
          </div>

          {/* Botón de generación */}
          <div className="pt-4">
            <button
              onClick={generateButton}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <AiOutlinePlus />
              Generar Botón Automáticamente
            </button>
          </div>

          {/* Vista previa del botón */}
          {(selectedEvent || customUrl || buttonText) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Vista previa del botón:</h4>
              <div className="text-center">
                <button
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
                  disabled
                >
                  {buttonText || getDefaultButtonText()}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <p>Tipo: {getButtonTypeLabel()}</p>
                {selectedEvent && <p>Evento: {campaign.events.find(e => e.id === selectedEvent)?.name}</p>}
                {selectedChannel && <p>Canal: {campaign.channels.find(c => c.id === selectedChannel)?.name}</p>}
                {customUrl && <p>URL: {customUrl}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {!campaign && (
        <div className="text-center py-8 text-gray-500">
          <AiOutlineMail className="mx-auto text-4xl mb-4" />
          <p>Selecciona una campaña para generar botones automáticamente</p>
        </div>
      )}
    </div>
  );
};

export default CampaignButtonGenerator; 