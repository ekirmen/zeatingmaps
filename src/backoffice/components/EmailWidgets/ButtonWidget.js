import React, { useState } from 'react';

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

  const events = [
    { value: '0', label: 'Seleccione el evento' },
    { value: '1403', label: 'TEATRO NEGRO DE PRAGA 06 DE ABRIL' },
    { value: '1586', label: 'ANAKENA 15 DE SEPTIEMBRE 2023' },
    { value: '1640', label: 'PRUEBA 6' },
    { value: '2335', label: 'PITER ALBEIRO HOTEL JARAGUA 03 DE MARZO 2024' },
    { value: '2371', label: 'MARKO WEST PALM BEACH 20 DE ABRIL 2024' },
    { value: '2391', label: 'FASNET FEST 2024 COLONIA TOVAR FEBRERO' },
    { value: '2419', label: 'DIMENSION LATINA TOUR "AHORA O NUNCA" 15 DE MARZO ORLANDO' },
    { value: '2422', label: 'DIMENSIÓN LATINA TOUR "AHORA O NUNCA" 23 DE MARZO HOUSTON' },
    { value: '2435', label: 'PREMIER PÁDEL TOUR 2024 CATEGORÍA P2' },
    { value: '2465', label: 'PREMIER PÁDEL TOUR 2024 CATEGORÍA ABONO' },
    { value: '2522', label: 'VUELO CHÁRTER (ACA / VLN)' },
    { value: '2592', label: 'SOMOS VENEZUELA FEST 27 DE ABRIL ORLANDO' },
    { value: '2607', label: 'DIA DE LAS MADRES CON PIMPINELA 12 DE MAYO HOTEL HESPERIA' },
    { value: '2651', label: 'DIMENSION LATINA TOUR "AHORA O NUNCA" 15 DE MARZO' },
    { value: '2667', label: 'VOZ VEIS "ULTIMA FUNCIÒN" 15 DE SEPTIEMBRE' },
    { value: '2676', label: 'LA PELOTA DE LETRAS 20 DE JUNIO' },
    { value: '2795', label: 'GRAN AMANECER LLANERO 01 DE JUNIO' },
    { value: '2800', label: 'LA PELOTA DE LETRAS 20 DE JUNIO 7:00 PM' },
    { value: '2835', label: 'LA PELOTA DE LETRAS TAMPA 27 DE JUNIO 7:00 PM' },
    { value: '2893', label: 'DIMENSION LATINA TOUR AHORA O NUNCA ORLANDO 21 DE JUNIO' },
    { value: '2940', label: 'PRUEBA' },
    { value: '2959', label: 'MIMI LAZO EN MI SEXTA BODA 08 DE SEPTIEMBRE' },
    { value: '3054', label: 'DON MEDARDO Y SUS PLAYERS ORLANDO 16 DE AGOSTO' },
    { value: '3055', label: 'DON MEDARDO Y SUS PLAYERS MIAMI 17 DE AGOSTO' },
    { value: '3107', label: 'PRUEBA DE PLAZOS' },
    { value: '3109', label: 'COPA MILLONARIA ANIVERSARIO FORTUNA RANCH 26 OCTUBRE' },
    { value: '3110', label: 'INSCRIPCION COPA MILLONARIA ANIVERSARIO FORTUNA RANCH 26 DE OCTUBRE' },
    { value: '3118', label: 'LA PELOTA DE LETRAS JACKSONVILLE 13 DE SEPTIEMBRE' },
    { value: '3148', label: 'KARINA ORLANDO 14 DE FEBRERO' },
    { value: '3149', label: 'VENEZUELA ES MUJER CARACAS 18 DE MAYO 2025' },
    { value: '3154', label: 'DEMO' },
    { value: '3242', label: 'KARINA TAMPA 21 DE SEPTIEMBRE' },
    { value: '3256', label: 'KARINA ORLANDO 20 SEPTIEMBRE' },
    { value: '3290', label: 'CRIOLLO HOUSE & FERNANDO TOVAR "VENEZUELA LO ES TODO" 20 DE SEPTIEMBRE' },
    { value: '3303', label: 'OKTOBER BEER FEST 2024' },
    { value: '3308', label: 'VIVA VENEZUELA RANCHO LA QUINTA TERESA 14 SEPTIEMBRE' },
    { value: '3311', label: 'CRIOLLO HOUSE & FERNANDO TOVAR "VENEZUELA LO ES TODO" 5 DE OCTUBRE ARIZONA' },
    { value: '3324', label: 'GRAN REENCUENTRO ZULIANO LA BAJADA DE LOS FURROS 18 OCTUBRE ORLANDO' },
    { value: '3357', label: 'LA RUMBA BLANCA DE LA SALSA SENSUAL 09 DE NOVIEMBRE' },
    { value: '3361', label: '1st INTERNATIONAL GOLF TOURNAMENT INVITACIONAL' },
    { value: '3372', label: 'IMARAY ULLOA "LA TÓXICA" 24 DE NOVIEMBRE' },
    { value: '3394', label: 'EMILIO LOVERA "AHORA EL MALANDRO SI ESTA ASUSTADO" 02 DE NOVIEMBRE' },
    { value: '3433', label: 'UNA NOCHE EN JABEGUERO CON CARLITOS BRONCO ARIZONA 26 DE OCTUBRE' },
    { value: '3444', label: 'CARLOS ALFREDO FATULE 02 DE NOVIEMBRE MIAMI' },
    { value: '3463', label: 'OMAR COURTZ 22 DE NOVIEMBRE' },
    { value: '3468', label: 'Marko 26 de Octubre Denver- Oficial' },
    { value: '3469', label: 'Marko 26 de Octubre Denver- influencer 1' },
    { value: '3470', label: 'Marko 26 de Octubre Denver-influencer 2' },
    { value: '3504', label: 'LOS MALIBU BROTHERS "PELA BOLA TOUR" 14 DE NOVIEMBRE' },
    { value: '3507', label: 'LAS DIVAS DEL FOLKLORE 22 DE DICIEMBRE' },
    { value: '3509', label: 'LUIS FERNANDEZ NO ERES TU ¡SOY YO! 19 DE MARZO' },
    { value: '3514', label: 'LAS DIVAS DEL FOLKLORE 26 DE DICIEMBRE' },
    { value: '3517', label: 'LAS DIVAS DEL FOLKLORE 21 DE DICIEMBRE' },
    { value: '3520', label: 'LAS DIVAS DEL FOLKLORE 20 DE DICIEMBRE' },
    { value: '3552', label: 'ALL STAR GAME 14 DE DICIEMBRE (STREAMING)' },
    { value: '3555', label: 'SHAILA DURCAL "TRIBUTO A MI MADRE" 15 DE FEBRERO' },
    { value: '3576', label: 'SHAILA DURCAL "CONCIERTO TRIBUTO A MI MADRE" 13 Y 14 DE FEBRERO' },
    { value: '3594', label: 'LAURA CHIMARAS "MEMORIAS" 22 DE FEBRERO' },
    { value: '3615', label: 'KARINA TAMPA 13 DE FEBRERO' },
    { value: '3695', label: 'FIESTA DE ELORZA CON EMILY GALAVIZ 30 DE MARZO' },
    { value: '3765', label: 'TEATRO DE VALENCIA 2025' },
    { value: '3839', label: 'SCARLETT LINARES TOUR USA 11 DE MAYO' },
    { value: '3879', label: 'ESTOS TAMBIEN- LIVE 10 DE ABRIL' },
    { value: '3911', label: 'LAURA CHIMARAS "MEMORIAS" 22 DE MAYO' },
    { value: '3925', label: 'PUERTO CABELLO OPEN 2025 DEL 03 AL 05 DE ABRIL' },
    { value: '3996', label: 'MARIACA SEMPRÚN 28 DE JUNIO' },
    { value: '4001', label: 'MERENGAZO "OMAR ENRIQUE Y SUS AMIGOS" 13 DE JUNIO' },
    { value: '4064', label: 'CHICHIRIVICHE FESTIVAL MUSICAL 2025 CON NELSON VÉLAZQUEZ 14 DE AGOSTO' },
    { value: '4089', label: 'AMANECER VALLENATO 05 DE JULIO' },
    { value: '4149', label: '"LAS QUIERO A LAS DOS" CON MIMI LAZO 28 DE JUNIO' },
    { value: '4216', label: 'LA PELOTA DE LETRAS 19 DE SEPTIEMBRE' },
    { value: '4218', label: 'CONCIERTO EN EL PARQUE CON KARINA 19 DE JULIO' },
    { value: '4249', label: 'NOREH 03 DE OCTUBRE' },
    { value: '4250', label: 'NOREH 04 DE OCTUBRE' },
    { value: '4289', label: 'OMAR COURTZ 17 DE OCTUBRE' },
    { value: '4299', label: 'ER CONDE DEL GUACHARO 04 DE OCTUBRE' },
    { value: '4371', label: 'OKTOBER BEER FEST 2025 COLONIA TOVAR' },
    { value: '713', label: 'EVENTO DEMO' }
  ];

  const channels = [
    { value: '0', label: 'Seleccione el canal' },
    { value: '8', label: 'Marca blanca 1 - https://kreatickets.pagatusboletos.com/tickets/' },
    { value: '2', label: 'Internet - https://ventas.kreatickets.com/venta/' },
    { value: '999', label: 'Test - https://ventas.kreatickets.com/test/' }
  ];

  return (
    <div className="space-y-4">
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
          >
            {events.map((event) => (
              <option key={event.value} value={event.value}>
                {event.label}
              </option>
            ))}
          </select>
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
          >
            {channels.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
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