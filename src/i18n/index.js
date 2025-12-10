import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: (() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qLang = params.get('lang') || params.get('language');
        if (qLang) return qLang.toLowerCase().startsWith('en') ? 'en' : 'es';
        const navLang = navigator.language || navigator.userLanguage || 'es';
        return navLang.toLowerCase().startsWith('en') ? 'en' : 'es';
      }
      return 'es';
    })(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
