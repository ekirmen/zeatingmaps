// Email Widget Components
export { default as ButtonWidget } from './ButtonWidget';
export { default as TextWidget } from './TextWidget';
export { default as BannerWidget } from './BannerWidget';
export { default as EventWidget } from './EventWidget';
export { default as HtmlWidget } from './HtmlWidget';
export { default as EmailPreview } from './EmailPreview';
export { default as CampaignButtonGenerator } from './CampaignButtonGenerator';

// Widget configuration helpers
export const getWidgetConfig = (widgetType) => {
  switch (widgetType) {
    case 'Botón':
      return {
        buttonType: '0',
        eventId: '0',
        channelId: '0',
        textButton: '',
        urlButton: '',
        margin_top: 10,
        margin_bottom: 10
      };
    
    case 'Título':
    case 'Subtítulo':
    case 'Paragraph':
      return {
        texto: ''
      };
    
    case 'Banner':
      return {
        texto: '',
        imagen: ''
      };
    
    case 'Información del evento':
    case 'Evento dinámico banner grande':
    case 'Evento dinámico banner mediano':
      return {
        eventoId: '',
        funcionId: ''
      };
    
    case 'Código HTML':
      return {
        html: '',
        css: '',
        js: ''
      };
    
    default:
      return {};
  }
};

// Widget type mapping
export const WIDGET_TYPES = {
  'Botón': 'button',
  'Título': 'text',
  'Subtítulo': 'text',
  'Paragraph': 'text',
  'Banner': 'banner',
  'Información del evento': 'event',
  'Evento dinámico banner grande': 'event',
  'Evento dinámico banner mediano': 'event',
  'Código HTML': 'html'
};

// Widget component mapping
export const WIDGET_COMPONENTS = {
  'Botón': 'ButtonWidget',
  'Título': 'TextWidget',
  'Subtítulo': 'TextWidget',
  'Paragraph': 'TextWidget',
  'Banner': 'BannerWidget',
  'Información del evento': 'EventWidget',
  'Evento dinámico banner grande': 'EventWidget',
  'Evento dinámico banner mediano': 'EventWidget',
  'Código HTML': 'HtmlWidget'
}; 
