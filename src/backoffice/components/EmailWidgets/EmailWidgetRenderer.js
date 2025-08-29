import React from 'react';
import {
  ButtonWidget,
  TextWidget,
  BannerWidget,
  EventWidget,
  HtmlWidget
} from './index';

const EmailWidgetRenderer = ({ widgetType, config = {}, onConfigChange }) => {
  console.log('🧩 [EmailWidgetRenderer] Rendering widget:', widgetType, config);

  const renderWidget = () => {
    switch (widgetType) {
      case 'Botón':
        return (
          <ButtonWidget
            config={config}
            onConfigChange={onConfigChange}
          />
        );

      case 'Título':
        return (
          <TextWidget
            config={config}
            onConfigChange={onConfigChange}
            type="titulo"
          />
        );

      case 'Subtítulo':
        return (
          <TextWidget
            config={config}
            onConfigChange={onConfigChange}
            type="subtitulo"
          />
        );

      case 'Paragraph':
        return (
          <TextWidget
            config={config}
            onConfigChange={onConfigChange}
            type="paragraph"
          />
        );

      case 'Banner':
        return (
          <BannerWidget
            config={config}
            onConfigChange={onConfigChange}
          />
        );

      case 'Información del evento':
        return (
          <EventWidget
            config={config}
            onConfigChange={onConfigChange}
            type="informacion-evento"
          />
        );

      case 'Evento dinámico banner grande':
        return (
          <EventWidget
            config={config}
            onConfigChange={onConfigChange}
            type="banner-grande"
          />
        );

      case 'Evento dinámico banner mediano':
        return (
          <EventWidget
            config={config}
            onConfigChange={onConfigChange}
            type="banner-mediano"
          />
        );

      case 'Código HTML':
        return (
          <HtmlWidget
            config={config}
            onConfigChange={onConfigChange}
          />
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Widget no encontrado: {widgetType}
          </div>
        );
    }
  };

  return (
    <div className="email-widget-renderer">
      {renderWidget()}
    </div>
  );
};

  export default EmailWidgetRenderer;
