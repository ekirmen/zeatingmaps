// src/store/utils/analytics.js - VERSIÓN MÍNIMA

export const loadGtm = (gtmId) => {
  if (!gtmId || typeof window === 'undefined') return;
  console.log('GTM loading:', gtmId);
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });
  
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
};

export const loadMetaPixel = (pixelId) => {
  if (!pixelId || typeof window === 'undefined') return;
  console.log('Meta Pixel loading:', pixelId);
  
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onload = () => {
    if (window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  };
  document.head.appendChild(script);
};

export const trackEvent = (name, payload = {}) => {
  console.log('Event tracked:', name, payload);
  
  if (window.dataLayer) {
    window.dataLayer.push({
      event: name,
      ...payload,
    });
  }
};

export default { loadGtm, loadMetaPixel, trackEvent };