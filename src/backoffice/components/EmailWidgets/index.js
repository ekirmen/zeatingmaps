// Email Widget Components
export { default as ButtonWidget } from './ButtonWidget';
export { default as TextWidget } from './TextWidget';
export { default as BannerWidget } from './BannerWidget';
export { default as EventWidget } from './EventWidget';
export { default as HtmlWidget } from './HtmlWidget';
export { default as EmailPreview } from './EmailPreview';
export { default as CampaignButtonGenerator } from './CampaignButtonGenerator';

// Conservative helper: provide a default config factory for widget types.
// Kept minimal to avoid parse errors and provide a predictable API.
export function getWidgetDefaultConfig(type) {
  switch (type) {
    case 'Título':
    case 'Subtítulo':
      return { texto: '' };
    case 'Banner':
      return { texto: '', imagen: '' };
    case 'Información del evento':
    case 'Evento dinámico banner grande':
    case 'Evento dinámico banner mediano':
      return { eventoId: '', funcionId: '' };
    case 'Código HTML':
      return { html: '', css: '', js: '' };
    default:
      return {};
  }
}

// Export a default empty mapping to avoid import errors elsewhere.
export const widgetComponentMap = {
  button: ButtonWidget,
  text: TextWidget,
  banner: BannerWidget,
  event: EventWidget,
  html: HtmlWidget
};

export default widgetComponentMap;
