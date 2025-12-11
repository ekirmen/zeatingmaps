// Lightweight Promise-based loader for the Google Maps JavaScript API
// Usage:
//   import loadGoogleMaps from 'src/utils/loadGoogleMaps';
//   await loadGoogleMaps({ apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, libraries: ['places'] });
// Returns: window.google (resolves when google.maps is available)

let _loadingPromise = null;

function buildUrl({ apiKey, libraries, language, region, v = 'weekly', callbackName = '__gmapsLoader' }) {
  const params = new URLSearchParams();
  if (apiKey) params.set('key', apiKey);
  if (libraries && libraries.length) params.set('libraries', libraries.join(','));
  if (language) params.set('language', language);
  if (region) params.set('region', region);
  if (v) params.set('v', v);
  // Use callback query param for JSONP-style load

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

export default function loadGoogleMaps(options = {}) {
  const { apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY, libraries = [], language, region, v } = options;

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadGoogleMaps can only be used in the browser'));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = new Promise((resolve, reject) => {
    const callbackName = `__gmaps_loader_${Math.random().toString(36).slice(2, 9)}`;

    // Global callback
    window[callbackName] = function () {
      try {
        resolve(window.google);
      } catch (err) {
        reject(err);
      } finally {
        try {
          delete window[callbackName];
        } catch (e) {}
      }
    };

    const script = document.createElement('script');
    script.src = buildUrl({ apiKey, libraries, language, region, v, callbackName });
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
      try {
        delete window[callbackName];
      } catch (e) {}
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return _loadingPromise;
}
